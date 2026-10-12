import { query } from './db';
import { canonicalUrl } from './seo';
import { parseTitle } from './title';
import { xmlEscape } from './sitemap';

export interface TopicFeedItem {
  key: string;
  title: string;
  href: string;
  source: string;
  date: string | null;
  addedAt: string;
  dateLabel: string;
  categories: string[];
}

interface FeedRow {
  id: string;
  kind: 'case' | 'update';
  title: string;
  source: string;
  source_date: string | null;
  discovered_at: string;
  official_url: string | null;
  categories: string[];
}

export async function getTopicFeed(limit = 20): Promise<TopicFeedItem[]> {
  const { rows } = await query<FeedRow>(`SELECT * FROM (
    SELECT c.id, 'case' kind, c.title, COALESCE(co.name, 'Court ruling') source,
      c.judgment_date::text source_date, c.discovered_at, NULL::text official_url,
      ARRAY(SELECT t.name_en FROM case_topics ct JOIN topics t ON t.id=ct.topic_id
        WHERE ct.case_id=c.id AND t.enabled ORDER BY t.name_en) categories
    FROM cases c LEFT JOIN courts co ON co.id=c.court_id
    WHERE EXISTS (SELECT 1 FROM case_topics ct JOIN topics t ON t.id=ct.topic_id WHERE ct.case_id=c.id AND t.enabled)
    UNION ALL
    SELECT u.id, 'update' kind, u.title,
      CASE u.institution WHEN 'commission' THEN 'European Commission' ELSE 'European Ombudsman' END source,
      u.document_date::text source_date, u.discovered_at, u.official_url, u.matched_terms categories
    FROM institution_updates u WHERE cardinality(u.matched_terms)>0
  ) records ORDER BY source_date DESC NULLS LAST, discovered_at DESC, kind, id DESC LIMIT $1`, [limit]);
  return rows.map((row) => ({
    key: `${row.kind}-${row.id}`,
    title: row.kind === 'case' ? parseTitle(row.title).heading : row.title,
    href: row.kind === 'case' ? `/cases/${row.id}` : safeOfficialUrl(row.official_url),
    source: row.source,
    date: row.source_date,
    addedAt: new Date(row.discovered_at).toISOString(),
    dateLabel: row.kind === 'case' ? 'Judgment' : 'Document',
    categories: row.categories
  }));
}

function safeOfficialUrl(value: string | null) {
  try {
    const url = new URL(value ?? '');
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.href;
  } catch { /* Keep malformed source links out of the public feed. */ }
  return '/rules';
}

// XML 1.0 forbids control characters and unpaired UTF-16 surrogates.
const escape = (value: string) => xmlEscape(value.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, ''));

export function topicFeedXml(items: TopicFeedItem[]) {
  const absolute = (href: string) => {
    const safe = href.startsWith('/') ? href : safeOfficialUrl(href);
    return safe.startsWith('/') ? canonicalUrl(safe) : safe;
  };
  const timestamps = items.map((item) => Date.parse(item.addedAt)).filter(Number.isFinite);
  const updated = timestamps.length ? `<lastBuildDate>${new Date(Math.max(...timestamps)).toUTCString()}</lastBuildDate>` : '';
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>EU JUST — Latest topic updates</title><link>${escape(canonicalUrl('/'))}</link>
<description>Recent court rulings and institutional records from bounded, keyword-based workplace-topic searches. Newest source dates first; coverage is not exhaustive.</description>
<language>en-gb</language><atom:link href="${escape(canonicalUrl('/rss.xml'))}" rel="self" type="application/rss+xml"/>${updated}
${items.map((item) => {
    const description = `${item.source}. ${item.dateLabel} date: ${item.date ?? 'not recorded'}. Keyword matches: ${item.categories.join(', ')}. Verify against the official source; topic matches are not legal findings.`;
    const timestamp = Date.parse(item.addedAt);
    return `<item><title>${escape(item.title)}</title><link>${escape(absolute(item.href))}</link><guid isPermaLink="false">${escape(`${canonicalUrl('/')}#${item.key}`)}</guid><description>${escape(description)}</description>${Number.isFinite(timestamp) ? `<pubDate>${new Date(timestamp).toUTCString()}</pubDate>` : ''}${item.categories.map((category) => `<category>${escape(category)}</category>`).join('')}</item>`;
  }).join('')}
</channel></rss>`;
}
