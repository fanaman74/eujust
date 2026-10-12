---
name: EU JUST
description: A public legal register on warm paper, with deep navy structure, one gold signal, Newsreader display type, Archivo interface text and IBM Plex Mono docket references.
platform: web
---

# Design System: EU JUST

## Overview

EU JUST is a public-facing legal research desk. It should read like a well-edited official register with a newsroom's clarity, not like a generic dashboard or an AI-generated marketing page. Three typefaces carry three jobs: an editorial serif for what things are called, a monospace "docket" for references, dates and labels, and a plain sans for reading and acting.

The product truth comes first. Court records, institutional updates and parliamentary discharge material remain linked to the official publishing authority. AI interpretation is optional, clearly labelled and kept separate from the source record. Coverage is bounded by the configured monitors and keyword rules; it is never presented as exhaustive legal coverage.

## Colors

Defined as tokens on `:root` in `src/styles/global.css`.

### Brand

- **Navy ink** (`--ink`, `#0e1b30`) and **ink 2** (`--ink-2`, `#1d2d47`): text, structural rules, primary buttons, the home index band, source boxes and footer.
- **Warm paper** (`--paper`, `#f6f3eb`): page background. **Raised paper** (`--paper-raised`, `#fffdf7`): inputs, scope notes, tags, row hover.
- **Wash** (`--wash`, `#ece7db`): quiet bands such as the discharge explainer and menu hover.
- **Hairline** (`--line`, `#d8d0bf`): dividers, borders of notes, tags and pills.
- **Slate** (`--grey`, `#575f6d`): secondary copy, kickers, dates. Passes AA on paper.
- **Signal gold** (`--wire`, `#e9b03b`): on navy only, or as a non-text accent (hero frame rule, row hover rule, focus ring, selection).
- **Deep gold** (`--wire-deep`, `#8a5a00`): gold text on paper (headline emphasis, kickers that need weight), link hover and focus outlines.
- **On ink** (`--on-ink`, `#f6f3eb`) and **on-ink muted** (`--on-ink-muted`, `#b9c3d2`): text on navy.

### Status

- **AI amber** (`#7a4a00` on `#fdf1d3`, border `#e8cf8f`): generated interpretation only.
- **Success green** (`#0b6b34` on `#e3f2e6`), **warning amber** (`#7a4a00` on `#fdf1d3`), **danger red** (`#b4233c` on `#fbe9ec`).

Status colours communicate state; they never decorate unrelated content.

## Typography

All fonts are self-hosted in `public/fonts` (SIL Open Font License).

- **Display:** Newsreader (variable, optical sizing), weight 450–500, slight negative tracking. Page titles, section headings, record titles, ledger figures and the source link. The home headline sets its second clause in gold italic.
- **Interface and body:** Archivo variable. Navigation, controls, ledes, running text. Body 1.0625rem / 1.55; ledes 1.1875rem.
- **Docket:** IBM Plex Mono 400/500 at 0.75–0.8125rem. Kickers above headings, dates in record rows, case numbers and CELEX, fact labels, table headings, result counts and footer labels.
- Headings and controls stay in sentence case. Nothing is set in uppercase except the `EU JUST` wordmark.

## Layout and hierarchy

- Content max width is 1280px (`--max`) with gutter `clamp(16px, 4vw, 48px)`; narrow operational pages use 1040px.
- The masthead is sticky, translucent paper. The four research sections are always-visible links with a drawn underline for the current page; Monitoring and AI settings sit in a small bordered Operations menu with the feed-check time beside it. Below 900px everything collapses into one Menu disclosure. Menus close on outside click and Escape.
- Inner pages open with a mono kicker, a Newsreader title and a lede, then a hairline, then the scope note ("About this page": what you will find, coverage and limits) as a quiet bordered two-column box.
- Records are rows, not cards: mono date, serif title, slate subject, tags, and a right-aligned mono reference with court. Rows are separated by hairlines under a 1.5px ink rule.
- Sections separate with rules and whitespace. Use one navy band per page at most.

## Home page

1. Hero on paper: kicker, headline, lede, a prominent search box (GET `/cases?q=`) and topic shortcuts from the topics table. The supplied EU flag photograph sits right in a frame with a 6px gold base rule. It stacks at 1000px and moves above the copy below 600px.
2. Ledger: up to four real figures (rulings on record, most recent judgment, last court-feed check, monitored feeds). A cell without data is omitted, never estimated.
3. Latest five rulings, newest judgment first, with a link to all.
4. Navy index band: the four sections with a one-sentence description and their real cadence or source.
5. "How to read a record": source, interpretation, coverage.

## Shape, depth and motion

- Radius is 3px for controls, panels and frames; pills (topic shortcuts, jump links) are fully rounded. No other rounding.
- Depth comes from rules and tone. The only shadows are on open menus and the home search box.
- Motion: home copy rises once (700ms); the hero photograph wipes in with `wire-in` (900ms). Row hover fades a raised surface with a gold inset rule, draws the title underline and shifts the arrow. Nav underline draws on hover. Colour swaps use 160ms with the shared ease-out curve.
- `prefers-reduced-motion: reduce` collapses all transitions and animations. Focus remains visible.
- Never use gradients, glows or decorative animation to imply authority.

## Components

- **Buttons:** 46px tall, 1.5px border, 3px radius. Primary is navy; secondary is outlined; gold is reserved for use on navy; danger keeps the danger pair. Disabled is visibly muted and non-interactive.
- **Fields:** raised paper, 1px warm-grey border, ink border on hover, ink border plus translucent gold ring on focus.
- **Source box:** navy block labelled "Official source" in gold mono, the link set in the display face.
- **AI panel:** amber surface and border, with the disclaimer always visible above any generated text.
- **Status badges:** status colour plus a text label; colour never carries meaning alone.

## Content rules

- Always link the official EUR-Lex or relevant institutional document.
- Describe the monitor as bounded discovery based on configured topics and source windows, never as exhaustive or as legal advice.
- Keep source metadata separate from AI reports, and label generated summaries as generated.
- Do not invent cases, findings, statistics, testimonials, quotes, endorsements or provider capabilities.
- Use plain language for readers without legal training while keeping the legal reference visible.

## Don't

- Do not bring back the tricolon hero, uppercase eyebrows, shield trust rows, icon-in-tinted-square card grids, self-quoted blockquotes or a generic closing CTA band.
- Do not put the scope note or panel headings in a filled box with a gold left bar; that pattern was retired.
- Do not use a side menu or repeat the home photograph on other pages.
- Do not present AI interpretation as a court finding or hide its generated status.
- Do not remove official links, bounded-coverage language or the research-support disclaimer.
