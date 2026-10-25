// Harvest "pending before the Court" notices (CELEX ...TN..., OJ C "case brought")
// that fall inside this site's subject matter. Writes data/pending.json.
//
//   node harvest-pending.mjs            # metadata only
//   node harvest-pending.mjs --enrich   # also pull parties and pleas from the notice text
//
// The daily schedule runs this through daily-check.mjs; this is the manual entry point.

import fs from "node:fs";
import { fetchPending, CONCEPTS } from "./sources.mjs";

let previous = { cases: [] };
try { previous = JSON.parse(fs.readFileSync("data/pending.json", "utf8")); } catch { /* first harvest */ }
const oldById = new Map((previous.cases || []).map((entry) => [entry.id, entry]));
const { cases: fetchedCases } = await fetchPending();
const cases = fetchedCases.map((record) => {
  const old = oldById.get(record.id);
  return old ? {
    ...record,
    ...(old.lawyers ? { lawyers: old.lawyers } : {}),
    ...(old.defendant ? { defendant: old.defendant } : {}),
  } : record;
});
console.log(`${cases.length} pending actions in scope`);

// Optional enrichment: the OJ notice text carries the parties and the pleas.
if (process.argv.includes("--enrich")) {
  const limit = Number(process.env.ENRICH_LIMIT || 12);
  console.log(`enriching ${Math.min(limit, cases.length)} newest notices…`);
  for (const record of cases.slice(0, limit)) {
    try {
      const res = await fetch(`https://r.jina.ai/https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${record.celex}`, {
        headers: { "User-Agent": "eu-just-harvester/1.0" },
      });
      const text = await res.text();
      const title = text.match(/Case [TC]-\d+\/\d+:\s*Action brought[^\n]*/)?.[0];
      if (title) record.title = title.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const parties = record.title?.match(/–\s*(.+?)\s+v\s+(.+)$/);
      if (parties) { record.applicant = parties[1].trim(); record.defendant = parties[2].trim(); }
      const lawyers = text.match(/Applicant:[^\n]*?\(represented by:\s*([^\n)]+)\)/i)?.[1]
        ?.replace(/,\s*(?:lawyers?|solicitors?)\.?\s*$/i, "")
        ?.trim();
      if (lawyers) record.lawyers = lawyers;
      const defendant = text.match(/Defendant:\s*([^\n]+)/i)?.[1]
        ?.replace(/\s*\(represented by:[\s\S]*$/i, "")
        ?.replace(/\s*[.;]\s*$/, "")
        ?.replace(/\s+/g, " ")
        ?.trim();
      if (defendant) record.defendant = defendant;
      const ojRef = text.match(/OJ C, (C\/\d{4}\/\d+), (\d{2}\.\d{2}\.\d{4})/);
      if (ojRef) { record.ojRef = ojRef[1]; record.ojDateLabel = ojRef[2]; }
      const pleas = text.match(/Pleas in law and main arguments([\s\S]{0,900})/)?.[1];
      if (pleas) record.pleas = pleas.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 480);
      console.log(`  ${record.caseNo} -> ${record.title ? "title" : "no title"}${record.applicant ? ", parties" : ""}`);
      await new Promise((resolve) => setTimeout(resolve, 600));
    } catch (error) {
      console.log(`  ${record.caseNo} enrich failed: ${error.message.slice(0, 100)}`);
    }
  }
}

const payload = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: "EUR-Lex / Cellar SPARQL — OJ C notices of actions brought (CELEX …TN…)",
  scope: Object.values(CONCEPTS),
  count: cases.length,
  cases,
};

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/pending.json", JSON.stringify(payload, null, 2));
console.log(`wrote data/pending.json (${cases.length} cases)`);
