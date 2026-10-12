# Search visibility for EU JUST

Canonical public address: **https://www.eujust.online**.

## Implemented

- Unique page titles and descriptions describe EU employment law, workplace rights and the actual research collections. Case titles include the case reference and parties; descriptions use source metadata rather than AI-generated interpretation.
- Canonical links consolidate tracking parameters and duplicate views. The unfiltered collection's numbered pages have their own canonical URLs so older records remain discoverable. Search, topic-filter, court-filter and alternate-sort results are `noindex, follow`; the clean topic landing pages are the searchable entry points.
- `/topics` and three linked topic guides cover workplace harassment, employment discrimination and psychosocial risks. Each explains the collection's limits, links recent keyword-matched records and leads to the full filtered archive. The home topic links and footer make these pages discoverable without JavaScript.
- Website/publisher/page JSON-LD describes EU JUST and its content. Case records add identifiers, official-source citations and actual recorded publication/update dates. A missing publication date is never substituted with a judgment date. Case and topic pages have breadcrumb data that matches visible navigation.
- Open Graph and Twitter card metadata, a branded 1200 × 630 share image and an SVG favicon support consistent search/sharing presentation.
- `/robots.txt` announces `/sitemap.xml` and permits crawling the public site. Sitemap responses have no `noindex` header, so Google can fetch and revisit them. The sitemap index links nine public landing pages and case-record batches of up to 1,000 URLs. Case `lastmod` values come from `cases.updated_at`; no artificial build-date freshness signals are added.
- Monitoring and AI settings return `noindex` in both HTML and response headers. They remain crawlable so engines can see that exclusion. API paths are disallowed in robots and return indexing-exclusion headers. These are search controls, not authentication controls.
- Development/preview hosts are `noindex` and receive blocking robots rules. Production indexing requires `NODE_ENV=production` and the canonical host. Requests reaching the app on `eujust.online` permanently redirect to `www.eujust.online` with their path/query preserved.
- Missing cases/topics and empty out-of-range archive/sitemap pages return 404. Database failures return retryable 503 responses instead of indexable error pages. XML sitemaps recover automatically when the database recovers.

## Deployment settings

The canonical domain defaults to `https://www.eujust.online`; no new secret is needed. An optional `SITE_URL` override must be an HTTPS origin with no credentials, path, query or fragment. It affects Astro's site configuration, canonical URLs, structured data and sitemap output.

Keep the existing production configuration, including `NODE_ENV=production`. Bind `www.eujust.online` to the Railway web service with valid HTTPS. If the bare domain is also used, bind it to the service or configure an equivalent permanent redirect at the domain/hosting layer. The application can only redirect requests that reach it.

After deployment, check:

```bash
curl -fsS https://www.eujust.online/robots.txt
curl -fsS https://www.eujust.online/sitemap.xml
curl -fsS https://www.eujust.online/sitemaps/pages.xml
curl -I https://www.eujust.online/monitoring
```

Robots should allow `/` and advertise the canonical sitemap. The home page's robots meta should begin `index, follow`. Monitoring/settings should have `X-Robots-Tag: noindex, nofollow`. Sitemap links must use `https://www.eujust.online`, and the listed case-sitemap files must return XML successfully.

## Google and Bing discovery

1. Open [Google Search Console](https://search.google.com/search-console) in the owner's account. Add a Domain property for `eujust.online`, and verify ownership using the DNS TXT record Google supplies. Alternatively, verify the `https://www.eujust.online/` URL-prefix property using a supported ownership method. Do not invent a verification token.
2. In **Sitemaps**, submit `https://www.eujust.online/sitemap.xml`. Its child sitemaps refresh from the database, so future imported records do not require another code deployment.
3. Use **URL inspection** to check the home page, each topic guide and a representative existing case. Confirm the canonical address, that indexing is allowed, and that the live page can be fetched. Request indexing for the principal new pages.
4. Add the site in [Bing Webmaster Tools](https://www.bing.com/webmasters), or import the verified Search Console property, then submit the same sitemap.
5. Review indexing and search-query reports as crawls arrive. Use the actual queries to improve the guides and editorial explanations while retaining official source links, accurate scope and clear AI labels.

Search Console/Bing account verification and sitemap submission are owner actions; repository changes alone do not perform them. Avoid blocking public research behind operator authentication, adding keyword lists without useful content, or describing bounded keyword discovery as exhaustive legal coverage.

## Validation

The repository test suite includes regression coverage for indexing rules, canonical handling, JSON-LD script-injection prevention, XML escaping and real timestamp handling. Production-server checks exercise public/filtered/private pages, pagination, redirects, sitemap batching, unknown records and unavailable-database responses. Browser checks cover the new topic pages at desktop and mobile widths, their archive links, accessibility rules and source-title escaping.
