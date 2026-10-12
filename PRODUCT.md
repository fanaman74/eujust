# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The general public and press: people without legal training who want to follow EU court rulings on workplace rights. They arrive cold, need to understand in seconds what is tracked, and need a reason to trust it. (Confirmed by the owner, 2 October 2026.)

The owner also operates the site: running source checks, setting the daily schedule, and configuring AI providers.

## Product Purpose

EU JUST monitors the official EUR-Lex / Cellar source for Court of Justice and General Court decisions touching workplace harassment, psychosocial risk and employment discrimination, and presents each one with its official source link. Success is a visitor finding a recent ruling, understanding what it is about, and reaching the official judgment.

## Positioning

Source-first. Every case links to the official EUR-Lex document, and AI-generated interpretation is stored and shown separately from the source record, labelled as generated, never as a court finding.

## Operating Context

- Cases are discovered by a daily monitor against the EUR-Lex SPARQL endpoint; discovery is a bounded window, not exhaustive coverage.
- Topics are assigned by English keyword match, not legal analysis.
- EUR-Lex titles arrive as one `#`-delimited string (formation and date, parties, subject keywords, case number); the app splits them for display only.
- Publication date is usually not recorded; judgment date is.
- Hosted on Railway with a Neon Postgres database.

## Capabilities and Constraints

- Search and filter by text, topic, court; sort; paginate.
- Home Feed: five recent court/institution records with source dates and actual keyword matches, shown in a three-row window that advances upward every five seconds, with Pause/Next and reading/reduced-motion protection; RSS 2.0 at `/rss.xml` serves up to twenty records. RSS publication dates reflect first collection, separately from judgment/document dates.
- Public topic guides for workplace harassment, employment discrimination and psychosocial risks, linked to recent matched records and the full archive.
- Canonical domain: https://www.eujust.online; public records and guides are discoverable through XML sitemaps, while operator/search/preview/error pages are excluded from indexing.
- Case detail: official source, metadata, optional AI summary with verified paragraph citations.
- Case reading handoff: copy public official metadata and available source text into the user's ChatGPT or Claude account; external answers stay there, with no API key or stored EU JUST report.
- Monitoring page: manual source check, daily schedule, run history.
- Provider settings: OpenAI / ChatGPT, Anthropic Claude, DeepSeek and OpenRouter; test API access, choose a reported model or enter an identifier, and save keys encrypted server-side. OpenRouter's searchable public provider directory is distinct from its model catalogue; routing remains with OpenRouter.
- In production, write actions require an admin token header and currently fail closed; there is no login.
- Stack: Astro (server output, Node adapter), plain CSS, self-hosted fonts, PostgreSQL.
- Undecided: how operator pages are protected on the public site.

## Brand Commitments

- Name: EU JUST.
- The standing disclaimer: research support only; always verify against the official judgment.
- Visual direction: the owner requested the Brainfish theme on 12 October 2026. Cream backgrounds, charcoal structure, lime actions, pink editorial accents, Fraunces headings and Geist interface text replace the earlier paper/navy/gold register. Research keeps a top menu; home retains the supplied EU flag image, working search, real collection data and five latest cases with a view-all action. Reading and operational pages adapt the reference to their own tasks. Motion and focus remain accessible. See DESIGN.md.

## Evidence on Hand

- 84 real cases with official titles, case numbers, courts, dates and source links.
- No AI summaries have been generated yet; none may be invented.
- No testimonials, user counts, or press mentions exist; none may be fabricated.
- Hero photography is sourced from freely licensed photographs with credit.
- The user-supplied home hero image is the product's approved home-page image; it belongs to the home hero only and should retain its source credit where displayed.

## Product Principles

1. The official source outranks everything, including the product's own summaries.
2. Say what the data is and is not: bounded discovery, keyword topics, generated interpretation.
3. Plain language for people without legal training; the legal reference stays visible for those who need it.
4. Useful without AI: metadata and source links never depend on a provider.

## Accessibility & Inclusion

Public audience: WCAG AA contrast, full keyboard operation, visible focus, reduced-motion support.
