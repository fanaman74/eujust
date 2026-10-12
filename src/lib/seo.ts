import { getSiteOrigin } from '../config/site.mjs';

export type StructuredData = Record<string, unknown>;
export type Breadcrumb = { name: string; path: string };

export function excerpt(value: string, length = 170) {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= length) return text;
  const shortened = text.slice(0, length - 1);
  const boundary = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, boundary > length * 0.65 ? boundary : shortened.length)}…`;
}

export function canonicalUrl(pathname: string, page = 1) {
  const url = new URL(getSiteOrigin());
  url.pathname = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  if (url.pathname === '/cases' && Number.isSafeInteger(page) && page > 1) url.searchParams.set('page', String(page));
  return url.href;
}

export function isPublicDeployment(url: URL, environment: Record<string, string | undefined> = process.env) {
  return environment.NODE_ENV === 'production' && url.hostname === new URL(getSiteOrigin(environment)).hostname;
}

export function isIndexable(url: URL, status: number, noindex = false, environment: Record<string, string | undefined> = process.env) {
  if (!isPublicDeployment(url, environment) || status !== 200 || noindex) return false;
  if (/^\/(?:api(?:\/|$)|monitoring(?:\/|$)|settings(?:\/|$))/.test(url.pathname)) return false;
  if (url.pathname.replace(/\/$/, '') === '/cases') {
    if (['q', 'topic', 'court'].some((key) => Boolean(url.searchParams.get(key)?.trim()))) return false;
    if (url.searchParams.get('sort') && url.searchParams.get('sort') !== 'judgment') return false;
    const page = url.searchParams.get('page');
    if (page && (!/^[1-9]\d*$/.test(page) || !Number.isSafeInteger(Number(page)))) return false;
  }
  return true;
}

export function jsonLd(value: unknown) {
  // Source titles are untrusted: a literal </script> must never break out of this element.
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function pageStructuredData(title: string, description: string, canonical: string, type: string, breadcrumbs: Breadcrumb[] = [], mainEntity?: StructuredData) {
  const origin = getSiteOrigin();
  const graph: StructuredData[] = [
    { '@type': 'Organization', '@id': `${origin}/#publisher`, name: 'EU JUST', url: `${origin}/`, logo: { '@type': 'ImageObject', url: `${origin}/favicon.svg` } },
    { '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: 'EU JUST', inLanguage: 'en', description: 'European workplace law, institutional rules and accountability records linked to official sources.', publisher: { '@id': `${origin}/#publisher` } },
    { '@type': type, '@id': `${canonical}#webpage`, url: canonical, name: title, description, inLanguage: 'en', isPartOf: { '@id': `${origin}/#website` }, publisher: { '@id': `${origin}/#publisher` }, ...(mainEntity ? { mainEntity } : {}) }
  ];
  if (breadcrumbs.length) graph.push({ '@type': 'BreadcrumbList', itemListElement: breadcrumbs.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: canonicalUrl(item.path) })) });
  return { '@context': 'https://schema.org', '@graph': graph };
}
