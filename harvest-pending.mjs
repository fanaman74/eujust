// Harvest "pending before the Court" notices (CELEX ...TN..., i.e. OJ C "case brought")
// that fall inside this site's subject matter: harassment at work, staff regulations,
// maladministration, European official.
//
// Source: EU Publications Office Cellar SPARQL (metadata) and, optionally, the OJ notice
// text through the EUR-Lex reader (the site itself is static; run this at build time).
//
//   node harvest-pending.mjs            # metadata only
//   node harvest-pending.mjs --enrich   # also pull parties + pleas from the notice text
//
// Writes data/pending.json.

import fs from "node:fs";

const SPARQL = "https://publications.europa.eu/webapi/rdf/sparql";

// EuroVoc concepts that define the collection's scope.
const CONCEPTS = {
  "http://eurovoc.europa.eu/c_e4f135ba": "Harassment at work",
  "http://eurovoc.europa.eu/c_871b5612": "Staff regulations (EU)",
  "http://eurovoc.europa.eu/c_58f7390b": "Maladministration",
  "http://eurovoc.europa.eu/1048": "European official",
};

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

const asked = async (q) => {
  const res = await fetch(`${SPARQL}?query=${encodeURIComponent(q)}&format=application%2Fsparql-results%2Bjson`, {
    headers: { "User-Agent": "eu-just-harvester/1.0", Accept: "application/sparql-results+json" },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`SPARQL ${res.status}: ${body.slice(0, 300)}`);
  return JSON.parse(body).results.bindings;
};

const COURT = { GCEU: "General Court", CJEU: "Court of Justice", CST: "Civil Service Tribunal" };

console.log("querying Cellar…");
const rows = await asked(query);
console.log(`${rows.length} concept-rows`);

// Collapse one record per case, collecting its matched topics.
const byCase = new Map();
for (const row of rows) {
  const celex = row.celex.value;
  if (!byCase.has(celex)) {
    const courtKey = (row.court?.value || "").split("/").pop();
    const year = Number(row.year.value);
    const number = row.number.value;
    byCase.set(celex, {
      id: celex,
      celex,
      caseNo: `${courtKey === "GCEU" ? "T" : "C"}-${number}/${String(year).slice(2)}`,
      court: COURT[courtKey] || courtKey,
      filedISO: row.filed.value,
      ojISO: row.ojdate?.value || "",
      topics: new Set(),
      eli: `http://data.europa.eu/eli/C/${row.ojdate?.value?.slice(0, 4) || year}/`,
      url: `https://eur-lex.europa.eu/legal-content/EN/CASE/?uri=CELEX:${celex}`,
    });
  }
  const label = CONCEPTS[row.concept.value];
  if (label) byCase.get(celex).topics.add(label);
}

let records = [...byCase.values()].map((r) => ({ ...r, topics: [...r.topics] }));
console.log(`${records.length} distinct cases`);

// Optional enrichment: the OJ notice text carries the parties and the pleas.
if (process.argv.includes("--enrich")) {
  const limit = Number(process.env.ENRICH_LIMIT || 12);
  console.log(`enriching ${Math.min(limit, records.length)} newest notices…`);
  for (const rec of records.slice(0, limit)) {
    try {
      const res = await fetch(`https://r.jina.ai/https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${rec.celex}`, {
        headers: { "User-Agent": "eu-just-harvester/1.0" },
      });
      const text = await res.text();
      const title = text.match(/Case [TC]-\d+\/\d+:\s*Action brought[^\n]*/)?.[0]
        || text.match(/Title\s+(Case [TC][^\n]+)/)?.[1];
      if (title) rec.title = title.replace(/\s+/g, " ").trim();
      const parties = rec.title?.match(/–\s*(.+?)\s+v\s+(.+)$/);
      if (parties) { rec.applicant = parties[1].trim(); rec.defendant = parties[2].trim(); }
      const ojRef = text.match(/OJ C, (C\/\d{4}\/\d+), (\d{2}\.\d{2}\.\d{4})/);
      if (ojRef) { rec.ojRef = ojRef[1]; rec.ojDateLabel = ojRef[2]; }
      const body = text.slice(text.indexOf("Form of order sought"));
      const pleas = body.match(/Pleas in law and main arguments([\s\S]{0,900})/)?.[1];
      if (pleas) rec.pleas = pleas.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 480);
      console.log(`  ${rec.caseNo} -> ${rec.title ? "title" : "no title"}${rec.applicant ? ", parties" : ""}`);
      await new Promise((r) => setTimeout(r, 600));
    } catch (error) {
      console.log(`  ${rec.caseNo} enrich failed: ${error.message.slice(0, 100)}`);
    }
  }
}

records.sort((a, b) => b.filedISO.localeCompare(a.filedISO));
const payload = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: "EUR-Lex / Cellar SPARQL — OJ C notices of actions brought (CELEX …TN…)",
  scope: Object.values(CONCEPTS),
  count: records.length,
  cases: records,
};
fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/pending.json", JSON.stringify(payload, null, 2));
console.log(`wrote data/pending.json (${records.length} cases)`);
