# Privacy-policy implementation notes

Added 29 October 2026. The shared policy source is `src/content/privacy-policy.html`; the static build creates `/privacy/index.html`, and Astro exposes `/privacy`. Both site footers link to it. AI settings and API-key entry have since been removed. The static sitemap includes the page. Cookie information identifies the 180-day preference cookie; no inactive analytics choice or automatic consent prompt is offered.

The policy uses the owner's supplied identity (msoit, Belgium, hello@msoit.eu), confirmed Amsterdam deployment and owner-confirmed Railway Hobby plan. It distinguishes the seven-day log-history window from underlying erasure and describes external services without offering provider configuration. Retired provider endpoints return 410 and do not read or forward submitted keys.

Before treating the page as a completed compliance programme, msoit should:

- Confirm its full legal identity if msoit is a trading name.
- Confirm execution of Railway's DPA, actual subprocessor/access locations and applicable transfer safeguards. The public text links provider terms without claiming the agreement has been executed or that all processing remains in the EEA.
- Obtain Railway's actual underlying log-retention commitment. The documentation explicitly says plan upgrades can restore older logs.
- Review and document the proposed legitimate-interests bases, particularly necessity and balancing for searchable court-record republication. Determine Art. 14 notification handling; no blanket exception is asserted in the policy.
- Assess any identifiable special-category information before further reuse or AI disclosure. The policy does not invent an Art. 9 condition.
- Assign the privacy inbox and implement the stated rights-response, correction and retention practices. The published text creates expectations that operational handling must meet.
- Review actual AI-provider terms before enabling server-side source-text sharing and maintain a separate assessment of reports and backups.

The page is a privacy disclosure, not evidence that the above contracts, assessments and procedures have been completed. No production deployment is implied by creating the source files.

## Maintenance and verification

Edit the shared HTML source and `src/styles/privacy.css`, then regenerate the static output; do not edit the generated policy page or root `privacy.css` independently. The static page uses the existing paper/ink palette, self-hosted Archivo typography and shared header/footer. Its scoped stylesheet adds reading layout and focus treatment without defining a new visual identity. The Astro route inherits its own existing layout. `PRODUCT.md` and `DESIGN.md` describe that separate Astro variant and were left unchanged for this addition.

Implementation verification recorded for this addition: desktop review and mobile browser checks passed, 51 tests passed, and the static build produced 98 pages after removal of AI settings. The full existing project typecheck still reports 957 errors; no diagnostics were reported in the new privacy Astro page, server/publication helper or tests. These results do not establish production deployment or legal compliance. `docs/privacy-review.md` records the earlier assessment before this addition; its missing-notice finding describes that inspected state.

Railway standard DPA terms and signing instructions have now been reviewed; see `docs/railway-processor-assessment.md`. Agreement execution, the actual subprocessor list and the applicable transfer assessment remain pending evidence.
