export type EurLexRecord = {
  celex: string;
  title: string;
  judgmentDate: string | null;
  work: string;
  language: string;
  officialUrl: string;
};

const endpoint = 'https://publications.europa.eu/webapi/rdf/sparql';
const query = `PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
SELECT DISTINCT ?work ?celex ?date ?title WHERE {
  ?work cdm:resource_legal_id_celex ?celex .
  FILTER(REGEX(STR(?celex), "^6[0-9]{4}(CJ|TJ|FJ|CO|TO|FO)[0-9]{4}$"))
  ?expression cdm:expression_belongs_to_work ?work ;
    cdm:expression_title ?title ;
    cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> .
  OPTIONAL { ?work cdm:work_date_document ?date }
  FILTER(
    CONTAINS(LCASE(STR(?title)), "harassment") ||
    CONTAINS(LCASE(STR(?title)), "bullying") ||
    CONTAINS(LCASE(STR(?title)), "mobbing") ||
    CONTAINS(LCASE(STR(?title)), "psychological") ||
    CONTAINS(LCASE(STR(?title)), "psychosocial") ||
    CONTAINS(LCASE(STR(?title)), "mental health") ||
    CONTAINS(LCASE(STR(?title)), "workplace") ||
    CONTAINS(LCASE(STR(?title)), "sexual harassment") ||
    CONTAINS(LCASE(STR(?title)), "retaliation") ||
    CONTAINS(LCASE(STR(?title)), "whistleblower") ||
    CONTAINS(LCASE(STR(?title)), "occupational stress") ||
    CONTAINS(LCASE(STR(?title)), "burnout")
  )
} ORDER BY DESC(?date) LIMIT 100`;

function value(row: Record<string, { value?: string }> | undefined, key: string) { return row?.[key]?.value ?? null; }

