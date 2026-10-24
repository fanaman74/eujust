// Daily source check for the static edition.
//
// This replaces the Astro app's worker (scripts/worker.ts) without the database:
// one pass, no poll loop, no advisory lock - Windows Task Scheduler starts it at
// 06:30 Europe/Brussels and a missed day shows up in the log instead of being
// silently caught up.
//
//   node daily-check.mjs            # check, write log, rebuild
//   node daily-check.mjs --no-build # check and log only
//
// It refreshes data/pending.json (OJ C "case brought" notices), sweeps Cellar for
// new staff judgments/orders into data/inbox.json, appends a run to
// data/monitoring.json, then rebuilds the site.

import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { fetchPending, fetchRulings } from "./sources.mjs";

const SCHEDULE = { time: "06:30", timezone: "Europe/Brussels", cadence: "Daily" };
const LOG_FILE = "data/monitoring.json";
const PENDING_FILE = "data/pending.json";
const INBOX_FILE = "data/inbox.json";
const WINDOW_DAYS = Number(process.env.WINDOW_DAYS || 45);
const KEEP_RUNS = 40;

const startedAt = new Date();
const started = Date.now();
const day = new Intl.DateTimeFormat("en-CA", {
  timeZone: SCHEDULE.timezone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(started);

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
};
const writeJson = (file, value) => {
  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
};
const describeError = (error) => {
  const cause = error?.cause?.code || error?.cause?.errno || "";
  return `${error.message}${cause ? ` (${cause})` : ""}`.slice(0, 200);
};
const refs = (items, limit = 4) =>
  items.slice(0, limit).map((item) => item.caseNo).join(", ") + (items.length > limit ? ` +${items.length - limit}` : "");

const sources = [];

/* ---------- source 1: pending actions ---------- */

try {
  const previous = readJson(PENDING_FILE, { cases: [] });
  const known = new Set((previous.cases || []).map((entry) => entry.id));
  const { cases } = await fetchPending();
  const fresh = cases.filter((entry) => !known.has(entry.id));

  writeJson(PENDING_FILE, {
    generatedAt: day,
    source: "EUR-Lex / Cellar SPARQL — OJ C notices of actions brought (CELEX …TN…)",
    count: cases.length,
    cases,
  });

  sources.push({
    key: "eurlex-tn",
    name: "EUR-Lex / Cellar SPARQL — pending actions",
    status: "Success",
    discovered: cases.length,
    new: fresh.length,
    failed: 0,
    note: fresh.length ? `new: ${refs(fresh)}` : `${cases.length} actions in scope, none new`,
  });
  console.log(`pending actions: ${cases.length} in scope, ${fresh.length} new`);
} catch (error) {
  sources.push({
    key: "eurlex-tn",
    name: "EUR-Lex / Cellar SPARQL — pending actions",
    status: "Failed",
    discovered: 0,
    new: 0,
    failed: 1,
    note: describeError(error),
  });
  console.error(`pending actions failed: ${error.message}`);
}

/* ---------- source 2: new judgments and orders on staff cases ---------- */

try {
  const site = readJson("data/site.json", { cases: [] });
  const known = new Set((site.cases || []).map((entry) => entry.celex).filter(Boolean));
  const { items, windowStart } = await fetchRulings({ days: WINDOW_DAYS });
  const fresh = items.filter((item) => !known.has(item.celex));

  writeJson(INBOX_FILE, {
    generatedAt: day,
    windowStart,
    count: fresh.length,
    items: fresh,
  });

  sources.push({
    key: "eurlex-tj",
    name: "EUR-Lex / Cellar SPARQL — staff judgments & orders",
    status: "Success",
    discovered: items.length,
    new: fresh.length,
    failed: 0,
    note: fresh.length ? `new: ${refs(fresh)}` : `${items.length} in window since ${windowStart}, none new`,
  });
  console.log(`rulings since ${windowStart}: ${items.length} found, ${fresh.length} not in the archive`);
} catch (error) {
  sources.push({
    key: "eurlex-tj",
    name: "EUR-Lex / Cellar SPARQL — staff judgments & orders",
    status: "Failed",
    discovered: 0,
    new: 0,
    failed: 1,
    note: describeError(error),
  });
  console.error(`rulings sweep failed: ${error.message}`);
}

/* ---------- run log ---------- */

const log = readJson(LOG_FILE, { runs: [] });
const entry = {
  startedAt: startedAt.toISOString(),
  day,
  durationMs: Date.now() - started,
  sources,
};

const runs = [entry, ...(log.runs || [])].slice(0, KEEP_RUNS);
writeJson(LOG_FILE, { updatedAt: startedAt.toISOString(), schedule: SCHEDULE, runs });

const failed = sources.filter((source) => source.status === "Failed").length;
console.log(`run recorded: ${sources.length - failed}/${sources.length} sources ok, ${Date.now() - started}ms`);

/* ---------- rebuild ---------- */

// Set exitCode rather than calling process.exit(): exiting while fetch handles are
// still closing trips a libuv assertion on Windows and would report a failed task.
let code = 0;
if (!process.argv.includes("--no-build")) {
  const build = spawnSync(process.execPath, ["build.mjs"], { stdio: "inherit" });
  if (build.status !== 0) {
    console.error("build failed");
    code = 1;
  }
}

process.exitCode = failed ? 1 : code;
