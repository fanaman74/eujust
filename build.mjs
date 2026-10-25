import fs from "node:fs";
import path from "node:path";

const site = JSON.parse(fs.readFileSync("data/site.json", "utf8"));
const cases = site.cases;
const topics = site.topics;
const topicBySlug = Object.fromEntries(topics.map((topic) => [topic.slug, topic]));
const caseById = Object.fromEntries(cases.map((entry) => [entry.id, entry]));

const esc = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const attr = (value = "") => esc(value).replace(/`/g, "&#96;");
const clean = (value = "") => String(value).replace(/\s+/g, " ").trim();
const stripTab = (value = "") => clean(value).replace(/\s*\(opens the official source in a new tab\)\s*$/i, "");
const dateShort = (value = "") => value;

const icon = (name, className = "") =>
  `<svg class="icon ${className}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;

const sprite = `<svg class="svg-sprite" aria-hidden="true" focusable="false">
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4 12h15M13 5l7 7-7 7"/></symbol>
<symbol id="i-arrow-ne" viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></symbol>
<symbol id="i-chevron" viewBox="0 0 24 24"><path d="m5 9 7 7 7-7"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="7.2"/><path d="m16 16 5 5"/></symbol>
<symbol id="i-scale" viewBox="0 0 24 24"><path d="M12 3v18M8 21h8M4 7h16M6 7l-3 7h6L6 7ZM18 7l-3 7h6l-3-7Z"/></symbol>
<symbol id="i-book" viewBox="0 0 24 24"><path d="M3 5.3C5.8 4 8.9 4 12 5.8 15.1 4 18.2 4 21 5.3v14.2c-2.8-1.2-5.9-1.2-9 .6-3.1-1.8-6.2-1.8-9-.6V5.3Z"/><path d="M12 5.8V20"/></symbol>
<symbol id="i-pulse" viewBox="0 0 24 24"><path d="M2 12h4l2.2-6 4.1 13 2.8-9 1.9 2H22"/></symbol>
<symbol id="i-warning" viewBox="0 0 24 24"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17.3v.2"/></symbol>
<symbol id="i-doc" viewBox="0 0 24 24"><path d="M6 2.8h8l4 4V21H6V2.8Z"/><path d="M14 2.8v4.4h4M9 11h6M9 15h6"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="m4 12.5 5 5L20 6.5"/></symbol>
<symbol id="i-close" viewBox="0 0 24 24"><path d="m5 5 14 14M19 5 5 19"/></symbol>
<symbol id="i-star" viewBox="0 0 24 24"><path d="m12 2 2.3 7.2H22l-6.1 4.4 2.4 7.2-6.3-4.5-6.3 4.5 2.4-7.2L2 9.2h7.7L12 2Z"/></symbol>
<symbol id="i-copy" viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="1"/><path d="M16 8V4H4v12h4"/></symbol>
<symbol id="i-filter" viewBox="0 0 24 24"><path d="M3 5h18l-7 8v5l-4 2v-7L3 5Z"/></symbol>
<symbol id="i-key" viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 3l4 4M14 6l4 4"/></symbol>
<symbol id="i-eye" viewBox="0 0 24 24"><path d="M2 12s3.8-6 10-6 10 6 10 6-3.8 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
<symbol id="i-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></symbol>
<symbol id="i-topic" viewBox="0 0 24 24"><path d="M4 5h16M4 12h16M4 19h16"/><circle cx="7" cy="5" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="11" cy="19" r="1.4" fill="currentColor" stroke="none"/></symbol>
<symbol id="i-terminal" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="1"/><path d="m7 9 3 3-3 3M13 15h4"/></symbol>
<symbol id="i-flag" viewBox="0 0 24 24"><path d="M5 21V4M5 4h12l-2 4 2 4H5"/></symbol>
</svg>`;

const navItems = [
  { key: "cases", label: "Court rulings", href: "cases/index.html", index: "01" },
  { key: "pending", label: "Pending cases", href: "pending/index.html", index: "02" },
  { key: "rules", label: "Rules & updates", href: "rules/index.html", index: "03" },
  { key: "decisions", label: "Selected records", href: "decisions/index.html", index: "04" },
  { key: "discharge", label: "Budget discharge", href: "discharge/index.html", index: "05" }
];

function brand(root) {
  return `<a class="brand" href="${root}index.html" aria-label="EU JUST — home">
    <span class="brand__mark"><span class="brand__eu">EU</span><span class="brand__just">JUST</span></span>
    <span class="brand__sub">Workplace rights<br>traced to source</span>
  </a>`;
}

function ticker() {
  const items = [
    "Official source or it didn’t happen",
    "85 court rulings on record",
    "4 official feeds monitored",
    "Court feed checked 23 Oct 2026",
    "Research support — not legal advice",
    "Keyword-matched / bounded window"
  ];
  const line = items.map((item) => `<span>${item}</span><i>✳</i>`).join("");
  return `<div class="ticker" aria-hidden="true"><div class="ticker__track">${line}${line}</div></div>`;
}

function header(root, active) {
  const nav = navItems
    .map((item) => {
      const current = item.key === active ? ' aria-current="page"' : "";
      return `<a href="${root}${item.href}"${current}><span>${item.index}</span>${item.label}</a>`;
    })
    .join("");

  const opsActive = active === "monitoring" || active === "settings";

  return `<header class="masthead">
  <div class="masthead__inner wrap">
    ${brand(root)}
    <nav class="primary-nav" aria-label="Primary">${nav}</nav>
    <div class="masthead__tools">
      <p class="masthead__check"><span class="live-dot"></span>Feed checked <time datetime="2026-10-23">23.10.26</time></p>
      <details class="ops-menu${opsActive ? " is-active" : ""}">
        <summary>Operations ${icon("chevron")}</summary>
        <div class="ops-menu__panel">
          <a href="${root}monitoring/index.html"${active === "monitoring" ? ' aria-current="page"' : ""}><span>Monitoring</span><small>Source checks and schedule</small></a>
          <a href="${root}settings/index.html"${active === "settings" ? ' aria-current="page"' : ""}><span>AI settings</span><small>Summary providers</small></a>
        </div>
      </details>
      <a class="btn btn--small magnet" href="${root}cases/index.html">Find a ruling ${icon("search")}</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu">
        <span class="menu-toggle__lines" aria-hidden="true"><i></i><i></i></span>
        <span>Menu</span>
      </button>
    </div>
  </div>

  <nav class="mobile-menu" id="mobile-menu" aria-label="Mobile" aria-hidden="true">
    <p class="mobile-menu__label">Research file</p>
    <a href="${root}cases/index.html"><span>01</span>Court rulings<small>Daily feed from EUR-Lex</small></a>
    <a href="${root}pending/index.html"><span>02</span>Pending cases<small>Applications awaiting judgment</small></a>
    <a href="${root}rules/index.html"><span>03</span>Rules &amp; updates<small>Ombudsman, Commission, staff rules</small></a>
    <a href="${root}decisions/index.html"><span>04</span>Selected records<small>Editorial selection</small></a>
    <a href="${root}discharge/index.html"><span>05</span>Budget discharge<small>Parliament’s scrutiny cycle</small></a>
    <p class="mobile-menu__label">Operations</p>
    <a href="${root}monitoring/index.html"><span>06</span>Monitoring<small>Source checks and schedule</small></a>
    <a href="${root}settings/index.html"><span>07</span>AI settings<small>Summary providers</small></a>
    <a class="mobile-menu__cta" href="${root}cases/index.html">Find a ruling ${icon("arrow")}</a>
  </nav>
</header>`;
}

function footer(root) {
  return `<footer class="colophon">
  <div class="wrap colophon__inner">
    <div class="colophon__brand">
      <a class="brand brand--footer" href="${root}index.html" aria-label="EU JUST — back to home">
        <span class="brand__mark"><span class="brand__eu">EU</span><span class="brand__just">JUST</span></span>
      </a>
      <p>European workplace law, institutional rules and accountability records linked to official sources. Research support only, not legal advice.</p>
      <a class="text-link text-link--light" href="${root}index.html">Back to home ${icon("arrow")}</a>
    </div>
    <nav class="colophon__nav" aria-labelledby="footer-research">
      <h2 id="footer-research">Research</h2>
      <ul>
        <li><a href="${root}topics/index.html">Research topics</a></li>
        <li><a href="${root}cases/index.html">Court rulings</a></li>
        <li><a href="${root}pending/index.html">Pending cases</a></li>
        <li><a href="${root}rules/index.html">Rules &amp; updates</a></li>
        <li><a href="${root}decisions/index.html">Selected records</a></li>
        <li><a href="${root}discharge/index.html">Budget discharge</a></li>
      </ul>
    </nav>
    <nav class="colophon__nav" aria-labelledby="footer-operations">
      <h2 id="footer-operations">Operations</h2>
      <ul>
        <li><a href="${root}monitoring/index.html">Monitoring</a></li>
        <li><a href="${root}settings/index.html">AI settings</a></li>
      </ul>
      <h2 class="colophon__nav-second" id="footer-sources">Official sources</h2>
      <ul aria-labelledby="footer-sources">
        <li><a href="https://eur-lex.europa.eu/" target="_blank" rel="noreferrer">EUR-Lex ${icon("arrow-ne")}</a></li>
        <li><a href="https://www.ombudsman.europa.eu/" target="_blank" rel="noreferrer">European Ombudsman ${icon("arrow-ne")}</a></li>
        <li><a href="https://ec.europa.eu/commission/presscorner/" target="_blank" rel="noreferrer">Commission Press Corner ${icon("arrow-ne")}</a></li>
      </ul>
    </nav>
    <div class="colophon__meta">
      <p class="colophon__label">File status</p>
      <p class="colophon__status"><span class="live-dot"></span>Feed checked 23 Oct 2026</p>
      <p class="colophon__label">Coverage</p>
      <p>85 collected rulings<br>4 official feeds<br>5 latest records</p>
      <p class="colophon__label">Disclaimer</p>
      <p>The linked official document is always the authority. AI summaries, where present, are labelled as generated.</p>
    </div>
  </div>
  <div class="colophon__lockup" aria-hidden="true"><span>EU</span><span>JUST</span></div>
  <div class="wrap colophon__base">
    <p>Research support only. Verify at the source.</p>
    <p>Closer to the source. / 2026</p>
  </div>
</footer>`;
}

function crumbs(root, items) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${items
    .map((item, index) => {
      if (index === items.length - 1) return `<li><span aria-current="page">${esc(item.label)}</span></li>`;
      return `<li><a href="${root}${item.href}">${esc(item.label)}</a></li>`;
    })
    .join("")}</ol></nav>`;
}

function shell({ root, title, description, active, body, bodyClass = "", page = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ece6d8">
  <title>${esc(title)}</title>
  <meta name="description" content="${attr(description)}">
  <link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml">
  <link rel="preload" href="${root}assets/fonts/archivo-black-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="${root}assets/fonts/archivo-var-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${root}assets/fonts/fonts.css">
  <link rel="stylesheet" href="${root}styles.css">
  <link rel="stylesheet" href="${root}pages.css">
  <script>document.documentElement.classList.add('js');</script>
</head>
<body class="page-shell ${bodyClass}" data-page="${attr(page || active)}">
  <a class="skip-link" href="#main">Skip to main content</a>
  ${sprite}
  <div class="grain" aria-hidden="true"></div>
  <div class="page-edge page-edge--left" aria-hidden="true"></div>
  <div class="page-edge page-edge--right" aria-hidden="true"></div>
  <div class="cursor" aria-hidden="true">
    <span class="cursor__dot"></span>
    <span class="cursor__ring"></span>
    <span class="cursor__label">OPEN</span>
  </div>
  ${ticker()}
  ${header(root, active)}
  <main id="main" tabindex="-1">
    ${body}
  </main>
  ${footer(root)}
  <script src="${root}assets/vendor/gsap.min.js"></script>
  <script src="${root}assets/vendor/ScrollTrigger.min.js"></script>
  <script src="${root}pages.js"></script>
</body>
</html>`;
}