export async function fetchEurLexCases(fetchImpl: typeof fetch = fetch): Promise<EurLexRecord[]> {
  const url = `${endpoint}?query=${encodeURIComponent(query)}&format=application%2Fsparql-results%2Bjson`;
  const response = await fetchOfficial(url, { headers: { accept: 'application/sparql-results+json, application/json' } }, fetchImpl, 60_000);
  if (!response.ok) throw new Error(`EUR-Lex SPARQL returned HTTP ${response.status}`);
  assertOfficialUrl(response.url || url);
  const payload = await response.json() as { results?: { bindings?: Record<string, { value?: string }>[] } };
  if (!Array.isArray(payload.results?.bindings)) throw new Error('EUR-Lex SPARQL returned malformed JSON');
  const seen = new Set<string>();
  return payload.results.bindings.flatMap((row) => {
    const celex = value(row, 'celex');
    const title = value(row, 'title');
    const work = value(row, 'work');
    if (!celex || !title || !work || seen.has(celex)) return [];
    seen.add(celex);
    const dateValue = value(row, 'date');
    return [{ celex, title: decodeHtml(title).trim(), judgmentDate: dateValue && /^\d{4}-\d{2}-\d{2}/.test(dateValue) ? dateValue.slice(0, 10) : null, work, language: 'English source version', officialUrl: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${encodeURIComponent(celex)}` }];
  });
}

export async function fetchEurLexDocument(record: Pick<EurLexRecord, 'celex'>, fetchImpl: typeof fetch = fetch) {
  const urls = [
    `https://publications.europa.eu/resource/celex/${encodeURIComponent(record.celex)}?language=ENG`,
    `https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:${encodeURIComponent(record.celex)}`
  ];
  let lastError: Error | null = null;
  const errors: Error[] = [];
  for (const url of urls) {
    try {
      const response = await fetchOfficial(url, { headers: { accept: 'application/xhtml+xml, text/html', 'accept-language': 'en' } }, fetchImpl, 30_000);
      if (!response.ok) {
        lastError = new Error(`EUR-Lex document returned HTTP ${response.status}`);
        errors.push(lastError);
        continue;
      }
      assertOfficialUrl(response.url || url);
      const contentType = response.headers.get('content-type') ?? '';
      const html = await response.text();
      if (contentType && !/html|xhtml/i.test(contentType)) {
        lastError = new Error('EUR-Lex returned a non-HTML document body');
        errors.push(lastError);
        continue;
      }
      if (!/<(?:html|body)\b/i.test(html) || !/<p\b/i.test(html)) {
        lastError = new Error('EUR-Lex returned an unusable document body');
        errors.push(lastError);
        continue;
      }
      const contentHtml = html.replace(/<head[\s\S]*?<\/head>|<nav[\s\S]*?<\/nav>/gi, ' ');
      const text = htmlToText(contentHtml);
      const firstParagraph = text.search(/\[paragraph 1\]/i);
      const documentText = firstParagraph >= 0 ? text.slice(firstParagraph) : '';
      const englishWords = ['the', 'of', 'and', 'to', 'in', 'for', 'with', 'court', 'applicant', 'judgment', 'where', 'that', 'was', 'has', 'this', 'not'];
      const frenchWords = ['le', 'la', 'les', 'de', 'des', 'du', 'et', 'dans', 'que', 'qui', 'est', 'une', 'un', 'travail', 'notamment'];
      const countWords = (words: string[]) => words.reduce((count, word) => count + (documentText.match(new RegExp(`\\b${word}\\b`, 'gi'))?.length ?? 0), 0);
      const englishScore = countWords(englishWords);
      const frenchScore = countWords(frenchWords);
      const hasCourtHeading = /\b(?:JUDGMENT|ORDER|OPINION)\s+(?:OF\s+)?(?:THE\s+)?(?:COURT|GENERAL COURT|TRIBUNAL)\b/.test(text);
      const challengePrefix = text.slice(0, 500);
      if (!text || /just a moment|checking your browser|enable javascript|captcha|cf-chl-|access denied/i.test(challengePrefix) || documentText.length < 500 || !hasCourtHeading || englishScore < 5 || englishScore < frenchScore * 2) {
        lastError = new Error('EUR-Lex returned an unusable document body');
        errors.push(lastError);
        continue;
      }
      return { url, text: text.slice(0, 600_000), truncated: text.length > 600_000 };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      errors.push(lastError);
    }
  }
  if (errors.length > 1) throw new Error(`${errors[0].message}; alternate EUR-Lex manifestations failed: ${errors[errors.length - 1].message}`);
  throw lastError ?? new Error('EUR-Lex document could not be retrieved');
}

function assertOfficialUrl(value: string) {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:' || !['publications.europa.eu', 'eur-lex.europa.eu'].includes(parsed.hostname)) throw new Error('Official source returned an unexpected redirect target');
}

const sourceHosts = new Set(['publications.europa.eu', 'eur-lex.europa.eu']);
async function fetchOfficial(url: string, init: RequestInit, fetchImpl: typeof fetch, timeoutMs: number) {
  let current = url;
  for (let hop = 0; hop < 4; hop++) {
    const parsed = new URL(current);
    if (parsed.protocol !== 'https:' || !sourceHosts.has(parsed.hostname)) throw new Error('Official source redirect target rejected');
    const response = await fetchImpl(current, { ...init, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
    if (response.status < 300 || response.status >= 400) return response;
    const location = response.headers.get('location');
    if (!location) throw new Error('Official source returned a redirect without a location');
    const next = new URL(location, current);
    if (next.protocol === 'http:' && sourceHosts.has(next.hostname)) next.protocol = 'https:';
    current = next.toString();
  }
  throw new Error('Official source redirect limit exceeded');
}

function htmlToText(html: string) {
  return decodeHtml(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<p[^>]*class=["'][^"']*coj-count[^"']*["'][^>]*id=["']point(\d+)["'][^>]*>\s*\d+\s*<\/p>/gi, ' [paragraph $1] ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

export const eurLexQuery = query;
