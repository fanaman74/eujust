/* ============================================================
   EU JUST — source-check freshness warning
   ------------------------------------------------------------
   build.mjs writes freshness.js (window.EUJUST_FRESHNESS) from
   data/monitoring.json. The age is judged here, in the browser,
   so a site that stops being rebuilt still shows the warning.
   ============================================================ */

(() => {
  "use strict";

  const STALE_AFTER_HOURS = 36;
  const data = window.EUJUST_FRESHNESS;
  if (!data || !data.lastCheck) return;

  const script = document.currentScript;
  const root = script ? script.src.replace(/freshness-banner\.js(\?.*)?$/, "") : "/";
  const timeZone = data.timezone || "Europe/Brussels";

  const last = new Date(data.lastCheck);
  if (Number.isNaN(last.getTime())) return;
  const ageHours = (Date.now() - last.getTime()) / 36e5;

  const longDate = (value) =>
    new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric", month: "short", year: "numeric" }).format(value);
  const shortDate = (value) =>
    new Intl.DateTimeFormat("en-GB", { timeZone, day: "2-digit", month: "2-digit", year: "2-digit" }).format(value).replace(/\//g, ".");

  // Keep the hand-written homepage's "Feed checked" stamps in step with the run log.
  document.querySelectorAll(".masthead__check time").forEach((node) => {
    node.setAttribute("datetime", data.lastCheck);
    node.textContent = shortDate(last);
  });
  document.querySelectorAll(".colophon__status").forEach((node) => {
    const dot = node.querySelector(".live-dot");
    node.textContent = `Feed checked ${longDate(last)}`;
    if (dot) node.prepend(dot);
  });

  const stale = ageHours > STALE_AFTER_HOURS;
  const failed = Array.isArray(data.failedSources) && data.failedSources.length > 0;
  if (!stale && !failed) return;

  if (stale) document.querySelectorAll(".live-dot").forEach((dot) => dot.classList.add("live-dot--stale"));

  const days = Math.floor(ageHours / 24);
  const ago = days >= 2 ? `${days} days ago` : `${Math.round(ageHours)} hours ago`;
  const message = stale
    ? `Source checks are overdue. The last check ran on ${longDate(last)}, ${ago}. Cases filed or decided since then may be missing.`
    : `The latest source check (${longDate(last)}) failed for: ${data.failedSources.join("; ")}. Some sources may be out of date.`;

  const banner = document.createElement("div");
  banner.className = `freshness-banner${stale ? " freshness-banner--stale" : ""}`;
  banner.setAttribute("role", "status");
  const text = document.createElement("p");
  const label = document.createElement("strong");
  label.textContent = stale ? "Data may be out of date" : "Partial source check";
  text.append(label, " ", message, " ");
  const link = document.createElement("a");
  link.href = `${root}monitoring/index.html`;
  link.textContent = "See source monitoring";
  text.append(link);
  banner.append(text);

  const main = document.getElementById("main") || document.querySelector("main");
  if (main) main.prepend(banner);
  else document.body.prepend(banner);
})();
