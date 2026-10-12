---
name: EU JUST
description: A source-first European legal research desk with warm paper, deep navy structure, restrained gold and blue signals, and readable serif display type.
platform: web
---

# Design System: EU JUST

## Overview

EU JUST is a public-facing legal research desk. The supplied landing-page HTML is the visual reference: an open, calm research surface with warm paper, deep navy structure, restrained blue and gold signals, a readable serif display face, and Archivo for interface text. The result should feel like a well-edited institutional publication rather than a generic dashboard or an AI-generated marketing page.

The product truth comes first. Court records, institutional updates and parliamentary discharge material remain linked to the official publishing authority. AI interpretation is optional, clearly labelled and kept separate from the source record. Coverage is bounded by the configured monitors and keyword rules; it is never presented as exhaustive legal coverage.

The home page owns the user-supplied EU flag photograph in a two-column navy panel: copy on the left and the photograph on the right. The columns stack at 680px. Other pages use the shared paper-and-navy shell without repeating the hero. The site keeps the existing `wire-in` hero animation, useful hover and accordion transitions, dropdown chevron motion, and a `prefers-reduced-motion` fallback.

## Colors

### Brand

- **Navy ink** (`--ink`, `#10213a`): body text, structural rules, buttons, hero block, source boxes, footer and inverted rows.
- **Warm paper** (`--paper`, `#fbfaf6`): page background, controls and light text surfaces.
- **Blue-grey wash** (`--wash`, `#eef2f5`): quiet bands, filter surfaces, neutral badges and guidance panels.
- **Hairline** (`--line`, `#cbd4dd`): dividers inside data groups and the paper masthead.
- **Muted slate** (`--grey`, `#526274`): secondary copy, dates, hints and table headings.
- **Research blue** (`--blue`, `#1757bd`) and its pale surface (`--blue-soft`, `#eaf1fb`): links and small navigational signals.
- **Signal gold** (`--wire`, `#f0b83e`): home hero emphasis, selection, active marks and motion cues where contrast permits. The home copy has no separate gold top border.
- **Deep gold** (`--wire-deep`, `#8b5c00`): gold text on light surfaces, button fills, link hover and focus outlines.
- **On-ink muted** (`--on-ink-muted`, `#c8d2df`): secondary copy on navy surfaces.

### Status

- **AI amber** (`#7a4a00` on `#fff4d6`): generated interpretation only.
- **Success green** (`#0b6b34` on `#e5f5ea`): successful checks and saves.
- **Warning amber** (`#7a4a00` on `#fff4d6`): partial runs and recoverable states.
- **Danger red** (`#b4233c` on `#fdecef`): failed runs, error notices and destructive actions.

Status colours communicate state; they do not decorate unrelated content. The brand layer is navy, paper, slate, blue-grey and gold.

## Typography

- **Display:** `Georgia, 'Times New Roman', serif`, generally 700, with a compact 1.04 line height and slight negative tracking. Used for page titles, hero headlines and section headings so long legal titles retain a literary, readable rhythm.
- **Interface and body:** Archivo variable, with the existing local font files and normal width. Used for navigation, controls, metadata, tables, ledes and running text.
- **Body:** 1.0625rem with 1.55 line height; reading blocks are held to roughly 62–70 characters where practical.
- **Lede:** 1.1875rem, normal weight, used for the purpose statement of a page or section.
- **Small and labels:** 0.9375rem for supporting copy, 0.875rem for labels, and 0.8125rem for badges and status metadata.
- **Figures:** dates, counts and tables use tabular numerals.
- Headings and controls stay in sentence case. The product name is the only deliberately uppercase wordmark.

## Layout and hierarchy

- The sticky masthead is warm paper with a thin slate divider. `Research` and `Operations` are the two disclosure menus; their child pages appear in the dropdown rather than competing for permanent horizontal space.
- The main content uses the shared page gutter `clamp(16px, 4vw, 56px)` and a 1440px maximum width. Narrow detail pages use a 1040px maximum.
- Page guides, section headers and panels use a navy or blue-grey rule and restrained fills to establish clear separation. Avoid a grid of identical cards when a row, list or editorial block communicates the relationship better.
- The home hero is a two-column navy panel with copy on the left and the supplied photograph on the right; it becomes one column at 680px. The photograph is not duplicated on research and operations pages.
- Official source links, case numbers, courts and dates should remain visually easy to find. A source box is a solid navy block; generated interpretation stays in an amber panel with its disclaimer.

## Shape, depth and motion

- Controls use a 2px border, 46px minimum height and only a 2px radius where a small softening improves usability. Home buttons use a 4px radius and home category cards use a 6px radius. Editorial sections rely on rules, whitespace and tone rather than ornamental cards.
- The home copy enters with `wire-in`, a 900ms left-to-right clip-path wipe, without a separate gold top border. Colour swaps use 160ms; row and bar inversions use 180ms; arrow and chevron movement uses the shared ease-out curve and stays subtle.
- `prefers-reduced-motion: reduce` collapses transitions and animations to 0.01ms. Focus remains visible when motion is reduced.
- Never use gradients, glows, glass effects or decorative animation to imply authority. Motion should explain state or acknowledge interaction.

## Components

### Navigation

The masthead is sticky, keyboard operable and responsive. The wordmark reads `EU JUST`, with `JUST` in deep gold. Each dropdown summary has a visible chevron and active-page state. The source-check date remains secondary and collapses to a shorter label on small screens.

### Buttons and fields

Buttons and fields use the navy, paper and gold tokens, with a 46px control height, visible 3px focus outline and sentence-case labels. The primary action is navy on paper or gold on a navy hero; secondary actions are outlined. Danger actions retain the danger pair. Disabled controls are visibly muted and non-interactive.

### Records and lists

Case rows show the judgment date, title, subject, court and case number in a predictable order. Hover and keyboard focus use a navy inversion with the arrow shifting slightly; the record remains identifiable without hover. Sorting and page lists place the latest dated records first.

### Guidance, source and status panels

Page guides explain what each destination provides before its records. Source panels foreground official links and retrieval notes. AI panels disclose generated interpretation and never replace the official record. Monitoring badges and retry states use status colours with text labels, not colour alone.

## Content rules

- Always link the official EUR-Lex or relevant institutional document.
- Describe the monitor as bounded discovery based on configured topics and source windows, never as exhaustive or as legal advice.
- Keep source metadata separate from AI reports, and label generated summaries as generated.
- Do not invent cases, findings, statistics, testimonials, endorsements or provider capabilities.
- Use plain language for readers without legal training while keeping the legal reference visible.

## Do

- Use the supplied EU flag image on the home hero only and preserve attribution when it is supplied.
- Make each page's purpose explicit before presenting records or controls.
- Keep the official record one clear action away from every result.
- Use navy, paper, slate, blue-grey and gold for the brand; reserve amber, green and red for status.
- Preserve keyboard operation, visible focus, responsive menus and reduced-motion behavior.

## Don't

- Do not resurrect the earlier black-and-red palette or an obsolete brand identity.
- Do not use a side menu, repeated hero photograph or large decorative gradients.
- Do not present AI interpretation as a court finding or hide its generated status.
- Do not turn every section into a rounded card or add unearned marketing language.
- Do not remove official links, bounded-coverage language or the research-support disclaimer.
