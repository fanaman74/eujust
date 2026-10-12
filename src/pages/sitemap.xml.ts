import type { APIRoute } from 'astro';
import { query } from '../lib/db';
import { canonicalUrl } from '../lib/seo';
import { CASES_PER_SITEMAP, xmlEscape, xmlResponse, sitemapUnavailable } from '../lib/sitemap';

export const GET: APIRoute = async () => {
  try {
    const count = Number((await query<{ count: string }>('SELECT count(*) count FROM cases')).rows[0].count);
    const paths = ['/sitemaps/pages.xml', ...Array.from({ length: Math.ceil(count / CASES_PER_SITEMAP) }, (_, index) => `/sitemaps/cases/${index + 1}.xml`)];
    return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<sitemap><loc>${xmlEscape(canonicalUrl(path))}</loc></sitemap>`).join('')}</sitemapindex>`);
  } catch { return sitemapUnavailable(); }
};
