---
name: EU JUST
description: A source-first legal research desk inspired by Brainfish: cream surfaces, charcoal structure, lime actions, Fraunces headings and Geist interface text.
platform: web
---

# Design system: EU JUST

The owner requested a redesign using https://www.brainfishai.com/. The reference's home, product, blog and integrations pages were inspected at desktop and mobile sizes on 12 October 2026. Their shared language is a light cream canvas, charcoal type, lime actions, expressive serif headings, compact sans-serif controls and framed product views. EU JUST adapts that system to finding and reading legal records rather than importing the reference's sales journey.

## Product truth

The official document remains the authority. AI interpretation is optional and separate, with its generated status visible. Topics are keyword matches, discovery is bounded, and research support is not legal advice. Only real database figures and actual curated records are shown. Never invent cases, findings, summaries, credentials or source-check success.

## Palette and type

Tokens live in `src/styles/global.css`.

- Cream canvas `#fcfff7`; white reading/form surfaces; pale green operational background `#f5f7ef`.
- Charcoal `#262626`; deeper charcoal `#111114` for the home research-index band and discharge source material.
- Lime `#a3e635` for primary actions. Deep green `#42651d` for accent text, focus and borders. Pale lime `#e9fec8` for official-source panels and monitoring context.
- Pink `#f7c8d9` and pale pink `#fff0f5` distinguish editorial selections and the discharge cycle. AI panels use a separate lavender system to keep interpretation distinct from source material.
- Secondary text `#5b6056`; border `#dfe3d9`. Status colours retain text labels.
- Fraunces variable is the heading face; Geist variable carries interface/body text; Geist Mono is limited to case references and dates.
- Latin and Latin Extended font subsets are self-hosted with their SIL Open Font Licences in `public/fonts`. No runtime font request is required.

## Shared shell

A sticky, opaque cream masthead keeps the EU JUST wordmark, four research sections and Operations menu. The desktop search action links to the existing collection. Mobile uses a native disclosure menu; outside click and Escape close menus, and Escape returns focus to the summary.

The footer is light, with research, operations and official-source links, a quiet oversized EU JUST lockup and the standing source/AI disclaimer. It does not claim deployment status or completeness.

Content is limited to 1240px with responsive gutters. Reading and operational content uses stable columns rather than marketing spacing. Headings cap at 5rem on home, with smaller inner-page titles. Body copy has a comfortable reading measure.

## Page compositions

- **Home — find, then understand.** Centred introduction and GET search; real topic shortcuts. A framed research panel pairs the approved EU flag photograph with three working paths through court rulings, institutional rules and parliamentary accountability. It adapts the reference's prominent product view without pretending to show an executed workflow. Real collection metadata, the latest five rulings, a dark research index and source/interpretation/coverage guidance follow.
- **Court rulings — operate.** Concise heading, expandable scope guidance, topic category links, a grouped search/filter area, result rows and pagination. Topic shortcuts preserve the other filters and reset pagination. Long titles, judgment dates and case references are readable without invented thumbnails.
- **Research topics — read.** A plain directory leads to three source-grounded topic guides. Each opens with visible breadcrumbs and a concise explanation, then context, recent matched records, useful search terms and related topics. Reuse the existing research typography and record rows; no invented legal outcomes or decorative thumbnails.
- **Case record — read.** Case identity and an official-document action lead. Source information and optional AI interpretation are visually distinct. Secondary metadata and matched topics occupy an aside on desktop and stack below on mobile.
- **Selected records — read.** The reference's editorial/blog collection is adapted as a two-column set of curated records with factual dates, topics and source references. The selection date and its separation from automatic discovery remain explicit.
- **Rules — read.** Institution groups and standing references use expandable library sections with existing in-page links. A fragment link opens the requested section. Official links and monitoring limits remain available.
- **Budget discharge — read.** A pink fiscal-year stamp, institution outcome panels, official material, previous-cycle replies and the numbered procedural explanation form a structured guide. The actual sequence earns the step numbers.
- **Monitoring and AI settings — operate.** Pale green workspace, local navigation between monitoring and providers, white form/history panels, compact controls and labelled states. Existing token, retry, polling, schedule and model-catalogue behaviours remain intact.

## Components, motion and accessibility

Primary buttons use the reference's lime fill and restrained 2px dark offset. Secondary buttons are plain outlined controls. Inputs have 7px rounding; panels 12–14px; category/topic controls are pills. Focus is a visible deep-green outline or input ring. Hover states clarify the active link or control without moving the content layout.

The home research frame reveals once through a bounded clip-path animation. Other motion is limited to controls, chevrons and arrows. Reduced-motion users receive static frames and negligible transitions.

Coverage guidance is a keyboard-operable native disclosure, initially closed so it does not push the primary task away. Source and AI labels remain visible where the content appears. Hidden model-catalogue controls remain hidden until populated. Empty, no-match, missing-record, loading and failure states use the same system.

Do not add fake activity graphics, commercial testimonials, decorative legal imagery, claims of complete coverage or an AI-first sales call to action. The home photograph remains on home only.
