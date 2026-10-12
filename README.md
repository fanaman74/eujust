# EU JUST

EU JUST is a source-first legal monitoring desk for European employment and workplace law. Phase 1 connects to the official EUR-Lex / Cellar SPARQL endpoint, imports genuine CJEU and General Court records, retrieves the official English source document, and stores source metadata separately from optional AI reports. The public interface uses a warm paper and deep navy visual system with a restrained gold signal, while official-source links and clear AI labels keep the product grounded in the record.

## Run locally

Requirements: Node 24+, npm 11+, and PostgreSQL 14+.

```powershell
Copy-Item .env.example .env
# Set DATABASE_URL and a 32-byte CREDENTIAL_ENCRYPTION_KEY in .env
npm install
npm run db:migrate
npm run dev
```

The default local binding is `127.0.0.1:4321`. In production set `NODE_ENV=production` and a long `ADMIN_TOKEN`; browser write routes then require the same-origin request plus `x-admin-token`. This phase is intended for a local or private deployment and does not provide an internet-facing identity system.

## Monitoring

Run a source check manually from the Monitoring page or with `npm run monitor`. Keep `npm run worker` running as a separate process for the daily schedule. The worker reads `schedule_preferences` from PostgreSQL in `Europe/Brussels` by default, catches up after downtime once per local day, and obtains a PostgreSQL advisory lock so manual and scheduled runs cannot overlap. Every source attempt is written to `monitoring_runs`; failures and partial document retrievals remain visible with sanitized source context, and the dashboard can expand saved CELEX-level failure details and official links. Failed or partial dashboard runs can be retried without replacing the original history row: a partial EUR-Lex run retries the saved failed documents, while a retry without historical failure details performs a source check; institution retries check only the selected source. Source locks reject overlapping retries with a conflict response. Retry actions return immediately and poll the run history; a running row may remain until the supervised web process finishes it. If a process stops mid-run, the next successful reservation of that source marks the orphaned row as an interrupted failure so it can be retried.

The Monitoring page accepts an optional operator token in memory for deployments whose proxy requires `x-admin-token`; it is not stored or placed in the URL. Production authentication and same-origin checks remain enforced by the application and its trusted proxy.

EUR-Lex and institution checks are independent: a failed court-source check does not skip the institution feeds. The one-shot `npm run monitor` command exits nonzero on a fatal source failure after attempting both groups. The deployed Railway monitor uses a daily cron at 04:30 UTC with this command; database schedule preferences apply to `npm run worker`, not the Railway cron.

Ombudsman searches cover the current and previous calendar year and follow the API's reported pagination. Commission Press searches follow its reported pagination too. Both connectors reject incomplete or repeated pages and cap each search at 100 pages. If pagination metadata is unavailable, coverage is limited to the first page. Commission Cellar discovery retains its two-year, 100-result window. Relevance is still determined by title keywords and the explicit OLAF report inclusion rule, rather than full-text classification.

The EUR-Lex query requests up to 100 recent English expression records per run, filters CELEX identifiers to genuine judgment/order patterns (`CJ`, `TJ`, `FJ`, `CO`, `TO`, `FO`), and uses a bounded English title vocabulary for the source request. The monitor then applies the enabled English topic terms stored in PostgreSQL for final inclusion and case-topic tagging. This is a bounded discovery window, not exhaustive coverage. The SPARQL `work_date_document` value is stored as judgment date. Publication date remains null until a source supplies publication metadata; it is never inferred from the judgment date. English is labelled `English source version` because the expression language is not proof of the original language. Document enrichment tries Cellar content negotiation, then the official EUR-Lex English HTML manifestation. It requires numbered paragraph content, a court heading and conservative English text checks. HTML shells and challenge pages are rejected. The general EUR-Lex TXT page is not used for enrichment because an English interface can display a non-English judgment body. English document text may remain unavailable even when metadata imports.

## AI providers

Open **Operations → AI settings** (`/settings`), choose OpenAI / ChatGPT, Anthropic Claude, DeepSeek or OpenRouter, enter the provider's API key, and select **Test connection**. Choose a reported model from **Available models** (or enter its identifier), then **Save provider**. A ChatGPT or Claude subscription is separate from API access; obtain an API key from the provider's developer console. When editing a saved provider, leave the key blank to retain its encrypted key. Saved rows offer Edit, Test connection, Enable/Disable and Remove.

