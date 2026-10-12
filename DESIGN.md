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

- **Home — find, then understand.** A full-viewport introduction over a pale-green Europe map video authored in Remotion, with landscape and portrait compositions. The owner removed the hero search and topic strip; collection search remains in navigation and the archive. The framed Feed panel retains the approved EU flag photograph beside “Latest updates”: five recent court/institution records in a three-row viewport that moves up one row every five seconds. Each item carries its source date, title link, publishing court/institution and actual keyword matches. The panel links to all topic guides and has icon-only Pause/Play and Next controls with accessible names. The RSS button is removed; browser feed discovery remains in the shared document head. Autoplay stops on hover, keyboard focus, offscreen/hidden state and reduced motion. Long titles use two-line previews, with their full link names and source records retained. Real collection metadata and four compact service cards in one desktop row, with two columns at 1000px and one at 600px, retaining 360px minimum rows and court-card padding precede a dark/lavender latest-courts section: five real records plus a distinct archive card, with source metadata and actual source links. Source/interpretation/coverage guidance follows directly; the owner removed the duplicate dark research index.
- **Court rulings — operate.** Concise heading, expandable scope guidance, topic category links, a grouped search/filter area, result rows and pagination. Topic shortcuts preserve the other filters and reset pagination. Long titles, judgment dates and case references are readable without invented thumbnails.
- **Research topics — read.** A plain directory leads to three source-grounded topic guides. Each opens with visible breadcrumbs and a concise explanation, then context, recent matched records, useful search terms and related topics. Reuse the existing research typography and record rows; no invented legal outcomes or decorative thumbnails.
- **Case record — read.** Case identity and an official-document action lead. Source information and optional AI interpretation are visually distinct. A native disclosure within the AI panel offers copying an official-source reading prompt into ChatGPT or Claude; the external answer is not stored as a report. Secondary metadata and matched topics occupy an aside on desktop and stack below on mobile.
- **Selected records — read.** The reference's editorial/blog collection is adapted as a two-column set of curated records with factual dates, topics and source references. The selection date and its separation from automatic discovery remain explicit.
- **Rules — read.** Institution groups and standing references use expandable library sections with existing in-page links. A fragment link opens the requested section. Official links and monitoring limits remain available.
- **Budget discharge — read.** A pink fiscal-year stamp, institution outcome panels, official material, previous-cycle replies and the numbered procedural explanation form a structured guide. The actual sequence earns the step numbers.
- **Monitoring and AI settings — operate.** Pale green workspace, local navigation between monitoring and providers, white form/history panels, compact controls and labelled states. AI settings use the owner-approved Brainfish Platform card: white connection form beside a pale connection-details area, dark offset shadow, Fraunces heading, lime test action and purple line icons; the columns stack on mobile. OpenRouter's searchable provider directory stays distinct from model selection. Existing token, retry, polling, schedule and model-catalogue behaviours remain intact.

## Components, motion and accessibility

Primary buttons use the reference's lime fill and restrained 2px dark offset. Secondary buttons are plain outlined controls. Inputs have 7px rounding; panels 12–14px; category/topic controls are pills. Focus is a visible deep-green outline or input ring. Hover states clarify the active link or control without moving the content layout.

The home research frame reveals once through a bounded clip-path animation. The pale-green Europe map is a silent 12-second loop with icon-only Pause/Play and native fullscreen controls. Static posters are the default for reduced motion and data saving. Reduced-motion users receive a static default and may voluntarily press Play. The video pauses while the hero is offscreen or the document is hidden; returning resumes only when playback is selected. The latest-courts section adapts Brainfish's browser-verified 30-second wave and grid-triggered full-section sonar: a 140px green trail and row-delayed 900ms pulses, with duration and delays measured from the section height; Pause/Play and Replay controls affect decoration only, never record data or status. Card text wipes into view at the measured position and speed of the green line. Keyboard focus or manual Pause exposes the complete text immediately. It pauses offscreen/hidden and stays static with complete text and controls hidden under reduced motion. Elsewhere, motion is limited to controls, chevrons and arrows. Reduced-motion users receive static frames and negligible transitions.

Coverage guidance is a keyboard-operable native disclosure, initially closed so it does not push the primary task away. Source and AI labels remain visible where the content appears. Hidden model-catalogue controls remain hidden until populated. Empty, no-match, missing-record, loading and failure states use the same system.

Do not add fake activity graphics, commercial testimonials, decorative legal imagery, claims of complete coverage or an AI-first sales call to action. The home photograph remains on home only.
