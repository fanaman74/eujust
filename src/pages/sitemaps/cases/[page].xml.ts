import type { APIRoute } from 'astro';
import { query } from '../../../lib/db';
import { CASES_PER_SITEMAP, sitemapXml, xmlResponse, sitemapUnavailable } from '../../../lib/sitemap';

export const GET: APIRoute = async ({ params }) => {
  const page = Number(params.page);
  if (!/^[1-9]\d*$/.test(params.page ?? '') || !Number.isSafeInteger(page) || !Number.isSafeInteger((page - 1) * CASES_PER_SITEMAP)) return new Response('Not found', { status: 404 });
  try {
    const cases = (await query<{ id: string; updated_at: Date }>('SELECT id,updated_at FROM cases ORDER BY id LIMIT $1 OFFSET $2', [CASES_PER_SITEMAP, (page - 1) * CASES_PER_SITEMAP])).rows;
    if (!cases.length) return new Response('Not found', { status: 404 });
    return xmlResponse(sitemapXml(cases.map((item) => ({ path: `/cases/${item.id}`, updated: item.updated_at }))));
  } catch { return sitemapUnavailable(); }
};
