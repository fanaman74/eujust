# EU JUST redesign

Requested reference: https://www.brainfishai.com/

Status: implemented. Brainfish became accessible after the environment network update. Its home, product, blog and integrations pages were inspected at desktop and mobile sizes. The requested visual system has been adapted across EU JUST's public research and operational pages.

## Design intent

The reference's visual system and relevant page compositions give EU JUST a cohesive new identity. Keep the product's research purpose and existing operations. The reference's navigation, typography, colour, section rhythm, imagery, controls and mobile layouts were inspected before specifying visual tokens. Do not infer those details from the brand name or present an unobserved approximation as a faithful redesign.

Readers should quickly understand the coverage, find a relevant record, and open the official document. Operators should see what a source check did and configure monitoring or optional AI without obscuring the public research experience.

## Page adaptation

The following page roles guided the implementation. The reference home/product views inform the home research panel and functional sections; its blog informs editorial collections; its integration catalogue informs category navigation and provider/library organization.

| EU JUST page | Composition and visitor task | Existing behaviour to retain |
| --- | --- | --- |
| Home `/` | A clear introduction leading directly into legal search, followed by recent records and ways into the other research sections. | GET search to `/cases?q=`, topic shortcuts from the database, five latest rulings, view-all action, real collection figures, supplied EU flag photograph on home only. |
| Court rulings `/cases` | A collection browser: concise introduction, prominent search, grouped filters, scannable results and pagination. | Text/topic/court filters, sorting, preserved query parameters, official references, distinct no-data/no-match/error states. |
| Case `/cases/:id` | A reading view with the judgment's identity and official document prominent, readable subject matter, and secondary metadata. Optional interpretation is a clearly separate section. | Full official title, source documents, retrieval status, court/dates/language/CELEX, keyword topic labels, disabled generation without source text, AI labels and citation caveats. |
| Rules and updates `/rules` | An institutional reference library with clearly distinguished standing rules and current updates; visitors choose an institution or jump to the material they need. | Ombudsman and Commission groups, standing policy references, feed timestamps, publishing-authority links, bounded coverage. |
| Selected records `/decisions` | An editorial collection with record type, date, topic and reference easy to scan. | Curated selection and its checked date; no suggestion that these entries are automated discovery or AI analysis. |
| Budget discharge `/discharge` | A structured explainer with the latest cycle, institutional outcomes, follow-up material and in-page navigation. | FY2024 decision and FY2023 follow-up distinction, official Parliament documents, factual vote/outcome details and coverage notes. |
| Monitoring `/monitoring` | An operational screen prioritising source state, the manual check action and understandable outcomes; schedule and detailed history remain available. | Operator token, manual checks, saved schedule, statuses, failure details, retries, polling and overlapping-run protection. |
| AI settings `/settings` | A focused configuration screen separating connected providers from the add/update form. | OpenAI/DeepSeek/OpenRouter/Anthropic, encrypted stored keys, connection tests, reported model catalogue, enable/disable/remove, token handling and request-race protections. |

## Shared system

- Keep the EU JUST name and top navigation. Public research and operator destinations must remain easy to distinguish and accessible on mobile.
- Replace the incumbent visual identity consistently across the shared shell, home, collection, reading and operational surfaces. Update `DESIGN.md` and the home surface brief once the reference has been inspected.
- Reuse factual copy and official links. Do not import reference-site commercial claims, testimonials, customer logos or unsupported features.
- Keep collection rows and controls legible for long case titles and references. Marketing-page spacing should not make search, monitoring or forms difficult to use.
- Keep scope explanations available, but place supporting guidance behind an accessible disclosure where that helps visitors reach the main task sooner.
- Preserve visible keyboard focus, AA contrast, labelled controls, responsive layouts and reduced-motion support.

## Implementation and validation

1. Inspect Brainfish's home and relevant inner pages at desktop and mobile sizes; record which observed compositions are being adapted and why.
2. Establish the new tokens and shared shell, then implement each page role using existing queries, APIs and event handling.
3. Inspect the completed desktop and mobile surfaces in one batched browser pass, including populated records, empty/error states, navigation, filters and operational forms. Fix observed defects in one batch and confirm once.
4. Run the existing tests, Astro type check and production build. Check real filter navigation and source links; exercise operational controls against controlled responses rather than starting lengthy external ingestion as a design check.

The shared shell, typography, colour system, page hierarchy, scope disclosures, research navigation and editorial collections have been redesigned. Existing database queries, API contracts, operational request handling and source/AI distinctions remain in place. Topic shortcuts and a prominent official-document action improve navigation.

## Completed checks

- `npm test`: 34 passed, none skipped or failed.
- `npm run check`: 46 files, zero errors, warnings or hints.
- `npm run build`: successful Node server build.
- Browser checks covered nine rendered routes/states at 1440px desktop and 390px mobile, including populated collections, long case titles, source text present/absent, standing rules, curated records, budget discharge, monitoring history and provider configuration. All 18 renders returned HTTP 200 and had no horizontal page overflow.
- The final axe-core pass reported zero WCAG A/AA rule violations on those renders. This is automated evidence, not a claim of a complete accessibility certification.
- Both viewports passed menu Escape/focus, scope disclosures, search/sorting, topic shortcuts preserving filters, pagination, no-match and missing-record states, official source navigation, summary-button availability, recorded-failure disclosure, schedule validation and save/reload, and provider-model catalogue selection/reset.
- Monitoring authentication and retry-conflict responses, and provider connection responses, were controlled in the browser. No live ingestion or paid AI request was invoked for UI testing.
- Reduced-motion rendering disabled the home reveal. Self-hosted Fraunces was verified as the applied heading face. No JavaScript page errors were recorded.
- Populated-state fixtures were labelled as interface tests and confined to a temporary QA database. The development database was checked separately for its real empty state.
