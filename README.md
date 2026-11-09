# EU JUST

EU JUST is a source-first research site for European workplace law: Court of Justice and General Court rulings on harassment, discrimination and staff cases, pending actions, institutional rules and budget discharge records. Every record links to its official EUR-Lex, Ombudsman or Commission source. The official document is always the authority.

## Layout

- `build.mjs` generates every public page as static HTML into the repository root, then assembles `.static-site/` for serving.
- `serve.js` serves `.static-site/` (GET and HEAD only, no fallback to the repository).
- `data/*.json` holds the collected records and the run log. `daily-check.mjs` refreshes them.
- `sources.mjs` holds the EUR-Lex / Cellar SPARQL queries shared by the daily check and `harvest-pending.mjs`.
- `styles.css`, `pages.css`, `privacy.css`, `main.js`, `pages.js`, `cookie-consent.js` are the front-end. Vendored libraries are in `assets/vendor/`, fonts in `assets/fonts/`.
- `content/privacy-policy.html` is the privacy policy source, rendered to `/privacy/`.
- `docs/` holds review notes, the privacy and search-visibility notes, and the redesign plan.
- `video/` is a separate Remotion project for the homepage map animation.

## Run locally

Requirements: Node 22 or newer (Node 24 is the target in Railway's configuration).

```sh
npm install
npm run build      # regenerate pages and .static-site/
npm start          # serve on 127.0.0.1:4173 (set HOST and PORT to change)
```

## Daily source check

`npm run daily-check` queries the Publications Office Cellar SPARQL endpoint for OJ C "case brought" notices and for new staff judgments and orders. It rewrites `data/pending.json` and `data/inbox.json`, appends the run to `data/monitoring.json`, then rebuilds. A pending list that shrinks by more than half is refused and the previous file is kept. `run-daily-check.cmd` and `register-daily-task.ps1` schedule it on Windows at 06:30 Europe/Brussels.

Because the check runs on a local machine, new records reach the live site only when the regenerated `data/` files are committed and pushed.

`npm run harvest` refreshes the pending-case list. `node harvest-pending.mjs --enrich` also pulls parties and pleas from each notice text.

## Deployment

Railway runs `npm run build` and then `npm start` (see `railway.json`). Nothing else is needed at runtime: no database, no secrets.

## Tests and checks

```sh
npm test
npm audit --omit=dev
```

The tests cover the static server's path and method rules and the static publication manifest.

## Search visibility and privacy

The canonical address is `https://www.eujust.online`. See [docs/search-visibility.md](docs/search-visibility.md) for sitemap and verification notes, and [docs/privacy-policy-notes.md](docs/privacy-policy-notes.md) for the open organisational items behind the privacy policy.

EU JUST is research support only, not legal advice.
