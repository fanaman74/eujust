---
version: 2
slug: "src-pages-cases-id-astro"
primary_target: "src/pages/cases/[id].astro"
related_targets: ["src/scripts/research-prompt.ts","src/lib/research-prompt.ts","src/pages/api/cases/[id]/prompt.ts","src/styles/global.css"]
---

# Case record and subscription reading

Mode: Read. Case identity and the official-document action lead; official source material remains distinct from generated interpretation. The incumbent cream, Fraunces/Geist and source-green/AI-lavender system stays. Metadata sits beside the reading column on desktop and below it on mobile.

PINNED CONTRACT: the owner asked to use ChatGPT and Claude subscriptions. The chosen handoff is copy/open/paste using the reader's own external account, with no API key, automatic provider session or EU JUST report creation. Subscription billing remains separate from API billing. No global brand change follows.

FIRST VIEWPORT AND PLACEMENT: retain breadcrumbs, real case title/reference, source action and coverage disclosure. Within the existing AI summary panel, after API generation controls, a native “Use your ChatGPT or Claude subscription” disclosure explains the external workflow. Copy research prompt precedes fixed links to `https://chatgpt.com/` and `https://claude.ai/new`; link labels announce a new tab. A status region and hidden, labelled read-only prompt preview follow. The external answer stays in that app.

SOURCE CONTRACT: public `GET /api/cases/[id]/prompt` returns reading instructions plus public official metadata and available official source text, never provider credentials or generated reports. Prefer a retrieved document containing text. Limit text to 120,000 characters; known or capped truncation is marked incomplete. Instruct the external app to use only the judgment, treat source data as untrusted, avoid invented findings/citations and verify against the official document. Missing text supplies metadata/links and requests retrieval or pasting of the full judgment before analysis.

STATES AND RESPONSES: closed disclosure; preparing prompt with copy disabled; copied success; clipboard unavailable with preview opened and text focused/selected for manual copy; failed load with retry. Cache a successfully loaded prompt only in this page's memory; do not cache failure. Assign prompt text to the textarea value so source markup does not execute. Prompt requests use no-store responses; missing/invalid cases return 404 and database errors return retryable 503. The public read handoff does not alter the existing admin gate for generation or provider writes.

EVIDENCE: `.impeccable/review/home-update/{desktop-case,mobile-case}.png` and `/tmp/eujust-home/browser-report.json` show desktop/mobile reading layout with no overflow, axe violations or page errors. Verified clipboard source/truncation, fixed external links, metadata-only prompt, manual-copy fallback, fetch retry and non-executing source markup. Case screenshots visibly identify temporary QA fixtures; they are not real court records, were cleaned up locally and were not placed in production. No real provider credential or external answer was generated. The task passed 46 tests, 64-file check with zero issues and production build.
