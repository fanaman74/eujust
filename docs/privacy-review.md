# EU JUST GDPR review — 29 October 2026

Implementation update, 29 October: a privacy page and links have now been added locally, along with cookie-information changes and a dedicated static publication directory. The static build, 51 tests and desktop/mobile browser checks passed. These changes have not been deployed; the findings below describe the live-site snapshot taken before this implementation. See `docs/privacy-policy-notes.md` for remaining controller confirmations.

## Assessment

EU JUST still has significant privacy-transparency gaps. I could not locate a published privacy notice in the inspected pages, their links or the project. A full compliance determination also needs organisational records and contracts that are not exposed by the site or connected tools.

This review used the installed GDPR compliance skill as a checklist, inspected the current public site and project code, and checked Railway's production service. Unverified recent enforcement examples in the skill were not used as legal authority.

## Confirmed context

- Controller details supplied by the owner: **msoit**, **Belgium**, **hello@msoit.eu**. These need to be made accessible on the website. Confirm the full legal entity name if msoit is a trading name.
- Railway production service `eujust`, custom domain `www.eujust.online`, is now configured for **EU West / Amsterdam**, region `europe-west4-drams3a`.
- The region-change deployment `58ad37c6-93ad-44fb-841b-91083001db4d` reports **SUCCESS**. No staged changes were reported. Tracing and automatic instrumentation are off.
- The owner confirmed the **Hobby** plan. Railway documents a **seven-day log-history window** for that plan, but says upgrading a plan restores logs outside the prior window. This is not evidence of irreversible deletion after seven days.
- A bounded Railway HTTP-log inspection on 26 October confirmed request records include source IP, user agent, path, host, timestamp, status and timing. Individual visitor values are not reproduced in this report.
- The live site still matches the static build. The repository's separate Astro/Postgres implementation can store encrypted API keys and generate AI summaries; its presence in source is not proof those features are live.
- Local remediation now includes a privacy page, revised cookie information and a tested static-publication boundary. These changes remain undeployed; their presence in the workspace does not resolve live-site findings until deployment is verified.

## Priority findings

| Priority | Finding | Evidence/status | Required action and GDPR reference |
| --- | --- | --- | --- |
| High | No discoverable privacy notice or public controller/contact disclosures | No notice link on the live homepage or inspected settings/pending pages; `/privacy` and `/privacy-policy` return 404. Local `index.html:489` has no privacy link. | Publish an accessible notice naming msoit and its privacy contact, and explain purposes, lawful bases, recipients, transfers, retention, rights and complaints. Identify the source/categories of indirectly obtained data. Arts. 12–14. |
| High | File serving exposes project source | A harmless public request to `/serve.js` returned the deployed server source. It uses the working directory as its root and reads requested files without restricting requests to intended website output. | Finish and verify the dedicated-public-output fix, then deploy it. Check the deployment artifact for sensitive files; source availability alone does not establish that credentials or personal data leaked. Arts. 25, 32. |
| High | No documented basis for court-data reuse found in the inspected project | Live pending-case entries identify lawyers; case titles and source records can identify natural persons. `harvest-pending.mjs:39` extracts parties and representation details; `build.mjs` republishes them. | Assess an appropriate lawful basis for EU JUST's own processing. If relying on legitimate interests, document purpose, necessity and balancing, including the effects of making names searchable. Explain the interests and any Art. 14 exception relied upon. Arts. 5, 6, 14, 21. |
| High, conditional | Sensitive information in judgments needs a separate assessment | Full-text ingestion and AI-sharing paths exist in the Astro code (`src/lib/ai.ts:123`). This review did not establish that every collected case contains special-category data or that those paths are live. | Screen actual records for identifiable health or other Art. 9 data and document the applicable condition where present. Assess Art. 10 only where criminal-conviction/offence data is actually involved. Public availability does not remove these requirements. |
| Medium | No accessible privacy-request route or documented handling procedure found | The owner supplied an email in this chat, but the inspected site does not publish it as a privacy contact. No rights-handling procedure was found in the project. | Publish hello@msoit.eu for access, correction, objection, restriction and applicable erasure requests. Establish proportionate identity checks, logging, response and escalation. Usually respond within one month; notify any justified extension within that month. Arts. 12, 15–22. A dedicated web form is optional. |
| Medium | Railway processor arrangements and onward transfers remain unverified | Amsterdam application hosting is confirmed. Execution of Railway's DPA, support/subprocessor locations, log storage and applicable transfer safeguards were not established. | Confirm an Art. 28 agreement and review actual recipients and access locations. Assess Chapter V transfers where they occur. An EU application region alone does not establish that all processing stays in the EEA. Arts. 13–14, 28, 44–49. |
| Medium | Retention is not documented across processing activities | The cookie has a configured 180-day duration. No collection/rights-correspondence/backup retention schedule was found. The server does not itself write access logs, but Railway does retain request records. | Define defensible periods or criteria for each activity and explain them. Distinguish the Hobby log-viewing window from deletion, and confirm Railway's underlying retention commitments. Arts. 5(1)(e), 13(2)(a), 14(2)(a). |
| Medium | Provider interaction needs fuller disclosures | The live settings page explains the one-time direct browser request and no key persistence; `pages.js:770` supports this. The provider receives the key and connection information such as IP address. | Explain providers' roles and link applicable privacy information. Describe custom endpoints clearly. Before enabling server-side AI, assess source-text disclosure, recipients, retention, applicable processor terms and transfers. Arts. 5, 6, 13–14, 28 and Chapter V as applicable. |
| Low | Cookie choices do not match the minimal current feature set | Live `cookie-consent.js` includes an unused analytics category, while saying analytics is inactive; it does not explain the configured 180-day duration in its visible wording. | Describe the cookie name, purpose and duration. Simplify the unused choice. A cookie used solely to remember an explicitly requested preference can qualify for the applicable necessary-cookie exemption; optional tracking requires its own assessment. ePrivacy Directive Art. 5(3), applicable Belgian law; GDPR Arts. 4(11), 7 where consent is used. |

