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

FIRST VIEWPORT: cream navigation, centred Fraunces headline, short product explanation, a prominent working legal search and database topic shortcuts. The owner's corrected direction is visibly moving, pale green in the existing lime family, with a subtle dot pattern. Keep text and controls legible; this is a home-specific expression, not a global palette change. A wide framed research panel follows: the approved photograph pairs with real navigation through the court, rules and accountability pages. No imaginary ticket/workflow runs or sample judgments appear in the shipped UI.

BELOW: real collection metadata, then four owner-requested Brainfish add-on-style service cards above the latest courts. Cards link to `/cases`, `/rules`, `/decisions` and `/discharge`; each carries three accurate existing capabilities, purple line icon, green ticks and a real navigation action. White rounded cards use a dark offset on the first card; four columns become two at 1050px and one at 600px. Five latest rulings, a charcoal research index and three reading principles follow. The footer is light with an oversized wordmark and the standing disclaimer.

MOTION: the research frame reveals once through clip-path. The green gradient loops over 12 seconds and the dot pattern over 18 seconds. A keyboard-operable “Pause background animation” control changes to “Play background animation” and updates its pressed state. Reduced motion gives a static default and frame while keeping Play visible for voluntary playback. Both layers pause automatically when the hero is offscreen or the document hidden; returning resumes selected playback, while manual Pause remains authoritative. A changed reduced-motion preference resets to its matching default. The decorative aura is hidden from assistive technology and cannot intercept input. Other transitions clarify controls and navigation.

STATES AND PROTECTION: collection metadata and topic shortcuts appear only when backed by data; the latest section shows five real rulings, a truthful empty state, or a database failure state. Database failure returns retryable 503 and disables indexing. GET search and topic links remain the primary actions. The pause state is local to the current page and does not alter search or source navigation.

VERIFICATION: `.impeccable/review/home-update/{desktop-home,mobile-home,desktop-services,mobile-services,desktop-motion-0,desktop-motion-3,mobile-motion-0,mobile-motion-3}.png` and `/tmp/eujust-home/browser-report.json` cover correct service destinations/order, no horizontal overflow, axe violations or page errors. Frames three seconds apart show visible change above the report's threshold across 61% of desktop and 49.7% of mobile pixels. `/tmp/eujust-home/motion-fix-report.json` verifies static reduced-motion default, voluntary Play, manual Pause, both layers paused offscreen/hidden and resumption on return at both widths, including reduced-motion playback. Home screenshots were captured after QA cleanup with zero local records and an honest empty state; no fixtures were added to production. Task validation passed 46 tests, check across 64 files with zero issues and production build.

IMPLEMENTATION: code-led adaptation of the observed reference; no generated illustration or speculative mock-up is needed.

REVIEW: ship. The reduced-motion opt-in override that prevented both layers from pausing is resolved; the final motion regression report passes.
