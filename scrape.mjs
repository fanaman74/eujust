import fs from "node:fs";
import path from "node:path";
import { parseHTML } from "linkedom";

const clean = (value) => (value || "").replace(/\s+/g, " ").trim();
const stripTab = (value) => clean(value).replace(/\s*\(opens the official source in a new tab\)\s*$/i, "");
const read = (file) => fs.readFileSync(file, "utf8");

const topicMeta = {
  "Workplace harassment": {
    slug: "workplace-harassment",
    description: "Find collected Court of Justice and General Court records connected to harassment, bullying and dignity at work. Start with the case reference, then read the official document for the facts and outcome.",
    h1: "Workplace harassment in EU case law",
    lede: "Find collected Court of Justice and General Court records connected to harassment, bullying and dignity at work. Start with the case reference, then read the official document for the facts and outcome."
  },
  "Employment discrimination": {
    slug: "employment-discrimination",
    description: "Explore collected European court records connected to discrimination, equal treatment and retaliation at work. Search by a party, case number or term, and check the source for the precise legal issue.",
    h1: "Employment discrimination in EU case law",
    lede: "Explore collected European court records connected to discrimination, equal treatment and retaliation at work. Search by a party, case number or term, and check the source for the precise legal issue."
  },
  "Psychosocial risks": {
    slug: "psychosocial-risk",
    description: "Follow collected EU court records connected to psychosocial risks and mental health at work. Search terms such as occupational stress and burnout can help you find a starting point for reading the official record.",
    h1: "Psychosocial risks & mental health at work",
    lede: "Follow collected EU court records connected to psychosocial risks and mental health at work. Search terms such as occupational stress and burnout can help you find a starting point for reading the official record."
  }
};

const slugForTag = (tag) => topicMeta[tag]?.slug || tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ---------------- cases ---------------- */

const caseFiles = fs.readdirSync("_cases").filter((file) => file.endsWith(".html"));
const cases = [];

for (const file of caseFiles) {
  const id = Number(file.replace(".html", ""));
  const { document } = parseHTML(read(path.join("_cases", file)));

  const meta = [...document.querySelectorAll(".detail-meta span")].map((node) => clean(node.textContent));
  const facts = {};
  for (const row of document.querySelectorAll(".facts div")) {
    facts[clean(row.querySelector("dt")?.textContent)] = clean(row.querySelector("dd")?.textContent);
  }

  const sourcePanel = document.querySelector("#h-source")?.closest(".panel");
  const abstract = clean(sourcePanel?.querySelector(".prose > p")?.textContent);
  const fullTitle = clean(sourcePanel?.querySelector("details p")?.textContent);
  const tags = [...document.querySelectorAll(".detail-aside .tags .tag")].map((node) => clean(node.textContent));
  const time = document.querySelector(".detail-meta time");
  const source = document.querySelector(".detail-source-action")?.getAttribute("href") || "";

  cases.push({
    id,
    title: clean(document.querySelector("h1")?.textContent),
    subject: clean(document.querySelector(".lede")?.textContent),
    caseNo: facts["Case number"] || meta[0] || "",
    court: facts.Court || meta[1] || "",
    dateISO: time?.getAttribute("datetime") || "",
    dateLabel: facts["Judgment date"] || meta[2]?.replace(/^Judgment of\s*/i, "") || "",
    celex: facts.CELEX || "",
    source,
    abstract,
    fullTitle,
    tags,
    topicSlugs: tags.map(slugForTag),
    publication: facts["Publication date"] || "Not recorded",
    language: facts.Language || "English source version",
    updated: facts["Record updated"] || "23 October 2026"
  });
}

cases.sort((a, b) => b.dateISO.localeCompare(a.dateISO) || a.caseNo.localeCompare(b.caseNo));
cases.forEach((entry, index) => {
  entry.order = index + 1;
  entry.newerId = index > 0 ? cases[index - 1].id : null;
  entry.olderId = index < cases.length - 1 ? cases[index + 1].id : null;
});

const topicCases = Object.fromEntries(
  Object.entries(topicMeta).map(([name, meta]) => [meta.slug, cases.filter((entry) => entry.tags.includes(name))])
);

/* ---------------- topics ---------------- */