## Court-record safeguards that matter for this site

Court material is publicly accessible, but EU JUST separately selects, stores, republishes, categorises and potentially summarises it. Each of those operations needs to be assessed in context (Arts. 4–6). A person's initials or a case number can still relate to an identifiable individual; do not assume all such records are anonymous.

- Preserve source anonymisation and do not enrich initials into identities. Review whether every named individual and lawyer field is necessary for EU JUST's research purpose (Arts. 5(1)(c), 25).
- Explain the official sources and EU JUST's editorial purpose in the privacy notice. Assess notification under Art. 14 and document any exception and safeguards relied upon; linking to EUR-Lex is not by itself a blanket exemption.
- Keep pending allegations visibly separate from findings. The current pending-case wording already does this. Add an operational process to review corrections, later source anonymisation and changes in case status (Art. 5(1)(d)).
- Review retention and search-engine indexing of identifiable records, including records that cease to be accurate or necessary. Assess restriction, objection and erasure requests individually, including applicable freedom-of-expression/information exceptions (Arts. 17–18, 21, 85); do not promise universal deletion or universal refusal.
- An Art. 6 lawful basis alone is insufficient where identifiable special-category data is processed. Publication by a court is not automatically an act of making data manifestly public by the individual under Art. 9(2)(e).

## Organisational controls still to confirm

These are evidence gaps, not findings that msoit has no off-repository policies or contracts.

1. **Processing record:** record actual data categories, subjects, purposes, legal bases, recipients, locations, retention and controls. Assess Art. 30; a small organisation does not have an unconditional exemption, especially for regular processing or processing involving Art. 9/10 data.
2. **Rights handling:** nominate an inbox owner and backup, define response deadlines, and record how a change reaches generated HTML, JSON, databases, backups and future builds (Arts. 12–22).
3. **Incident handling:** document detection, containment, assessment and escalation. Art. 33 requires authority notification without undue delay and, where feasible, within 72 hours of awareness unless the breach is unlikely to risk individuals' rights and freedoms; Art. 34 concerns affected-person notification where high risk exists. Document personal-data breaches under Art. 33(5).
4. **Contracts and access:** confirm processor terms, authorised operator access, credential handling, backup protection and incident contacts (Arts. 28, 32).
5. **DPIA screening:** document whether the actual scale, sensitivity and proposed AI use are likely to create high risk (Art. 35). A DPIA is not automatically mandatory for every legal-research website.
6. **DPO assessment:** assess Art. 37 criteria against actual core activities and scale. A Belgian business does not automatically need a DPO simply because it operates a website; if one is required or appointed, publish the appropriate contact details.

## What is already supported by evidence

- Amsterdam application hosting has been configured and successfully deployed.
- No application analytics integration was found in the inspected public application code; the cookie text explicitly says analytics is inactive. This was not a full browser/network tracking audit.
- The live one-time API-key check goes directly to the selected endpoint and clears the field afterward. It omits cookies and referrer. No static-code key persistence was found. Clearing the field is not a guarantee of provider-side erasure or immediate browser-memory zeroisation.
- Official-source links use `rel="noreferrer"` in the inspected templates.
- Pending applications are labelled as allegations without findings. AI interpretation is described separately from official source material.
- No evidence was found of solely automated decisions about people with legal or similarly significant effects under Art. 22. Research summaries do not by themselves establish such processing.

## Recommended order

1. Complete and verify the static-serving fix and deploy it independently of unresolved legal wording.
2. Publish a privacy notice incorporating the supplied controller details and verified hosting facts. Resolve the court-data lawful-basis assessment and actual retention/transfer details before presenting unverified claims as settled facts.
3. Confirm Railway's DPA and underlying log-retention/subprocessor commitments. The remaining unanswered question is whether msoit has executed that agreement.
4. Establish the rights-request, source-correction, retention and incident procedures.
5. Simplify cookie information and assess additional disclosures/contracts before enabling server-side AI features.

## Sources and limits

Public pages checked on 29 October 2026: [home](https://www.eujust.online/), [settings](https://www.eujust.online/settings/index.html), [pending cases](https://www.eujust.online/pending/index.html), the two privacy paths, cookie configuration and non-sensitive server source. No secret files were requested, credentials submitted, AI jobs triggered or production settings changed during this review.

- [GDPR, Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng)
- [Belgian Data Protection Authority: actions and complaints](https://www.dataprotectionauthority.be/citizen/actions). The notice should explain the right to complain to a competent supervisory authority, including the Belgian APD/GBA, without implying Belgium is the only possible forum (Art. 77).
- [Railway log retention](https://docs.railway.com/observability/logs#log-retention)
- [Railway GDPR/DPA guidance](https://docs.railway.com/enterprise/compliance#gdpr-compliance---data-processing-agreement-dpa)
- [Railway DPA terms](https://railway.com/legal/dpa)

This is an evidence-based technical and privacy review, not legal certification. A qualified Belgian data-protection adviser should assess the court-record lawful basis, any special-category processing and applicable expression/information exceptions.
