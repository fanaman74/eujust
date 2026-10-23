// Source queries shared by harvest-pending.mjs and daily-check.mjs.
//
// EUR-Lex itself sits behind an AWS WAF challenge, so everything here goes through
// the EU Publications Office Cellar SPARQL endpoint instead. Two traps:
//   * literals do not match directly - use FILTER(STR(?x) = "...")
//   * pending notices carry EuroVoc concepts, but judgments do not; judgments are
//     scoped by the STAFF role qualifier instead.

const SPARQL = "https://publications.europa.eu/webapi/rdf/sparql";

// EuroVoc concepts that define this site's subject matter.
export const CONCEPTS = {
  "http://eurovoc.europa.eu/c_e4f135ba": "Harassment at work",
  "http://eurovoc.europa.eu/c_871b5612": "Staff regulations (EU)",
  "http://eurovoc.europa.eu/c_58f7390b": "Maladministration",
  "http://eurovoc.europa.eu/1048": "European official",
};

const COURT = { GCEU: "General Court", CJEU: "Court of Justice", CST: "Civil Service Tribunal" };

export async function sparql(query) {
  const res = await fetch(`${SPARQL}?query=${encodeURIComponent(query)}&format=application%2Fsparql-results%2Bjson`, {
    headers: { "User-Agent": "eu-just-harvester/1.0", Accept: "application/sparql-results+json" },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`SPARQL ${res.status}: ${body.slice(0, 240)}`);
  return JSON.parse(body).results.bindings;
}

/* ---------- pending actions: OJ C "case brought" notices (CELEX ...TN...) ---------- */

export async function fetchPending() {
  const query = `
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT ?celex ?number ?year ?court ?filed ?ojdate ?concept WHERE {
  ?work cdm:resource_legal_type ?type ;
        cdm:resource_legal_id_celex ?celex ;
        cdm:resource_legal_number_natural ?number ;
        cdm:resource_legal_year ?year ;
        cdm:work_created_by_agent ?court ;
        cdm:work_date_document ?filed ;
        cdm:work_is_about_concept_eurovoc ?concept .
  OPTIONAL { ?work cdm:work_date_creation_legacy ?ojdate }
  VALUES ?concept { ${Object.keys(CONCEPTS).map((c) => `<${c}>`).join(" ")} }
  FILTER(STR(?type) = "TN")
  FILTER(STR(?year) >= "2025")
}
ORDER BY DESC(?filed)`;

  const rows = await sparql(query);
  const byCase = new Map();

  for (const row of rows) {
    const celex = row.celex.value;
    if (!byCase.has(celex)) {
      const courtKey = (row.court?.value || "").split("/").pop();
      const year = Number(row.year.value);
      byCase.set(celex, {
        id: celex,
        celex,
        caseNo: `${courtKey === "GCEU" ? "T" : "C"}-${row.number.value}/${String(year).slice(2)}`,
        court: COURT[courtKey] || courtKey,
        filedISO: row.filed.value,
        ojISO: row.ojdate?.value || "",
        topics: new Set(),
        url: `https://eur-lex.europa.eu/legal-content/EN/CASE/?uri=CELEX:${celex}`,
      });
    }
    const label = CONCEPTS[row.concept.value];
    if (label) byCase.get(celex).topics.add(label);
  }

  const cases = [...byCase.values()]
    .map((entry) => ({ ...entry, topics: [...entry.topics] }))
    .sort((a, b) => b.filedISO.localeCompare(a.filedISO));

  return { cases, rowCount: rows.length };
}

/* ---------- judgments and orders: TJ / TO on staff cases ---------- */

export async function fetchRulings({ days = 45 } = {}) {
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  // Judgments carry resource_legal_number_natural_celex, not resource_legal_number_natural,
  // so the case number is derived from the CELEX id instead of joined.
  const query = `
PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT ?celex ?type ?court ?date WHERE {
  ?work cdm:resource_legal_type ?type ;
        cdm:resource_legal_id_celex ?celex ;
        cdm:work_created_by_agent ?court ;
        cdm:work_date_document ?date ;
        cdm:case-law_requested_by_agent ?role .
  FILTER(STR(?type) IN ("TJ", "TO"))
  FILTER(STR(?date) >= "${since}")
  FILTER(STR(?role) = "http://publications.europa.eu/resource/authority/role-qualifier/STAFF")
}
ORDER BY DESC(?date)`;

  const rows = await sparql(query);
  const seen = new Map();
  for (const row of rows) {
    const celex = row.celex.value;
    if (seen.has(celex)) continue;
    const parsed = celex.match(/^6(\d{4})(TJ|TO)(\d{4})/);
    if (!parsed) continue;
    const [, year, kindCode, number] = parsed;
    const courtKey = (row.court?.value || "").split("/").pop();
    seen.set(celex, {
      celex,
      caseNo: `${courtKey === "GCEU" ? "T" : "C"}-${Number(number)}/${year.slice(2)}`,
      court: COURT[courtKey] || courtKey,
      kind: kindCode === "TJ" ? "Judgment" : "Order",
      dateISO: row.date.value,
      url: `https://eur-lex.europa.eu/legal-content/EN/CASE/?uri=CELEX:${celex}`,
    });
  }
  const items = [...seen.values()].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  return { items, windowStart: since };
}
