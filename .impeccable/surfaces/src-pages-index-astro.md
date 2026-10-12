---
version: 2
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/pages/cases/index.astro","src/layouts/Layout.astro","src/components/CaseRow.astro","src/styles/global.css"]
---

# Home page

Mode: Operate — find, then understand. Public and press visitors should understand the bounded collection, search or open a ruling, and reach its official source. Operator pages are separate destinations.

Owner direction: Brainfish's theme, requested 12 October 2026. Reference inspected at desktop/mobile: home, product, blog and integrations. The shared system is recorded in DESIGN.md.

Retained commitments: EU JUST name; top menu; approved EU flag photograph on home only; real figures; latest five cases; view-all action; factual coverage and AI distinctions.

FIRST VIEWPORT: cream navigation, centred Fraunces headline, short product explanation, a prominent working legal search and database topic shortcuts. The owner additionally requested a Gemini-like blue, violet and pink animated gradient behind this hero. Keep the aura soft beneath legible text and controls; it is a home-specific extension, not a new global palette. A wide framed research panel follows: the approved photograph pairs with real navigation through the court, rules and accountability pages. No imaginary ticket/workflow runs or sample judgments appear in the shipped UI.

BELOW: real collection metadata, five latest rulings, a charcoal research index and three reading principles. The footer is light with an oversized wordmark and the standing disclaimer.

MOTION: the research frame reveals once through clip-path. Two aura layers drift over 20- and 26-second alternate cycles. A keyboard-operable “Pause background animation” control changes to “Resume background animation”, updates its pressed state and pauses both aura layers. Reduced motion gives a static aura and frame and hides the redundant motion control. The decorative aura is hidden from assistive technology and cannot intercept input. Other transitions clarify controls and navigation.

STATES AND PROTECTION: collection metadata and topic shortcuts appear only when backed by data; the latest section shows five real rulings, a truthful empty state, or a database failure state. Database failure returns retryable 503 and disables indexing. GET search and topic links remain the primary actions. The pause state is local to the current page and does not alter search or source navigation.

VERIFICATION: `.impeccable/review/hero/desktop.png` and `mobile.png`, plus `/tmp/eujust-provider/browser-report.json`, cover desktop/mobile layout, no horizontal overflow or reported accessibility violations, animation progression, pause and reduced motion. The screenshots use the isolated QA database and show its empty collection; they do not replace live collection evidence. No broader brand change is implied.

IMPLEMENTATION: code-led adaptation of the observed reference; no generated illustration or speculative mock-up is needed.