const topics = Object.entries(topicMeta).map(([name, meta]) => {
  const file = `_page-topics-${meta.slug}.html`;
  const { document } = parseHTML(read(file));
  const context = [...document.querySelectorAll(".topic-context p")].map((node) => clean(node.textContent)).filter(Boolean);
  const terms = [...document.querySelectorAll(".topic-context .collection-topics a")].map((node) => clean(node.textContent));
  const related = [...document.querySelectorAll(".topic-context + .topic-context a, a[href^='/topics/']")]
    .map((node) => [clean(node.textContent), node.getAttribute("href")])
    .filter(([label, href]) => href && href.startsWith("/topics/") && !href.endsWith(meta.slug));

  return {
    name,
    ...meta,
    context,
    terms,
    related: [...new Map(related.map(([label, href]) => [href, { label, slug: href.split("/").pop() }])).values()],
    cases: topicCases[meta.slug].map((entry) => entry.id)
  };
});

const topicDirectory = (() => {
  const { document } = parseHTML(read("_page-topics.html"));
  return [...document.querySelectorAll(".topic-directory section")].map((section) => ({
    title: clean(section.querySelector("h2")?.textContent),
    description: clean(section.querySelector("p")?.textContent),
    href: section.querySelector("h2 a")?.getAttribute("href") || ""
  }));
})();

/* ---------------- rules ---------------- */

const rules = (() => {
  const { document } = parseHTML(read("_page-rules.html"));
  const groups = [];
  for (const group of document.querySelectorAll(".rule-group")) {
    const records = [];
    for (const item of group.querySelectorAll(".dispatch")) {
      const time = item.querySelector("time");
      const link = item.querySelector("h3 a");
      const refs = [...item.querySelectorAll(".dispatch-ref strong, .dispatch-ref > span")].map((node) => clean(node.textContent));
      records.push({
        dateISO: time?.getAttribute("datetime") || "",
        dateLabel: clean(time?.textContent),
        title: stripTab(link?.textContent),
        href: link?.getAttribute("href") || "",
        tags: [...item.querySelectorAll(".tags .tag")].map((node) => clean(node.textContent)),
        kind: refs[0] || "",
        refs: refs.slice(1),
        summary: clean(item.querySelector(".rule-summary")?.textContent)
      });
    }
    groups.push({
      title: clean(group.querySelector("h2")?.textContent),
      summary: clean(group.querySelector(".rule-group-summary-text")?.textContent),
      intro: clean(group.querySelector(".rule-group-intro")?.textContent),
      checked: clean(group.querySelector(".rule-group-intro time")?.textContent),
      records
    });
  }
  return groups;
})();

/* ---------------- decisions ---------------- */

const decisions = (() => {
  const { document } = parseHTML(read("_page-decisions.html"));
  return [...document.querySelectorAll(".dispatch")].map((item) => {
    const link = item.querySelector("h3 a");
    const refs = [...item.querySelectorAll(".dispatch-ref strong, .dispatch-ref > span")].map((node) => clean(node.textContent));
    const time = item.querySelector("time");
    return {
      dateISO: time?.getAttribute("datetime") || "",
      dateLabel: clean(time?.textContent),
      kind: clean(item.querySelector(".dispatch-kind")?.textContent),
      title: stripTab(link?.textContent),
      href: link?.getAttribute("href") || "",
      summary: clean(item.querySelector(".rule-summary")?.textContent),
      tags: [...item.querySelectorAll(".tags .tag")].map((node) => clean(node.textContent)),
      ref: refs[0] || "",
      source: refs[1] || ""
    };
  });
})();

/* ---------------- discharge ---------------- */

