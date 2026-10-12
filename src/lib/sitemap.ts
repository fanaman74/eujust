import { canonicalUrl } from './seo';

export const CASES_PER_SITEMAP = 1000;
export const xmlEscape = (value: string) => value.replace(/[<>&'"]/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[character]!));
export function dateIso(value: unknown) {
  if (!value || !(typeof value === 'string' || value instanceof Date)) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
export function sitemapXml(entries: { path: string; updated?: unknown }[]) {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map((entry) => `<url><loc>${xmlEscape(canonicalUrl(entry.path))}</loc>${dateIso(entry.updated) ? `<lastmod>${dateIso(entry.updated)}</lastmod>` : ''}</url>`).join('')}</urlset>`;
}
export const xmlResponse = (body: string) => new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'X-Robots-Tag': 'noindex' } });
export const sitemapUnavailable = () => new Response('Sitemap temporarily unavailable. Please retry.', { status: 503, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } });
