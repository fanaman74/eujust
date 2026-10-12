---
version: 2
slug: "src-pages-settings-astro"
primary_target: "src/pages/settings.astro"
related_targets: ["src/scripts/providers.ts","src/lib/ai.ts","src/pages/api/providers.ts","src/pages/api/providers/[provider]/test.ts","src/styles/global.css"]
---

# AI provider settings

Mode: Operate. The owner connects an optional API provider, checks access, chooses a model and saves the configuration for source-grounded summaries. Court metadata and official links remain usable without AI.

PINNED DIRECTION: the owner supplied Brainfish's Platform card. Use a white connection form and pale connection-details column within one dark-bordered card, a dark offset shadow, Fraunces heading, lime Test connection action and purple line icons. Preserve the existing cream/pale-green operational shell, Geist interface text, focus treatment and local navigation. This is a scoped expression of DESIGN.md, not a broad brand change. The card has a 16px radius, a 6px dark offset and two columns that stack below 850px; form precedes connection details on mobile.

FIRST VIEWPORT: AI settings title and source-summary explanation, Source monitoring / AI providers navigation, closed page guidance and Operator access disclosures, then “Connect your AI.” with provider, API key and model fields. The adjacent “Your connection” column explains encrypted storage, test-before-save and source-first interpretation. Saved providers follow the card. Keep advanced endpoints behind a disclosure and catalogue controls hidden until populated.

TASK CONTRACT: select OpenAI / ChatGPT, Anthropic Claude, DeepSeek or OpenRouter; enter its API key; Test connection; choose a reported model or type an identifier; Save provider. ChatGPT and Claude subscriptions are distinct from API access. Saved-provider editing restores its model and endpoint; a blank key retains its encrypted key. Edit, test, enable/disable and confirmed removal stay available on saved rows.

OPENROUTER: testing validates the key through `/key`, loads `/models`, then requests the public `/providers` directory without credentials on that directory request. “Available models” selects the model; “Find a provider” filters names/slugs in a separately labelled directory with count and no-match feedback. Directory entries are informational, not routing controls. Availability varies by model and OpenRouter handles routing. If the directory request fails, the successful connection and model catalogue remain usable with a retry warning.

STATES: initial guidance; checking access/catalogue; connection verified with model list; valid connection with empty model list and manual entry; directory unavailable warning; provider-search no match; validation failure with field focus; invalid key, authentication or network failure with a retry path; saving with the form disabled; successful save clears the key and reloads; failed save leaves editable fields. Saved rows show Enabled/Disabled, chosen model and encrypted-key presence; empty and database-error states make no success claim. Status text is announced without colour alone.

RESPONSE RACES: changing provider, key, endpoint or operator token aborts the current test and increments a generation counter so late results cannot repopulate stale catalogues. Provider changes clear the entered key and discovery data and restore that provider's saved model/endpoint. Starting another test clears the previous catalogue; saving cancels any active test and disables the form. A cancelled saved-row test receives explicit cancellation feedback. Tests display reported catalogue data, not hard-coded model names.

PROTECTION: production tests and writes require same-origin/admin checks. Operator access accepts the deployment token in memory while this page is open; authentication failures during testing open that disclosure. Secrets remain encrypted server-side with AES-256-GCM and are never returned; only `hasKey` is exposed. Endpoints use exact allowlisted HTTPS provider hosts, redirects are rejected, and test errors redact supplied credentials. Discovery adds no new provider credentials or routing settings. Keyboard navigation, visible focus, password fields and reduced-motion-aware edit scrolling retain the incumbent accessibility behaviour.

VERIFICATION: reviewer disposition **ship**, with no material fixes. Checked `.impeccable/review/providers/{desktop,mobile,desktop-connected,mobile-connected}.png` and `/tmp/eujust-provider/browser-report.json` against the page, script, API and AI library. Browser evidence covers searchable providers, selectable models, provider switching, saved-model restoration, production authentication, saving to the isolated QA database, retry after invalid credentials and discarding a late response. Desktop/mobile report no horizontal overflow, accessibility violations or page errors. Provider responses, keys and models in this evidence are fixtures; no real provider credential or live generation was used. The task's test/check/build run passed 42 tests, Astro check and production build.