In production, expand **Operator access** and enter the deployment's `ADMIN_TOKEN` before testing or saving, unless an authenticated trusted proxy supplies `x-admin-token`. The token stays only in the open page; production actions still require same-origin and admin checks. Keys are encrypted server-side with AES-256-GCM using `CREDENTIAL_ENCRYPTION_KEY`; responses expose `hasKey`, never the key. Leave the advanced endpoint blank for the official default; endpoints must use the provider's exact allowlisted HTTPS host.

An OpenRouter test validates the key, loads models, and separately requests its public `/providers` directory without sending the API key to that request. **Find a provider** searches that directory; provider names are informational, not model choices or routing controls. Choose a model from the model list; OpenRouter continues to handle routing, with provider availability varying by model. If the directory fails, a warning appears while the successful connection and models remain usable; test again to retry. No provider is required for source browsing.

Summary generation requires retrieved source text. The prompt treats that text as untrusted data, asks for a fixed JSON shape, accepts paragraph citations only when `[paragraph N]` markers exist in the retrieved XHTML, and marks truncated documents incomplete. Original source documents and AI reports use separate tables and are shown separately in case detail pages. Never treat generated interpretation as a court finding.

## Hosted database (Neon)

The deployed app uses a Neon Postgres database. `neon link` writes `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) into `.env`. `scripts/db-to-neon.ps1` copies a local database, named by `LOCAL_DATABASE_URL` in `.env`, into Neon; it needs the PostgreSQL client tools.

```powershell
./scripts/db-to-neon.ps1            # backup, restore, verify row counts
./scripts/db-to-neon.ps1 -DumpOnly  # backup only, written to .local/backups
```

The script refuses a non-empty target unless `-Force` is given and fails if any table's row count differs afterwards. The app connects with `DATABASE_URL_UNPOOLED` when it is set and falls back to `DATABASE_URL`; use the direct Neon string, because monitoring takes a session-level advisory lock that a transaction pooler does not preserve. The Railway web service needs that connection string as `DATABASE_URL`, plus `HOST=0.0.0.0` and `CREDENTIAL_ENCRYPTION_KEY`.

## Checks

```powershell
npm test
npm run check
npm run build
npm audit --omit=dev --audit-level=high
```

The tests cover credential round-tripping and redaction, malformed and valid source payload parsing, and schedule catch-up semantics. A real AI generation call requires a user-supplied key; it has not been claimed as tested without one.

## Current scope

Phase 1 covers EUR-Lex / Cellar, topic keyword matching in English with editable multilingual topic fields through the Topics API, dashboard search/filter/pagination, official source links, provider settings, monitoring history, configurable schedule preferences, source-grounded summary scaffolding, institution rules and updates, and a European Parliament budgetary discharge guide with official decision and follow-up links. National sources, HUDOC, OCR, semantic search, PDF export, saved searches, email notifications, and full multilingual expression retrieval remain planned extensions. Cases remain useful when AI is disabled because metadata and official links are independent of reports.

In production, keep the app behind a private reverse proxy or identity layer. The Monitoring page can send an operator token entered into its in-memory field; the usual deployment path is for a trusted proxy to inject `x-admin-token` after authenticating an operator. The app fails closed when `NODE_ENV=production` and that header is absent. Run the web server and `npm run worker` as separately supervised processes (for example, systemd, NSSM, or a container supervisor); the worker is not started by a browser request. `HOST`, `PORT`, `MONITOR_TIMEZONE`, `MONITOR_HOUR`, and `MONITOR_MINUTE` are environment defaults; persisted schedule preferences override the monitor time after migration.

## Search visibility

The canonical public address is `https://www.eujust.online`. Public pages include canonical URLs, sharing metadata and structured data; `/sitemap.xml` automatically lists landing pages and collected cases. The topic guides at `/topics` provide searchable entry points to the collection. Operators, internal search results, previews and error pages are excluded from indexing.

Use `NODE_ENV=production` on the published web service. The optional `SITE_URL` override must be an HTTPS origin. See [Search visibility](docs/search-visibility.md) for deployment checks and Google Search Console/Bing verification and sitemap submission.
