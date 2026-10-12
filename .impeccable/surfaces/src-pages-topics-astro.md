---
version: 2
slug: "src-pages-topics-astro"
primary_target: "src/pages/topics/[slug].astro"
related_targets: ["src/pages/topics/index.astro","src/data/research-topics.ts","src/components/CaseRow.astro"]
---

# Research topic guides

Mode: Read. Visitors arriving from web searches need to understand the topic's scope, find a collected court record and reach its official source. The directory helps visitors choose a topic.

Inherit the Brainfish-inspired system in DESIGN.md. Use cream surfaces, charcoal type, Fraunces headings, Geist body text and lime actions. A reading flow is more useful than a marketing composition.

The guide provides a concise introduction, topic context, a link to the full filtered archive, up to ten recent keyword-matched records, suggested search terms and related-topic links. Visible breadcrumbs match structured data. Explain that keywords are not findings and the collection is bounded; do not write unsupported legal advice or AI-generated case claims.

The directory uses a simple list of topics with clear explanations. Both surfaces remain useful when no records are collected. Missing topics return 404; unavailable database views return retryable 503 with indexing disabled.

Verification: desktop and mobile, keyboard/landmark/contrast rules, working archive filters and no horizontal overflow. Use fixtures only in the temporary QA database.