const discharge = (() => {
  const { document } = parseHTML(read("_page-discharge.html"));
  const statuses = [...document.querySelectorAll(".discharge-status")].map((card) => ({
    body: clean(card.querySelector(".status-kicker")?.textContent),
    status: clean(card.querySelector("h3")?.textContent),
    text: clean(card.querySelector("p:not(.status-kicker)")?.textContent),
    tone: card.classList.contains("discharge-status-positive") ? "positive" : "hold"
  }));

  const docs = [...document.querySelectorAll(".discharge-docs li")].flatMap((item) => {
    const label = clean(item.querySelector("strong")?.textContent).replace(/:$/, "") || "Related material";
    return [...item.querySelectorAll("a")].map((link) => ({
      label,
      title: stripTab(link.textContent),
      href: link.getAttribute("href") || ""
    }));
  });

  const followUp = [...document.querySelectorAll(".discharge-doc-list li")].map((item) => ({
    type: clean(item.querySelector(".discharge-doc-type")?.textContent),
    title: stripTab(item.querySelector("h3 a")?.textContent),
    href: item.querySelector("h3 a")?.getAttribute("href") || "",
    text: clean(item.querySelector("div > p")?.textContent)
  }));

  const explainerParagraphs = [...document.querySelectorAll(".discharge-explainer .prose p")].map((node) => clean(node.textContent));
  const explainerLinks = [...document.querySelectorAll(".discharge-explainer .prose a")].map((node) => ({
    title: stripTab(node.textContent),
    href: node.getAttribute("href")
  }));
  const steps = [...document.querySelectorAll(".discharge-steps li")].map((item) => ({
    title: clean(item.querySelector("strong")?.textContent),
    text: clean(item.querySelector("span")?.textContent)
  }));

  return {
    cycle: "FY2024",
    decisionDate: "29 April 2026",
    latest: "29 Apr 2026",
    intro: clean(document.querySelector(".page-head .lede")?.textContent),
    statuses,
    context: clean(document.querySelector(".discharge-context")?.textContent),
    docs,
    followUp,
    explainerParagraphs,
    explainerLinks,
    steps,
    timing: clean(document.querySelector(".discharge-timing span")?.textContent),
    coverage: clean(document.querySelector(".discharge-note p")?.textContent),
    stamp: clean(document.querySelector(".discharge-stamp")?.textContent)
  };
})();

/* ---------------- monitoring ---------------- */

const monitoring = (() => {
  const { document } = parseHTML(read("_page-monitoring.html"));
  const rows = [...document.querySelectorAll("tbody tr")].map((row) => {
    const cells = [...row.querySelectorAll("td")].map((cell) => clean(cell.textContent));
    return {
      date: cells[0] || "",
      source: cells[1] || "",
      status: cells[2] || "",
      discovered: Number(cells[3]) || 0,
      new: Number(cells[4]) || 0,
      failed: Number(cells[5]) || 0,
      note: cells[6] && cells[6] !== "—" ? cells[6].slice(0, 150) : ""
    };
  });

  const latestBySource = new Map();
  for (const row of rows) {
    if (!latestBySource.has(row.source)) latestBySource.set(row.source, row);
  }

  const sourceOrder = ["EUR-Lex / Cellar SPARQL", "European Ombudsman document search", "Commission documents in EUR-Lex / Cellar", "Commission Press Corner"];
  const sources = sourceOrder
    .filter((name) => latestBySource.has(name))
    .map((name) => latestBySource.get(name));

  const totals = sources.reduce((acc, row) => {
    acc.discovered += row.discovered;
    acc.new += row.new;
    acc.failed += row.failed;
    return acc;
  }, { discovered: 0, new: 0, failed: 0 });

  return {
    intro: clean(document.querySelector(".page-head .lede")?.textContent),
    lastChecked: "23 Oct 2026, 04:41",
    schedule: { time: "06:30", timezone: "Europe/Brussels", cadence: "Daily" },
    sources,
    runs: rows,
    totals
  };
})();

/* ---------------- settings ---------------- */

const settings = (() => {
  const { document } = parseHTML(read("_page-settings.html"));
  const providers = [...document.querySelectorAll("#p-provider option")].map((option) => clean(option.textContent));
  return {
    intro: "Choose an optional provider for source-grounded summaries. This static edition is a local interface preview.",
    notice: "No key is transmitted, stored, or sent anywhere. The form exists to demonstrate the interaction.",
    providers
  };
})();

/* ---------------- assemble ---------------- */

const site = {
  generatedAt: "2026-10-23",
  feedChecked: "23 Oct 2026",
  counts: {
    cases: cases.length,
    topics: topics.length,
    rules: rules.reduce((total, group) => total + group.records.length, 0),
    decisions: decisions.length
  },
  cases,
  topics,
  topicDirectory,
  rules,
  decisions,
  discharge,
  monitoring,
  settings
};

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/site.json", JSON.stringify(site, null, 2));
console.log("Wrote data/site.json");
console.log({
  cases: site.counts.cases,
  topics: site.topics.map((topic) => [topic.slug, topic.cases.length]),
  rules: rules.map((group) => [group.title, group.records.length]),
  decisions: decisions.length,
  monitoringRuns: monitoring.runs.length
});