function pageHero({
  root,
  index,
  kicker,
  title,
  lede,
  stats = [],
  bgword = "RECORD",
  breadcrumb = [],
  aside = "",
  className = ""
}) {
  return `<section class="page-hero ${className}">
  <div class="page-hero__bg" aria-hidden="true"><span>${esc(bgword)}</span></div>
  <div class="wrap page-hero__wrap">
    ${crumbs(root, breadcrumb.length ? breadcrumb : [{ label: "Home", href: "index.html" }])}
    <div class="page-hero__grid">
      <div class="page-hero__copy">
        <p class="section-index"><span>${esc(index)}</span> ${esc(kicker)}</p>
        <h1>${title}</h1>
      </div>
      <div class="page-hero__aside">
        <p class="page-hero__lede">${lede}</p>
        ${stats.length ? `<dl class="page-stats">${stats
          .map((stat) => `<div><dt>${esc(stat.label)}</dt><dd>${stat.value}</dd></div>`)
          .join("")}</dl>` : ""}
        ${aside}
      </div>
    </div>
    <div class="page-hero__rule" aria-hidden="true"></div>
  </div>
</section>`;
}

function tagList(tags, root, { linked = false, className = "" } = {}) {
  if (!tags || !tags.length) return "";
  return `<ul class="tag-list ${className}" aria-label="Matched topics">${tags
    .map((tag) => {
      const topic = topics.find((entry) => entry.name === tag);
      if (linked && topic) return `<li><a class="tag" href="${root}topics/${topic.slug}/index.html">${esc(tag)}</a></li>`;
      return `<li><span class="tag">${esc(tag)}</span></li>`;
    })
    .join("")}</ul>`;
}

function fileTab(label, value) {
  return `<div class="file-tab"><span>${esc(label)}</span><strong>${value}</strong></div>`;
}

function sourceLink(href, label = "Official source", { root = "", className = "", external = true } = {}) {
  return `<a class="${className}" href="${attr(href)}"${external ? ' target="_blank" rel="noreferrer"' : ""}>${esc(label)} ${icon("arrow-ne")}</a>`;
}

/* ============================================================
   CASES INDEX
   ============================================================ */

/* Pending actions: OJ C "case brought" notices, harvested separately from Cellar. */
const pending = (() => {
  const file = "data/pending.json";
  if (!fs.existsSync(file)) return { count: 0, cases: [], generatedAt: "" };
  return JSON.parse(fs.readFileSync(file, "utf8"));
})();

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortDate = (iso = "") => {
  const [y, m, d] = String(iso).split("-");
  return d ? `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}` : iso;
};

function pendingSection(root) {
  const rows = pending.cases || [];
  if (!rows.length) return "";
  const focus = (entry) => entry.topics?.includes("Harassment at work");
  const harassmentCount = rows.filter(focus).length;
  const ordered = [...rows].sort(
    (a, b) => Number(focus(b)) - Number(focus(a)) || String(b.filedISO).localeCompare(String(a.filedISO))
  );

  const items = ordered
    .map(
      (entry) => `<li><a class="pending-row${focus(entry) ? " pending-row--focus" : ""}" href="${attr(entry.url)}" target="_blank" rel="noreferrer">
        <span class="pending-row__no">${esc(entry.caseNo)}</span>
        <span class="pending-row__body">
          <span class="pending-row__meta">${esc(entry.court)}${entry.filedISO ? ` &middot; filed ${esc(shortDate(entry.filedISO))}` : ""}${entry.ojISO ? ` &middot; OJ ${esc(shortDate(entry.ojISO))}` : ""}</span>
          <span class="pending-row__topics">${(entry.topics || []).map((topic) => `<span class="pending-row__topic">${esc(topic)}</span>`).join("")}</span>
        </span>
        <span class="pending-row__go" aria-hidden="true">${icon("arrow-ne")}</span>
      </a></li>`
    )
    .join("");

  return `
  <section class="wrap page-section pending-cases" id="pending" aria-labelledby="pending-title">
    <div class="section-top">
      <p class="section-index"><span>03</span> In the pipeline</p>
      <p class="section-top__note">${rows.length} actions &middot; ${harassmentCount} on harassment</p>
    </div>
    <div class="pending-head">
      <h2 class="section-title" id="pending-title">Pending before the <span class="marker">Court.</span></h2>
      <p>Applications lodged but not yet decided. A case entering this list means the argument has been made, not that it has been won: the pleas are allegations, and no findings exist until the Court rules.</p>
      <a class="text-link" href="${root}pending/index.html">Search all ${rows.length} pending cases ${icon("arrow")}</a>
      <p class="pending-source">Source: Official Journal C notices of actions brought (CELEX <span class="mono">&hellip;TN&hellip;</span>), harvested from EUR-Lex Cellar on ${esc(pending.generatedAt || "—")}. Newest first, harassment matters grouped ahead.</p>
    </div>
    <ol class="pending-list" role="list">${items}</ol>
  </section>`;
}

function pendingPage() {
  const root = "../";
  const rows = pending.cases || [];
  const topicsInPending = [...new Set(rows.flatMap((entry) => entry.topics || []))].sort((a, b) => a.localeCompare(b));
  const courts = [...new Set(rows.map((entry) => entry.court).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const focus = (entry) => entry.topics?.includes("Harassment at work");
  const harassmentCount = rows.filter(focus).length;
  const ordered = [...rows].sort((a, b) => Number(focus(b)) - Number(focus(a)) || String(b.filedISO || "").localeCompare(String(a.filedISO || "")));
  const items = ordered.map((entry, index) => {
    const entryTopics = entry.topics || [];
    const search = [entry.caseNo, entry.court, ...entryTopics].join(" ");
    const cardClass = `case-index-card${index % 9 === 0 ? " case-index-card--accent" : ""}`;
    return `<li class="${cardClass}" data-pending-case data-topics="${attr(entryTopics.join("|"))}" data-court="${attr(entry.court || "")}" data-search="${attr(search)}">
      <div class="case-index-card__top">
        <span class="case-index-card__no">Pending application</span>
        ${entry.ojISO ? `<time datetime="${attr(entry.ojISO)}">OJ ${esc(shortDate(entry.ojISO))}</time>` : `<span>OJ date not recorded</span>`}
      </div>
      <p class="case-index-card__topic">${esc(entryTopics[0] || "Court application")}</p>
      <h2><a href="${attr(entry.url)}" target="_blank" rel="noreferrer">${esc(entry.caseNo)}</a></h2>
      <p class="case-index-card__subject">Application awaiting judgment. The pleas are allegations; no findings have been made.</p>
      <p class="case-index-card__court">${esc(entry.court || "Court not recorded")}</p>
      ${tagList(entryTopics, root)}
      <div class="case-index-card__foot">
        <span>${entry.filedISO ? `Filed ${esc(shortDate(entry.filedISO))}` : "Filing date not recorded"}</span>
        <a class="case-index-card__open" href="${attr(entry.url)}" target="_blank" rel="noreferrer">Official notice ${icon("arrow-ne")}</a>
      </div>
    </li>`;
  }).join("");
  const body = `${pageHero({
    root,
    index: "02",
    kicker: "Applications awaiting judgment",
    title: `Pending <span class="marker">cases.</span>`,
    lede: "Applications lodged at the EU Courts that have not yet reached a judgment. These entries record that a case has been brought; the pleas are allegations, and no findings exist until the Court rules.",
    stats: [
      { label: "Pending applications", value: String(rows.length) },
      { label: "On workplace harassment", value: String(harassmentCount) },
      { label: "Source updated", value: esc(pending.generatedAt || "—") }
    ],
    bgword: "PENDING",
    breadcrumb: [{ label: "Home", href: "index.html" }, { label: "Court rulings", href: "cases/index.html" }, { label: "Pending cases" }]
  })}
  <section class="wrap page-section pending-page" aria-labelledby="pending-page-title">
    <div class="section-top">
      <p class="section-index"><span>01</span> Search pending cases</p>
      <p class="section-top__note"><span id="pending-count">${rows.length}</span> applications</p>
    </div>
    <div class="pending-page__head">
      <h2 class="section-title" id="pending-page-title">The cases still <span class="marker">in progress.</span></h2>
      <p>Search by case number, court or topic. Harassment matters are highlighted; entries are ordered newest first within that group.</p>
    </div>
    <form class="case-filter pending-filter" id="pending-filter" role="search" aria-label="Search and filter pending cases">
      <div class="case-filter__bar"><span>${icon("filter")} Filter pending cases</span><span>${rows.length} applications / EUR-Lex</span></div>
      <div class="case-filter__grid">
        <label class="field field--search" for="pending-q"><span>Search</span><span class="field__control">${icon("search")}<input id="pending-q" type="search" placeholder="Case number, court or topic" autocomplete="off"></span></label>
        <label class="field" for="pending-topic"><span>Topic</span><select id="pending-topic"><option value="">All topics</option>${topicsInPending.map((topic) => `<option value="${attr(topic)}">${esc(topic)}</option>`).join("")}</select></label>
        <label class="field" for="pending-court"><span>Court</span><select id="pending-court"><option value="">All courts</option>${courts.map((court) => `<option value="${attr(court)}">${esc(court)}</option>`).join("")}</select></label>
        <div class="case-filter__actions"><button class="btn btn--ink" type="submit">Search cases ${icon("arrow")}</button><button class="case-filter__reset" id="pending-reset" type="reset">Reset</button></div>
      </div>
    </form>
    <p class="results-line" id="pending-result" role="status" aria-live="polite">Showing all ${rows.length} pending applications.</p>
    ${rows.length ? `<ol class="case-grid pending-card-grid" id="pending-list" aria-label="Pending court applications">${items}</ol>` : `<div class="case-empty"><h2>No pending cases are listed.</h2><p>New applications appear after the next EUR-Lex source check.</p></div>`}
    <p class="pending-source pending-page__source">Source: Official Journal C notices of actions brought (CELEX …TN…), harvested from EUR-Lex Cellar on ${esc(pending.generatedAt || "—")}. The linked notice is the official source.</p>
    <a class="text-link" href="${root}cases/index.html">Browse decided court rulings ${icon("arrow")}</a>
  </section>`;
  return shell({
    root,
    title: "Pending EU court cases on workplace rights — EU JUST",
    description: "Search pending EU Court of Justice and General Court applications on workplace rights, based on Official Journal notices from EUR-Lex.",
    active: "pending",
    page: "pending",
    body
  });
}

function caseCard(entry, root) {
  const primaryTopic = entry.tags[0] || "Unmatched";
  const searchBlob = [entry.title, entry.caseNo, entry.court, entry.subject, ...entry.tags].join(" ");
  const date = new Date(entry.dateISO).getTime();
  return `<article class="case-index-card${entry.order % 9 === 1 ? " case-index-card--accent" : ""}" data-case data-id="${entry.id}" data-topic="${attr(entry.topicSlugs.join(" "))}" data-court="${attr(entry.court)}" data-date="${attr(entry.dateISO)}" data-name="${attr(entry.title)}" data-search="${attr(searchBlob)}">
    <div class="case-index-card__top">
      <span class="case-index-card__no">${esc(entry.caseNo)}</span>
      <time datetime="${attr(entry.dateISO)}">${esc(entry.dateLabel)}</time>
    </div>
    <p class="case-index-card__topic">${esc(primaryTopic)}</p>
    <h2><a href="${root}cases/${entry.id}/index.html">${esc(entry.title)}</a></h2>
    <p class="case-index-card__subject">${esc(entry.subject)}</p>
    <p class="case-index-card__court">${esc(entry.court)}</p>
    ${tagList(entry.tags, root)}
    <div class="case-index-card__foot">
      <span>File ${String(entry.order).padStart(2, "0")} / 85</span>
      <span class="case-index-card__open">Open record ${icon("arrow")}</span>
    </div>
  </article>`;
}

function casesPage() {
  const root = "../";
  const topicCounts = topics.map((topic) => ({ ...topic, count: topic.cases.length }));
  const courts = [...new Set(cases.map((entry) => entry.court))].sort();
  const cards = cases.map((entry) => caseCard(entry, root)).join("");

  const stats = [
    { label: "Rulings on record", value: cases.length },
    { label: "Matched topics", value: topics.length },
    { label: "Newest judgment", value: "21 Oct 2026" }
  ];

  const body = `${pageHero({
    root,
    index: "01",
    kicker: "The docket",
    title: `Court <span class="marker">rulings.</span>`,
    lede: "Decisions of the Court of Justice and the General Court on harassment, discrimination and psychosocial risk at work. Search the record, then open the judgment itself.",
    stats,
    bgword: "CASE LAW",
    breadcrumb: [{ label: "Home", href: "index.html" }, { label: "Court rulings" }]
  })}

  <section class="wrap page-section cases-index" aria-labelledby="cases-list-title">
    <div class="section-top">
      <p class="section-index"><span>02</span> Search the archive</p>
      <p class="section-top__note">Showing <strong id="case-count">all</strong> records</p>
    </div>

    <div class="cases-index__head">
      <h2 class="section-title" id="cases-list-title">Find the <span class="marker">right file.</span></h2>
      <p>Search by party, case number, court or keyword. Filters combine. The collection is bounded and keyword-based — relevant material may be missing.</p>
    </div>

    <div class="case-filter-wrap">
      <form class="case-filter" id="case-filter" role="search" aria-label="Search and filter rulings">
        <div class="case-filter__bar">
          <span>${icon("filter")} Filter the docket</span>
          <span>85 records / 4 feeds / 1 archive</span>
        </div>
        <div class="case-filter__grid">
          <label class="field field--search" for="case-q">
            <span>Search</span>
            <span class="field__control">${icon("search")}<input id="case-q" name="q" type="search" placeholder="Party, case number, court or words from the ruling" autocomplete="off"></span>
          </label>
          <label class="field" for="case-topic">
            <span>Topic</span>
            <select id="case-topic" name="topic">
              <option value="">All topics</option>
              ${topicCounts.map((topic) => `<option value="${attr(topic.slug)}">${esc(topic.name)} (${topic.count})</option>`).join("")}
            </select>
          </label>
          <label class="field" for="case-court">
            <span>Court</span>
            <select id="case-court" name="court">
              <option value="">All courts</option>
              ${courts.map((court) => `<option value="${attr(court)}">${esc(court)}</option>`).join("")}
            </select>
          </label>
          <label class="field" for="case-sort">
            <span>Sort by</span>
            <select id="case-sort" name="sort">
              <option value="newest">Newest judgment</option>
              <option value="oldest">Oldest judgment</option>
              <option value="name">Official title</option>
            </select>
          </label>
          <div class="case-filter__actions">
            <button class="btn btn--ink" type="submit">Search rulings ${icon("arrow")}</button>
            <button class="case-filter__reset" id="case-reset" type="reset">Reset</button>
          </div>
        </div>
      </form>

      <div class="topic-quick" aria-label="Quick topic filters">
        <button type="button" class="topic-chip is-active" data-topic-filter="">All topics <span>85</span></button>
        ${topicCounts.map((topic) => `<button type="button" class="topic-chip" data-topic-filter="${attr(topic.slug)}">${esc(topic.name)} <span>${topic.count}</span></button>`).join("")}
      </div>

      <div class="results-line">
        <p id="case-result" role="status" aria-live="polite">85 rulings in the archive.</p>
        <p><span class="live-dot"></span>Keyword-matched coverage</p>
      </div>

      <div class="case-grid" id="case-grid">${cards}</div>

      <div class="case-empty" id="case-empty" hidden>
        <span class="case-empty__mark">${icon("search")}</span>
        <h2>No file matches that search.</h2>
        <p>Try a party name, a case number such as <strong>T-199/25</strong>, or clear the filters to see all 85 records.</p>
        <button class="btn" type="button" id="case-empty-reset">Clear filters ${icon("close")}</button>
      </div>

      <div class="load-row">
        <button class="btn btn--pink" type="button" id="case-load-more">Load more records ${icon("arrow")}</button>
        <p id="case-loaded-note">Showing 18 of 85.</p>
      </div>
    </div>

    <div class="coverage-note">
      <span class="coverage-note__icon">${icon("warning")}</span>
      <p><strong>Coverage note.</strong> Rulings are found by keyword searches over a bounded window. A topic match is not a legal finding, and the collection is not exhaustive. The linked official document is always the authority.</p>
      <a class="text-link" href="${root}settings/index.html">Read the method ${icon("arrow")}</a>
    </div>
  </section>
  ${pendingSection(root)}`;

  return shell({
    root,
    title: "Court rulings — EU JUST",
    description: "Search Court of Justice and General Court rulings on harassment, discrimination and psychosocial risks.",
    active: "cases",
    page: "cases",
    body
  });
}

/* ============================================================
   CASE DETAIL
   ============================================================ */

function casePage(entry) {
  const root = "../../";
  const older = entry.olderId ? caseById[entry.olderId] : null;
  const newer = entry.newerId ? caseById[entry.newerId] : null;
  const abstract = entry.abstract || "No retrieved abstract is attached to this record. Open the official source to read the judgment.";
  const citation = `${entry.caseNo}, ${entry.title}, ${entry.court}, ${entry.dateLabel}. EU JUST record ${entry.id}. Official source: ${entry.source}`;

  const body = `<section class="case-detail-hero">
  <div class="page-hero__bg" aria-hidden="true"><span>CASE ${String(entry.order).padStart(2, "0")}</span></div>
  <div class="wrap">
    ${crumbs(root, [
      { label: "Home", href: "index.html" },
      { label: "Court rulings", href: "cases/index.html" },
      { label: entry.caseNo }
    ])}
    <div class="case-detail-hero__grid">
      <div class="case-detail-hero__copy">
        <p class="section-index"><span>${String(entry.order).padStart(2, "0")}</span> Case record / 85</p>
        <p class="case-detail-hero__no">${esc(entry.caseNo)}</p>
        <h1>${esc(entry.title)}</h1>
        <p class="lede">${esc(entry.subject)}</p>
        <div class="case-detail-hero__actions">
          ${sourceLink(entry.source, "Open official document", { root, className: "btn btn--ink" })}
          <button class="btn case-copy-btn" type="button" data-copy-citation="${attr(citation)}">Copy citation ${icon("copy")}</button>
          <span class="copy-status" id="copy-status" role="status"></span>
        </div>
      </div>
      <aside class="case-detail-hero__aside" aria-label="Case summary">
        <div class="case-file-card">
          <div class="case-file-card__top"><span>EU JUST / record</span><span>File ${String(entry.order).padStart(2, "0")}</span></div>
          <dl>
            <div><dt>Court</dt><dd>${esc(entry.court)}</dd></div>
            <div><dt>Judgment</dt><dd>${esc(entry.dateLabel)}</dd></div>
            <div><dt>CELEX</dt><dd>${esc(entry.celex || "Not recorded")}</dd></div>
          </dl>
          <div class="case-file-card__stamp"><span>Official source</span><strong>LINKED</strong></div>
        </div>
      </aside>
    </div>
  </div>
</section>

<section class="wrap case-detail-body">
  <div class="case-detail-grid">
    <div class="case-detail-main">
      <section class="paper-panel" aria-labelledby="source-title">
        <div class="panel-heading"><p class="section-index"><span>01</span> Source</p><span class="panel-rule"></span></div>
        <h2 id="source-title">The official <span class="marker">record.</span></h2>
        <p class="case-abstract">${esc(abstract)}</p>
        ${entry.fullTitle ? `<details class="full-title"><summary>Full official title</summary><p>${esc(entry.fullTitle)}</p></details>` : ""}
        <div class="source-box">
          <div>
            <span class="source-box__label">Official source</span>
            <strong>${esc(entry.celex ? `EUR-Lex document ${entry.celex}` : "Open the publishing authority")}</strong>
            <span class="source-box__meta">Text retrieved 23 October 2026 · The linked document is the authority.</span>
          </div>
          ${sourceLink(entry.source, "Open source", { root, className: "source-box__action" })}
        </div>
      </section>

      <section class="paper-panel paper-panel--ai" aria-labelledby="summary-title">
        <div class="panel-heading"><p class="section-index"><span>02</span> Reading aid</p><span class="panel-rule"></span></div>
        <div class="ai-heading"><h2 id="summary-title">AI summary</h2><span class="badge">Not generated</span></div>
        <p class="ai-note">${icon("warning")} Generated interpretation is not a court finding. This static edition does not generate or store summaries.</p>
        <p class="case-abstract">No summary is attached to this record in the recreation. Read the official source above before drawing a conclusion.</p>
      </section>

      <section class="paper-panel" aria-labelledby="topics-title">
        <div class="panel-heading"><p class="section-index"><span>03</span> Context</p><span class="panel-rule"></span></div>
        <h2 id="topics-title">Matched <span class="marker">topics.</span></h2>
        <p class="case-abstract">Topics are assigned by keyword match, not legal analysis. A match does not establish that the court found harassment, discrimination or a psychosocial risk.</p>
        ${tagList(entry.tags, root, { linked: true, className: "tag-list--large" })}
        <div class="topic-links">
          ${topics.filter((topic) => entry.topicSlugs.includes(topic.slug)).map((topic) => `<a href="${root}topics/${topic.slug}/index.html">${esc(topic.name)} ${icon("arrow")}</a>`).join("")}
          <a href="${root}cases/index.html?topic=${attr(entry.topicSlugs[0] || "")}">Search this topic in the archive ${icon("arrow")}</a>
        </div>
      </section>

      <section class="paper-panel" aria-labelledby="trail-title">
        <div class="panel-heading"><p class="section-index"><span>04</span> Provenance</p><span class="panel-rule"></span></div>
        <h2 id="trail-title">Follow the <span class="marker">trail.</span></h2>
        <ol class="provenance">
          <li><span>01</span><div><strong>Official document</strong><p>The publishing authority publishes the judgment or decision. This is the authority.</p></div></li>
          <li><span>02</span><div><strong>Record collected</strong><p>Title, court, date, CELEX and abstract are captured from the public record.</p></div></li>
          <li><span>03</span><div><strong>Topic matched</strong><p>English keyword matches group the record. They are navigation aids, not findings.</p></div></li>
          <li><span>04</span><div><strong>You read the source</strong><p>Open the official document, check the facts and outcome, and cite the original.</p></div></li>
        </ol>
      </section>
    </div>

    <aside class="case-detail-side" aria-label="Case details">
      <section class="paper-panel facts-panel">
        <div class="panel-heading"><p class="section-index"><span>A</span> Facts</p><span class="panel-rule"></span></div>
        <h2>Record <span class="marker">data.</span></h2>
        <dl class="facts-list">
          <div><dt>Case number</dt><dd>${esc(entry.caseNo)}</dd></div>
          <div><dt>CELEX</dt><dd>${esc(entry.celex || "Not recorded")}</dd></div>
          <div><dt>Court</dt><dd>${esc(entry.court)}</dd></div>
          <div><dt>Jurisdiction</dt><dd>European Union</dd></div>
          <div><dt>Judgment date</dt><dd>${esc(entry.dateLabel)}</dd></div>
          <div><dt>Language</dt><dd>${esc(entry.language)}</dd></div>
          <div><dt>Record updated</dt><dd>${esc(entry.updated)}</dd></div>
        </dl>
      </section>

      <section class="paper-panel citation-panel">
        <div class="panel-heading"><p class="section-index"><span>B</span> Cite</p><span class="panel-rule"></span></div>
        <h2>Take the <span class="marker">reference.</span></h2>
        <blockquote>${esc(entry.caseNo)} — ${esc(entry.title)}</blockquote>
        <button class="btn case-copy-btn" type="button" data-copy-citation="${attr(citation)}">Copy citation ${icon("copy")}</button>
        <span class="copy-status" id="copy-status-side" role="status"></span>
      </section>

      <section class="paper-panel file-nav-panel">
        <div class="panel-heading"><p class="section-index"><span>C</span> File</p><span class="panel-rule"></span></div>
        <h2>Move through <span class="marker">the docket.</span></h2>
        ${newer ? `<a class="file-nav" href="${root}cases/${newer.id}/index.html"><span>Newer</span><strong>${esc(newer.caseNo)} · ${esc(newer.title)}</strong>${icon("arrow")}</a>` : ""}
        ${older ? `<a class="file-nav" href="${root}cases/${older.id}/index.html"><span>Older</span><strong>${esc(older.caseNo)} · ${esc(older.title)}</strong>${icon("arrow")}</a>` : ""}
        <a class="text-link" href="${root}cases/index.html">All 85 rulings ${icon("arrow")}</a>
      </section>
    </aside>
  </div>
</section>`;

  return shell({
    root,
    title: `${entry.caseNo} — ${entry.title} — EU JUST`,
    description: entry.subject || entry.title,
    active: "cases",
    page: "case-detail",
    body
  });
}

/* ============================================================
   TOPICS
   ============================================================ */

function topicsPage() {
  const root = "../";
  const stats = [
    { label: "Research topics", value: topics.length },
    { label: "Linked rulings", value: 85 },
    { label: "Keyword matches", value: "Not legal analysis" }
  ];

  const cards = topics
    .map((topic, index) => `<a class="topic-card${index === 0 ? " topic-card--pink" : ""}" href="${root}topics/${topic.slug}/index.html">
      <span class="topic-card__tab">Topic / ${String(index + 1).padStart(2, "0")}</span>
      <div class="topic-card__top"><span class="topic-card__count">${topic.cases.length}</span><span class="topic-card__arrow">${icon("arrow-ne")}</span></div>
      <h2>${esc(topic.name)}</h2>
      <p>${esc(topic.description)}</p>
      <span class="topic-card__cta">Explore this topic ${icon("arrow")}</span>
      <span class="topic-card__ghost" aria-hidden="true">${esc(topic.name.split(" ")[0].toUpperCase())}</span>
    </a>`)
    .join("");

  const body = `${pageHero({
    root,
    index: "00",
    kicker: "Research index",
    title: `Explore workplace rights<br><span class="marker">in EU law.</span>`,
    lede: "Choose a topic to find collected European court records, understand the scope of the collection and follow the official source.",
    stats,
    bgword: "TOPICS",
    breadcrumb: [{ label: "Home", href: "index.html" }, { label: "Research topics" }]
  })}

  <section class="wrap page-section" aria-labelledby="topics-title">
    <div class="section-top"><p class="section-index"><span>01</span> The index</p><span class="section-top__note">3 doors into the record</span></div>
    <div class="topics-head">
      <h2 class="section-title" id="topics-title">Pick a <span class="marker">thread.</span></h2>
      <p>Records are discovered through bounded searches of official sources and grouped using English keyword matches. A topic is a starting point, not a legal assessment.</p>
    </div>
    <div class="topic-grid">${cards}</div>

    <div class="coverage-note coverage-note--dark">
      <span class="coverage-note__icon">${icon("warning")}</span>
      <p><strong>A starting point for research.</strong> The collection is not exhaustive. A topic match is not a legal assessment. Always verify the facts and outcome against the linked official judgment.</p>
      <a class="text-link text-link--light" href="${root}cases/index.html">Search all court rulings ${icon("arrow")}</a>
    </div>
  </section>`;

  return shell({
    root,
    title: "EU workplace rights: research topics — EU JUST",
    description: "Explore workplace harassment, employment discrimination and psychosocial risks in collected EU court records.",
    active: "topics",
    page: "topics",
    body
  });
}

function topicPage(topic) {
  const root = "../../";
  const topicCases = topic.cases.map((id) => caseById[id]).filter(Boolean);
  const featured = topicCases.slice(0, 12);
  const cards = featured.map((entry) => caseCard(entry, root)).join("");
  const related = topic.related.map((item) => topicBySlug[item.slug]).filter(Boolean);

  const body = `${pageHero({
    root,
    index: "01",
    kicker: "Research topic",
    title: `${esc(topic.name)} <span class="marker">in EU case law.</span>`,
    lede: topic.lede,
    stats: [
      { label: "Linked rulings", value: topic.cases.length },
      { label: "Latest on file", value: topicCases[0]?.dateLabel || "—" },
      { label: "Access", value: "Official source" }
    ],
    bgword: topic.name.split(" ")[0].toUpperCase(),
    breadcrumb: [
      { label: "Home", href: "index.html" },
      { label: "Research topics", href: "topics/index.html" },
      { label: topic.name }
    ],
    aside: `<a class="btn btn--ink" href="${root}cases/index.html?topic=${attr(topic.slug)}">Search these rulings ${icon("search")}</a>`
  })}

  <section class="wrap page-section topic-page" aria-labelledby="topic-context-title">
    <div class="topic-context-panel">
      <div class="panel-heading"><p class="section-index"><span>01</span> Read it in context</p><span class="panel-rule"></span></div>
      <h2 class="section-title" id="topic-context-title">Context <span class="marker">matters.</span></h2>
      ${topic.context.slice(0, 2).map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}
      <div class="topic-context-panel__actions">
        <a class="text-link" href="${root}cases/index.html?topic=${attr(topic.slug)}">View the full collection ${icon("arrow")}</a>
        <a class="text-link" href="${root}rules/index.html">Institutional rules &amp; updates ${icon("arrow")}</a>
      </div>
    </div>

    <div class="section-top"><p class="section-index"><span>02</span> Collected court rulings</p><span class="section-top__note">${topic.cases.length} linked records</span></div>
    <div class="case-grid case-grid--topic">${cards}</div>
    ${topic.cases.length > featured.length ? `<div class="load-row"><a class="btn btn--pink" href="${root}cases/index.html?topic=${attr(topic.slug)}">View all ${topic.cases.length} records ${icon("arrow")}</a><p>Showing 12 of ${topic.cases.length} linked records.</p></div>` : ""}

    <div class="topic-search">
      <div>
        <p class="section-index"><span>03</span> Search terms</p>
        <h2>Try a more specific <span class="marker">search.</span></h2>
        <p>${esc(topic.context[2] || "These terms are suggestions for searching the collection; they are not findings about a case.")}</p>
      </div>
      <div class="topic-search__terms">
        ${topic.terms.map((term) => `<a class="topic-chip" href="${root}cases/index.html?topic=${attr(topic.slug)}&q=${encodeURIComponent(term)}">${esc(term)} ${icon("search")}</a>`).join("")}
      </div>
    </div>

    <div class="related-topics">
      <p class="section-index"><span>04</span> Related topics</p>
      <div class="related-grid">
        ${related.map((item) => `<a class="related-card" href="${root}topics/${item.slug}/index.html"><span>${item.name}</span><strong>${item.cases.length} records</strong>${icon("arrow")}</a>`).join("")}
      </div>
    </div>
  </section>`;

  return shell({
    root,
    title: `${topic.h1} — EU JUST`,
    description: topic.lede,
    active: "topics",
    page: "topic",
    body
  });
}

/* ============================================================
   RULES
   ============================================================ */

function rulesPage() {
  const root = "../";
  const total = site.rules.reduce((sum, group) => sum + group.records.length, 0);

  const tabs = site.rules
    .map((group, index) => `<button class="rules-tab${index === 0 ? " is-active" : ""}" type="button" role="tab" id="rules-tab-${index}" aria-controls="rules-panel-${index}" aria-selected="${index === 0 ? "true" : "false"}" tabindex="${index === 0 ? "0" : "-1"}">
      <span>${String(index + 1).padStart(2, "0")}</span>${esc(group.title)}<strong>${group.records.length}</strong>
    </button>`)
    .join("");

  const panels = site.rules
    .map((group, index) => `<div class="rules-panel${index === 0 ? " is-active" : ""}" id="rules-panel-${index}" role="tabpanel" aria-labelledby="rules-tab-${index}">
      <div class="rules-panel__head">
        <div><p class="section-index"><span>${String(index + 1).padStart(2, "0")}</span>${esc(group.title)}</p><p>${esc(group.intro)}</p></div>
        <span class="rules-panel__count">${group.records.length} records</span>
      </div>
      <div class="rules-list">
        ${group.records.map((record, recordIndex) => `<article class="rule-record" data-rule>
          <div class="rule-record__date"><time datetime="${attr(record.dateISO)}">${esc(record.dateLabel)}</time><span>${String(recordIndex + 1).padStart(2, "0")}</span></div>
          <div class="rule-record__body">
            <p class="rule-record__meta"><span>${esc(record.kind || "Record")}</span>${record.refs.map((ref) => `<span>${esc(ref)}</span>`).join("")}</p>
            <h3><a href="${attr(record.href)}" target="_blank" rel="noreferrer">${esc(record.title)} ${icon("arrow-ne")}</a></h3>
            ${record.summary ? `<p class="rule-record__summary">${esc(record.summary)}</p>` : ""}
            ${record.tags.length ? tagList(record.tags, root) : ""}
          </div>
          <a class="rule-record__go" href="${attr(record.href)}" target="_blank" rel="noreferrer" aria-label="Open official source in a new tab">${icon("arrow-ne")}</a>
        </article>`).join("")}
      </div>
    </div>`)
    .join("");

  const stats = [
    { label: "Source records", value: total },
    { label: "Source drawers", value: site.rules.length },
    { label: "Last checked", value: "23 Oct 2026" }
  ];

  const body = `${pageHero({
    root,
    index: "02",
    kicker: "Rules & updates",
    title: `Rules &amp; <span class="marker">updates.</span>`,
    lede: "What the European Ombudsman and European Commission publish on harassment, dignity and mental health at work, followed by the standing references they work from.",
    stats,
    bgword: "RULES",
    breadcrumb: [{ label: "Home", href: "index.html" }, { label: "Rules & updates" }]
  })}

  <section class="wrap page-section rules-page" aria-labelledby="rules-title">
    <div class="section-top"><p class="section-index"><span>01</span> Source register</p><span class="section-top__note">Official links open in a new tab</span></div>
    <div class="rules-head">
      <h2 class="section-title" id="rules-title">The rulebook, <span class="marker">filed.</span></h2>
      <p>Decisions, recommendations, Commission documents and standing rules. The Ombudsman examines how institutions apply their rules — it does not write them.</p>
    </div>

    <div class="rules-shell">
      <div class="rules-tablist" role="tablist" aria-label="Rules source groups">${tabs}</div>
      ${panels}
    </div>

    <div class="coverage-note">
      <span class="coverage-note__icon">${icon("warning")}</span>
      <p><strong>Source note.</strong> Some entries are daily source checks; the standing rules are compiled by hand. A record’s presence here is not an assessment of its legal effect. Open the linked original.</p>
      <a class="text-link" href="${root}monitoring/index.html">See source monitoring ${icon("arrow")}</a>
    </div>
  </section>`;

  return shell({
    root,
    title: "EU staff rules, Ombudsman & Commission updates — EU JUST",
    description: "Ombudsman decisions, Commission updates and standing rules on harassment, dignity and mental health at work.",
    active: "rules",
    page: "rules",
    body
  });
}

/* ============================================================
   DECISIONS
   ============================================================ */

function decisionsPage() {
  const root = "../";
  const cards = site.decisions
    .map((record, index) => `<article class="decision-card${index === 0 ? " decision-card--pink" : index === 2 ? " decision-card--ink" : ""} tilt" data-tilt>
      <span class="tape tape--decision" aria-hidden="true"></span>
      <div class="decision-card__top"><span>Selected record / ${String(index + 1).padStart(2, "0")}</span><time datetime="${attr(record.dateISO)}">${esc(record.dateLabel)}</time></div>
      <p class="decision-card__kind">${esc(record.kind)}</p>
      <h2><a href="${attr(record.href)}" target="_blank" rel="noreferrer">${esc(record.title)} ${icon("arrow-ne")}</a></h2>
      <p class="decision-card__summary">${esc(record.summary)}</p>
      <div class="decision-card__tags">${tagList(record.tags, root)}</div>
      <div class="decision-card__foot">
        <span>${esc(record.ref)} · ${esc(record.source)}</span>
        ${sourceLink(record.href, "Read at source", { root })}
      </div>
      <span class="decision-card__ghost" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
    </article>`)
    .join("");

  const body = `${pageHero({
    root,
    index: "03",
    kicker: "Editorial selection",
    title: `Selected <span class="marker">records.</span>`,
    lede: "A hand-curated selection of recent official records relevant to staff safeguards and oversight. Each entry links to its publishing authority.",
    stats: [
      { label: "Selected records", value: site.decisions.length },
      { label: "Publishing bodies", value: "2" },
      { label: "Curation", value: "Hand-picked" }
    ],
    bgword: "SELECTED",
    breadcrumb: [{ label: "Home", href: "index.html" }, { label: "Selected records" }]
  })}

  <section class="wrap page-section decisions-page" aria-labelledby="decisions-title">
    <div class="section-top"><p class="section-index"><span>01</span> The selection</p><span class="section-top__note">Hand-curated / source-linked</span></div>
    <div class="decisions-head">
      <h2 class="section-title" id="decisions-title">Four records, <span class="marker">read closely.</span></h2>
      <p>Selected because they illuminate how staff safeguards, oversight and transparency fit together. Each card is a doorway to the official document, not a substitute for it.</p>
    </div>
    <div class="decision-grid">${cards}</div>

    <div class="curation-note">
      <span class="curation-note__stamp">Curated<br>with care</span>
      <p><strong>Why these records?</strong> They are contextual to disciplinary transparency and staff safeguards — not findings of harassment. The summaries name the record’s role; the official document is always the authority.</p>
    </div>
  </section>`;

  return shell({
    root,
    title: "Selected EU judgments, Ombudsman decisions & OLAF reports — EU JUST",
    description: "A hand-curated selection of official records relevant to staff safeguards and oversight.",
    active: "decisions",
    page: "decisions",
    body
  });
}

/* ============================================================
   DISCHARGE
   ============================================================ */

function dischargePage() {
  const root = "../";
  const vote = { yes: 389, no: 255, abstain: 3, total: 647 };
  const yesPct = Math.round((vote.yes / vote.total) * 1000) / 10;
  const noPct = Math.round((vote.no / vote.total) * 1000) / 10;
  const abstainPct = Math.round((vote.abstain / vote.total) * 1000) / 10;

  const statuses = site.discharge.statuses
    .map((status) => `<article class="vote-card vote-card--${attr(status.tone)}">
      <p class="vote-card__body">${esc(status.body)}</p>
      <h3>${esc(status.status)}</h3>
      <p>${esc(status.text)}</p>
      ${status.tone === "positive" ? `<div class="vote-bar" aria-label="Vote result: ${vote.yes} for, ${vote.no} against, ${vote.abstain} abstentions"><span style="--w:${yesPct}%"></span><span style="--w:${noPct}%"></span><span style="--w:${abstainPct}%"></span></div>` : `<div class="vote-postponed"><span>${icon("clock")}</span> Awaiting cooperation</div>`}
      ${status.tone === "positive" ? `<dl class="vote-numbers"><div><dt>For</dt><dd>${vote.yes}</dd></div><div><dt>Against</dt><dd>${vote.no}</dd></div><div><dt>Abstain</dt><dd>${vote.abstain}</dd></div></dl>` : ""}
    </article>`)
    .join("");

  const docs = site.discharge.docs
    .map((doc) => `<li><span>${esc(doc.label)}</span><a href="${attr(doc.href)}" target="_blank" rel="noreferrer">${esc(doc.title)} ${icon("arrow-ne")}</a></li>`)
    .join("");

  const followUp = site.discharge.followUp
    .map((item) => `<article class="follow-card">
      <span class="follow-card__type">${esc(item.type)}</span>
      <h3><a href="${attr(item.href)}" target="_blank" rel="noreferrer">${esc(item.title)} ${icon("arrow-ne")}</a></h3>
      <p>${esc(item.text)}</p>
    </article>`)
    .join("");

  const steps = site.discharge.steps
    .map((step, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${esc(step.title)}</strong><p>${esc(step.text)}</p></div></li>`)
    .join("");

  const body = `${pageHero({
    root,
    index: "04",
    kicker: "Accountability file",
    title: `Budget discharge<br>&amp; <span class="marker">follow-up.</span>`,
    lede: site.discharge.intro,
    stats: [
      { label: "Latest cycle", value: "FY2024" },
      { label: "Decision", value: "29 Apr 2026" },
      { label: "Status", value: "Granted / postponed" }
    ],
    bgword: "BUDGET",
    breadcrumb: [{ label: "Home", href: "index.html" }, { label: "Budget discharge" }]
  })}

  <section class="wrap page-section discharge-page" aria-labelledby="discharge-title">
    <div class="section-top"><p class="section-index"><span>01</span> The vote</p><span class="section-top__note">Decision adopted 29 April 2026</span></div>
    <div class="discharge-head">
      <h2 class="section-title" id="discharge-title">The 2024 <span class="marker">discharge.</span></h2>
      <p>${esc(site.discharge.context)}</p>
    </div>
    <div class="vote-grid">${statuses}</div>

    <div class="paper-panel discharge-docs">
      <div class="panel-heading"><p class="section-index"><span>02</span> Official material</p><span class="panel-rule"></span></div>
      <h2>Open the <span class="marker">paper trail.</span></h2>
      <ul class="doc-list">${docs}</ul>
    </div>

    <div class="section-top"><p class="section-index"><span>03</span> Follow-up</p><span class="section-top__note">Previous cycle · FY2023</span></div>
    <div class="follow-head">
      <h2 class="section-title">The reply <span class="marker">file.</span></h2>
      <p>These are published responses to Parliament’s FY2023 observations — earlier-cycle follow-up, not replies to the FY2024 decision above.</p>
    </div>
    <div class="follow-grid">${followUp}</div>

    <section class="explainer" aria-labelledby="explainer-title">
      <div class="explainer__copy">
        <p class="section-index"><span>04</span> Explainer</p>
        <h2 class="section-title" id="explainer-title">What discharge <span class="marker">means.</span></h2>
        ${site.discharge.explainerParagraphs.slice(0, 1).map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}
        <p>${esc(site.discharge.explainerParagraphs[2] || "")}</p>
        <div class="explainer__links">${site.discharge.explainerLinks.map((link) => `<a class="text-link" href="${attr(link.href)}" target="_blank" rel="noreferrer">${esc(link.title)} ${icon("arrow-ne")}</a>`).join("")}</div>
      </div>
      <ol class="steps-list">${steps}</ol>
    </section>

    <p class="notice-block">${icon("warning")} ${esc(site.discharge.timing)}</p>
    <p class="coverage-copy">${esc(site.discharge.coverage)}</p>
  </section>`;

  return shell({
    root,
    title: "EU budget discharge: Parliament decisions & follow-up — EU JUST",
    description: "A clear record of how Parliament scrutinises EU budget execution and what it decided for 2024.",
    active: "discharge",
    page: "discharge",
    body
  });
}

/* ============================================================
   MONITORING
   ============================================================ */

/* Monitoring page data: prefer the real daily-check log, fall back to the captured snapshot. */
const monitoringLog = (() => {
  try {
    const file = "data/monitoring.json";
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
})();

/* Rulings the daily check found by metadata but which have no described record yet. */
const inbox = (() => {
  try {
    return JSON.parse(fs.readFileSync("data/inbox.json", "utf8"));
  } catch {
    return { items: [] };
  }
})();

function monitoringView() {
  const base = site.monitoring;
  const runs = monitoringLog?.runs || [];
  if (!runs.length) return { ...base, live: false };

  const timezone = monitoringLog.schedule?.timezone || "Europe/Brussels";
  const stamp = (iso) => {
    const value = new Date(iso);
    const date = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, day: "numeric", month: "short", year: "numeric" }).format(value);
    const time = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false }).format(value);
    return `${date}, ${time}`;
  };

  const rows = [];
  const latestBySource = new Map();
  for (const run of runs) {
    for (const source of run.sources || []) {
      const row = {
        date: stamp(run.startedAt),
        source: source.name,
        status: source.status,
        discovered: source.discovered,
        new: source.new,
        failed: source.failed,
        note: source.note || "",
      };
      rows.push(row);
      if (!latestBySource.has(row.source)) latestBySource.set(row.source, row);
    }
  }

  const latest = [...latestBySource.values()];
  const totals = latest.reduce(
    (acc, row) => ({ discovered: acc.discovered + row.discovered, new: acc.new + row.new, failed: acc.failed + row.failed }),
    { discovered: 0, new: 0, failed: 0 }
  );
  const clean = runs.find((run) => (run.sources || []).every((source) => source.status !== "Failed"));

  return {
    ...base,
    live: true,
    schedule: monitoringLog.schedule || base.schedule,
    lastChecked: stamp(runs[0].startedAt),
    lastSuccess: clean ? stamp(clean.startedAt) : "Never",
    sources: latest,
    runs: rows,
    totals,
  };
}

function monitoringPage() {
  const root = "../";
  const data = monitoringView();
  const partials = data.sources.filter((source) => source.status === "Partial").length;
  const stats = [
    { label: "Discovered", value: data.totals.discovered },
    { label: "New", value: data.totals.new },
    { label: "Failed", value: data.totals.failed }
  ];

  const sourceCards = data.sources
    .map((source) => `<article class="source-health ${source.status === "Partial" ? "source-health--warn" : ""}">
      <div class="source-health__top"><span class="status-dot" aria-hidden="true"></span><span class="status-badge status-badge--${source.status.toLowerCase()}">${esc(source.status)}</span></div>
      <h3>${esc(source.source)}</h3>
      <p>${esc(source.date)}</p>
      <dl><div><dt>Discovered</dt><dd>${source.discovered}</dd></div><div><dt>New</dt><dd>${source.new}</dd></div><div><dt>Failed</dt><dd>${source.failed}</dd></div></dl>
      ${source.failed ? `<p class="source-health__failure">${esc(source.note.split("document")[0].trim())}</p>` : ""}
    </article>`)
    .join("");

  const rows = data.runs
    .map((run) => `<tr>
      <td>${esc(run.date)}</td>
      <td>${esc(run.source)}</td>
      <td><span class="status-badge status-badge--${run.status.toLowerCase()}">${esc(run.status)}</span></td>
      <td>${run.discovered}</td>
      <td>${run.new}</td>
      <td>${run.failed}</td>
      <td class="run-note">${esc(run.note || "—")}</td>
    </tr>`)
    .join("");

  const body = `${pageHero({
    root,
    index: "05",
    kicker: "Operations",
    title: `Source <span class="marker">monitoring.</span>`,
    lede: data.live
      ? "A scheduled check reads the official sources and records every attempt, including partial failures. A run that fails is logged and exits nonzero."
      : "The collection worker checks official sources and records every attempt, including partial failures. This static edition replays the latest captured run.",
    stats,
    bgword: "MONITOR",
    breadcrumb: [{ label: "Home", href: "index.html" }, { label: "Monitoring" }]
  })}

  <section class="wrap page-section monitoring-page" aria-labelledby="monitor-title">
    <div class="section-top"><p class="section-index"><span>01</span> Control room</p><span class="section-top__note"><span class="live-dot"></span>${data.live ? "Last run" : "Last capture"} ${esc(data.lastChecked)}</span></div>
    <div class="monitor-console">
      <div class="monitor-console__top">
        <span>EU JUST / monitor</span>
        <span class="monitor-console__status">${icon("pulse")} ${data.sources.length} feeds${partials ? ` &middot; ${partials} partial` : " &middot; all clear"}</span>
        <button class="monitor-run" type="button" id="monitor-run">Run sample check ${icon("arrow")}</button>
      </div>
      <div class="monitor-console__body">
        <div class="monitor-stats">
          ${stats.map((stat) => `<div class="monitor-stat"><span>${esc(stat.label)}</span><strong data-count="${stat.value}">${stat.value}</strong><small>latest per source</small></div>`).join("")}
        </div>
        <div class="monitor-sources">${sourceCards}</div>
        <p class="monitor-note" id="monitor-note">${icon("terminal")} ${data.live ? `Scheduled check ${esc(data.schedule.time)} ${esc(data.schedule.timezone)} &middot; recorded by daily-check.mjs` : "Static replay. No live worker is attached to this edition."}</p>
      </div>
    </div>

    <div class="monitor-lower">
      <section class="paper-panel schedule-panel">
        <div class="panel-heading"><p class="section-index"><span>02</span> Schedule</p><span class="panel-rule"></span></div>
        <h2>Daily <span class="marker">check.</span></h2>
        <dl class="schedule-list">
          <div><dt>Time</dt><dd>${esc(data.schedule.time)}</dd></div>
          <div><dt>Timezone</dt><dd>${esc(data.schedule.timezone)}</dd></div>
          <div><dt>Cadence</dt><dd>${data.live ? "Daily, Windows Task Scheduler" : "Daily while the worker runs"}</dd></div>
          <div><dt>Last checked</dt><dd>${esc(data.lastChecked)}</dd></div>
          <div><dt>Last successful run</dt><dd>${esc(data.lastSuccess || "Never")}</dd></div>
        </dl>
        <p class="small-note">${data.live ? "Runs as a scheduled task: node daily-check.mjs at 06:30 Europe/Brussels. A failed source is recorded and the run exits nonzero; a missed day stays visible in the history below." : "The schedule only runs while the worker process is running. This static edition does not schedule checks."}</p>
      </section>

      <section class="paper-panel failure-panel">
        <div class="panel-heading"><p class="section-index"><span>03</span> Failure note</p><span class="panel-rule"></span></div>
        <h2>What <span class="marker">partial</span> means.</h2>
        <p>Partial means some source metadata or document work completed while another part failed. It is not a complete successful check.</p>
        <p class="failure-panel__count">${data.sources.find((source) => source.failed)?.failed || 0} recorded failures</p>
        ${data.live ? "" : `<p class="small-note">Document retrieval × 30 · HTTP 404 × 34 · HTTP 500 × 1</p>`}
      </section>
    </div>

    <section class="run-history" aria-labelledby="run-history-title">
      <div class="section-top"><p class="section-index"><span>04</span> Run history</p><span class="section-top__note">${data.runs.length} recorded source checks</span></div>
      <div class="run-history__head">
        <h2 class="section-title" id="run-history-title">Every <span class="marker">attempt.</span></h2>
        <p>Checks are recorded even when they fail. Success, partial and failed are kept visible so the record can be audited.</p>
      </div>
      <div class="table-frame">
        <table>
          <caption class="sr-only">The 20 most recent source checks</caption>
          <thead><tr><th scope="col">Started</th><th scope="col">Source</th><th scope="col">Status</th><th scope="col">Discovered</th><th scope="col">New</th><th scope="col">Failed</th><th scope="col">Detail</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>

    ${(inbox.items || []).length ? `<section class="run-history" aria-labelledby="inbox-title">
      <div class="section-top"><p class="section-index"><span>05</span> Awaiting a record</p><span class="section-top__note">${inbox.items.length} new at source</span></div>
      <div class="run-history__head">
        <h2 class="section-title" id="inbox-title">Found, not yet <span class="marker">described.</span></h2>
        <p>A source check finds rulings from metadata alone. A case page still needs a title, a subject and topic tags, so these are linked for triage rather than added silently to the archive.</p>
      </div>
      <div class="table-frame">
        <table>
          <caption class="sr-only">Staff judgments and orders discovered but not yet described</caption>
          <thead><tr><th scope="col">Date</th><th scope="col">Case</th><th scope="col">Kind</th><th scope="col">Court</th><th scope="col">Source</th></tr></thead>
          <tbody>${inbox.items.map((item) => `<tr><td>${esc(item.dateISO)}</td><td>${esc(item.caseNo)}</td><td>${esc(item.kind)}</td><td>${esc(item.court)}</td><td><a class="text-link" href="${attr(item.url)}" target="_blank" rel="noreferrer">EUR-Lex ${icon("arrow-ne")}</a></td></tr>`).join("")}</tbody>
        </table>
      </div>
    </section>` : ""}
  </section>`;

  return shell({
    root,
    title: "Monitoring collection checks — EU JUST",
    description: "Source checks, daily schedule and run history for the EU JUST collection.",
    active: "monitoring",
    page: "monitoring",
    body
  });
}

/* ============================================================
   SETTINGS
   ============================================================ */

function settingsPage() {
  const root = "../";
  const providers = site.settings.providers
    .map((provider) => `<option>${esc(provider)}</option>`)
    .join("");

  const body = `${pageHero({
    root,
    index: "06",
    kicker: "Operations",
    title: `AI <span class="marker">settings.</span>`,
    lede: site.settings.intro,
    stats: [
      { label: "Status", value: "Local preview" },
      { label: "Providers", value: "4" },
      { label: "Keys sent", value: "None" }
    ],
    bgword: "SETTINGS",
    breadcrumb: [{ label: "Home", href: "index.html" }, { label: "AI settings" }]
  })}

  <section class="wrap page-section settings-page" aria-labelledby="settings-title">
    <div class="section-top"><p class="section-index"><span>01</span> Provider connection</p><span class="section-top__note">No network calls</span></div>
    <div class="settings-layout">
      <div class="settings-main">
        <div class="settings-head">
          <h2 class="section-title" id="settings-title">Connect your <span class="marker">AI.</span></h2>
          <p>Optional. Bring your own provider and API key to generate source-grounded summaries. This static edition demonstrates the interface only.</p>
        </div>

        <form class="provider-form" id="provider-form" novalidate>
          <div class="provider-form__top"><span>${icon("key")} Provider connection</span><span>Local demo</span></div>
          <div class="provider-form__grid">
            <label class="field" for="provider">
              <span>AI provider</span>
              <select id="provider" name="provider">${providers}</select>
            </label>
            <label class="field" for="api-key">
              <span>API key</span>
              <span class="field__control field__control--password">${icon("key")}<input id="api-key" name="api-key" type="password" placeholder="Demo only — do not paste a real key" autocomplete="off"><button type="button" class="reveal-key" id="reveal-key" aria-label="Show API key">${icon("eye")}</button></span>
            </label>
            <label class="field" for="model">
              <span>Model identifier</span>
              <input id="model" name="model" type="text" placeholder="e.g. gpt-4o-mini" autocomplete="off">
            </label>
            <label class="field" for="endpoint">
              <span>API endpoint <em>optional</em></span>
              <input id="endpoint" name="endpoint" type="url" placeholder="https://api.example.com/v1" autocomplete="off">
            </label>
          </div>
          <p class="provider-form__notice">${icon("warning")} ${esc(site.settings.notice)}</p>
          <div class="provider-form__actions">
            <button class="btn btn--ink" type="button" id="test-connection">Test connection ${icon("pulse")}</button>
            <button class="btn" type="submit">Save provider ${icon("check")}</button>
            <span class="form-status" id="provider-status" role="status"></span>
          </div>
        </form>

        <div class="saved-providers">
          <div class="section-top"><p class="section-index"><span>02</span> Saved providers</p><span class="section-top__note">0 configured</span></div>
          <div class="empty-provider">
            <span class="empty-provider__mark">${icon("key")}</span>
            <div><h2>No provider configured.</h2><p>Every ruling stays readable without AI. The collection does not require a summary layer.</p></div>
          </div>
        </div>
      </div>

      <aside class="settings-aside">
        <section class="paper-panel">
          <p class="section-index"><span>A</span> Read me</p>
          <h2>What this <span class="marker">doesn’t</span> do.</h2>
          <ul class="plain-list">
            <li>No key is sent to a server.</li>
            <li>No provider is contacted.</li>
            <li>No summary is generated.</li>
            <li>No credential is stored.</li>
          </ul>
        </section>
        <section class="paper-panel paper-panel--pink">
          <p class="section-index"><span>B</span> Ground rule</p>
          <h2>AI is a reading aid.</h2>
          <p>Generated interpretation is never a court finding. If a summary is ever added, it must be labelled and kept apart from the official record.</p>
          <a class="text-link" href="${root}monitoring/index.html">See the source checks ${icon("arrow")}</a>
        </section>
      </aside>
    </div>
  </section>`;

  return shell({
    root,
    title: "AI settings for source summaries — EU JUST",
    description: "A local preview of optional AI provider settings for source-grounded summaries.",
    active: "settings",
    page: "settings",
    body
  });
}

/* ============================================================
   OUTPUT
   ============================================================ */

function writePage(file, html) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

writePage("cases/index.html", casesPage());
writePage("pending/index.html", pendingPage());
for (const entry of cases) writePage(`cases/${entry.id}/index.html`, casePage(entry));
writePage("topics/index.html", topicsPage());
for (const topic of topics) writePage(`topics/${topic.slug}/index.html`, topicPage(topic));
writePage("rules/index.html", rulesPage());
writePage("decisions/index.html", decisionsPage());
writePage("discharge/index.html", dischargePage());
writePage("monitoring/index.html", monitoringPage());
writePage("settings/index.html", settingsPage());

const sitemapUrls = [
  "",
  "cases/",
  "pending/",
  "rules/",
  "decisions/",
  "discharge/",
  "topics/",
  "monitoring/",
  "settings/",
  ...topics.map((topic) => `topics/${topic.slug}/`),
  ...cases.map((entry) => `cases/${entry.id}/`)
];

fs.writeFileSync(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapUrls
    .map((url) => `<url><loc>https://www.eujust.online/${url}</loc></url>`)
    .join("")}</urlset>`
);

console.log("Built pages:", 9 + topics.length + cases.length);
console.log("Case pages:", cases.length);
console.log("Topic pages:", topics.length);
