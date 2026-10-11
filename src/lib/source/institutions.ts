export type InstitutionUpdate = {
  institution: 'commission' | 'ombudsman';
  externalId: string;
  title: string;
  kind: string;
  reference: string | null;
  documentDate: string | null;
  officialUrl: string;
  matchedTerms: string[];
};

/** A document is kept only when its title contains one of these; the list is the whole inclusion rule. */
export const updateTerms = ['harassment', 'bullying', 'dignity at work', 'psychosocial', 'mental health', 'well-being', 'wellbeing', 'whistleblow', 'administrative inquir', 'disciplinary proceeding'];

/** The Commission publishes far more on these words in general policy (cyberbullying, health statistics), so its list is narrower. */
export const commissionTerms = ['harassment', 'psychosocial', 'dignity at work', 'mental health at work', 'whistleblow', 'administrative inquir', 'disciplinary proceeding', 'give effect to the staff regulations'];

/** Known oversight reports whose titles do not carry the ordinary staff-well-being keywords. */
export const commissionSpecialCelexes = ['52026DC0493'] as const;

export function matchTerms(title: string, terms = updateTerms) {
  const lower = title.toLocaleLowerCase('en');
  return terms.filter((term) => lower.includes(term));
}

const hosts = new Set(['www.ombudsman.europa.eu', 'publications.europa.eu', 'ec.europa.eu']);
async function fetchJson(url: string, fetchImpl: typeof fetch, timeoutMs = 45_000) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !hosts.has(parsed.hostname)) throw new Error('Official source URL rejected');
  const response = await fetchImpl(url, { headers: { accept: 'application/json, application/sparql-results+json', 'user-agent': 'eu-lex-discovery/0.1' }, redirect: 'error', signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`${parsed.hostname} returned HTTP ${response.status}`);
  return response.json() as Promise<any>;
}
const isoDay = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;
const clean = (value: string) => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

// ---------- European Ombudsman ----------

const ombudsmanKinds: Record<string, { label: string; path: string }> = {
  EODECISION: { label: 'Decision', path: 'decision' },
  EOOPENINGSUMMARY: { label: 'Inquiry opened', path: 'opening-summary' },
  EODRAFTRECOMMENDATION: { label: 'Recommendation', path: 'recommendation' },
  NEWSDOCUMENT: { label: 'News', path: 'news-document' },
  SPEECH: { label: 'Speech', path: 'speech' }
};
const ombudsmanSearches = ['harassment', 'dignity at work', 'psychosocial', 'whistleblower', 'OLAF investigation'];
const ombudsmanOlafContextTerms = ['staff', 'disciplin', 'employee', 'official', 'personnel', 'employment'];

function ombudsmanPageCount(payload: any, observedPageSize: number | null) {
  const pageItem = payload?.pageItem;
  if (!pageItem || typeof pageItem !== 'object') return null;
  const advertised = Number(pageItem.totalPages);
  if (Number.isSafeInteger(advertised) && advertised > 0) return advertised;
  const total = Number(pageItem.totalResult);
  return Number.isSafeInteger(total) && total >= 0 && observedPageSize ? Math.ceil(total / observedPageSize) : null;
}

function ombudsmanOfficialUrl(key: string, kind: { path: string }) {
  // Keep the stable short URL for the known OLAF follow-up decision.
  return key === '223656' ? 'https://www.ombudsman.europa.eu/decision/223656' : `https://www.ombudsman.europa.eu/en/${kind.path}/en/${key}`;
}

export async function fetchOmbudsmanUpdates(fetchImpl: typeof fetch = fetch, now = new Date()): Promise<InstitutionUpdate[]> {
  const years = [now.getUTCFullYear(), now.getUTCFullYear() - 1];
  const found = new Map<string, InstitutionUpdate>();
  for (const year of years) for (const search of ombudsmanSearches) {
    const seenPageSignatures = new Set<string>();
    let observedPageSize: number | null = null;
    let rawCount = 0;
    let expectedTotal: number | null = null;
    let completed = false;
    for (let page = 1; page <= 100; page++) {
      const url = `https://www.ombudsman.europa.eu/rest/documents?searchText=${encodeURIComponent(search)}&keyword=&onlyTitle=false&year=${year}&topic=&format=&page=${page}&lang=en`;
      const payload = await fetchJson(url, fetchImpl);
      if (!Array.isArray(payload?.documents)) throw new Error('Ombudsman search returned malformed JSON');
      const actualPage = Number(payload?.pageItem?.actualPage);
      if (Number.isSafeInteger(actualPage) && actualPage !== page) throw new Error('Ombudsman search returned an unexpected page');
      rawCount += payload.documents.length;
      const totalResult = Number(payload?.pageItem?.totalResult);
      if (Number.isSafeInteger(totalResult) && totalResult >= 0) expectedTotal = totalResult;
      for (const doc of payload.documents) {
        const key = Number(doc?.techKey);
        const title = typeof doc?.docVersionContent?.title === 'string' ? clean(doc.docVersionContent.title) : '';
        if (!Number.isSafeInteger(key) || !title) continue;
        const matchedTerms = matchTerms(title);
        const lowerTitle = title.toLocaleLowerCase('en');
        const caseRef = typeof doc.caseRef === 'string' ? doc.caseRef.trim().toLocaleUpperCase('en') : '';
        const knownOlafCase = String(key) === '223656' || caseRef === '132/2025/ACB';
        const contextualOlafTitle = lowerTitle.includes('olaf') && ombudsmanOlafContextTerms.some((term) => lowerTitle.includes(term));
        if (matchedTerms.length === 0 && !knownOlafCase && !contextualOlafTitle) continue;
        const kind = ombudsmanKinds[String(doc.documentClass)] ?? { label: 'Document', path: 'document' };
        found.set(String(key), { institution: 'ombudsman', externalId: String(key), title, kind: kind.label, reference: typeof doc.caseRef === 'string' ? `Case ${doc.caseRef}` : null, documentDate: isoDay(doc.documentDate), officialUrl: ombudsmanOfficialUrl(String(key), kind), matchedTerms: matchedTerms.length ? matchedTerms : ['OLAF oversight'] });
      }
      const pageSignature = payload.documents.map((doc: any) => String(doc?.techKey ?? '')).join('|');
      if (observedPageSize === null && payload.documents.length > 0) observedPageSize = payload.documents.length;
      const pages = ombudsmanPageCount(payload, observedPageSize);
      if (seenPageSignatures.has(pageSignature)) {
        if ((pages !== null && page <= pages) || (expectedTotal !== null && rawCount < expectedTotal)) throw new Error('Ombudsman search returned a repeated page before completion');
        completed = true;
        break;
      }
      seenPageSignatures.add(pageSignature);
      if (payload.documents.length === 0) {
        if (expectedTotal !== null && rawCount < expectedTotal) throw new Error('Ombudsman search ended before its reported result count');
        completed = true;
        break;
      }
      // The API's pageItem is authoritative; without it, retain the old bounded first-page behaviour.
      if (pages === null || page >= pages) {
        if (expectedTotal !== null && rawCount < expectedTotal) throw new Error('Ombudsman search ended before its reported result count');
        completed = true;
        break;
      }
    }
    if (!completed) throw new Error('Ombudsman search exceeded the pagination limit');
  }
  return [...found.values()];
}

// ---------- European Commission: documents published in EUR-Lex ----------

export const commissionCellarQuery = (since: string) => `PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
SELECT DISTINCT ?celex ?date ?title WHERE {
  ?work cdm:work_created_by_agent <http://publications.europa.eu/resource/authority/corporate-body/COM> ;
    cdm:work_date_document ?date ;
    cdm:resource_legal_id_celex ?celex .
  FILTER(?date >= "${since}"^^xsd:date)
  ?expression cdm:expression_belongs_to_work ?work ;
    cdm:expression_uses_language <http://publications.europa.eu/resource/authority/language/ENG> ;
    cdm:expression_title ?title .
  FILTER(REGEX(STR(?title), "${[...commissionTerms, 'give effect to the Staff Regulations'].join('|')}", "i") || STR(?celex) IN (${commissionSpecialCelexes.map((celex) => `"${celex}"`).join(', ')}))
} ORDER BY DESC(?date) LIMIT 100`;

const celexKinds: [RegExp, string][] = [[/^5\d{4}DC/, 'Communication or report'], [/^5\d{4}PC/, 'Legislative proposal'], [/^5\d{4}SC/, 'Staff working document'], [/^3\d{4}D/, 'Decision'], [/^3\d{4}R/, 'Regulation'], [/^3\d{4}H/, 'Recommendation']];

export async function fetchCommissionDocuments(fetchImpl: typeof fetch = fetch, now = new Date()): Promise<InstitutionUpdate[]> {
  const since = new Date(Date.UTC(now.getUTCFullYear() - 2, now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10);
  const payload = await fetchJson(`https://publications.europa.eu/webapi/rdf/sparql?query=${encodeURIComponent(commissionCellarQuery(since))}&format=application%2Fsparql-results%2Bjson`, fetchImpl, 90_000);
  if (!Array.isArray(payload?.results?.bindings)) throw new Error('Cellar returned malformed JSON');
  const found = new Map<string, InstitutionUpdate>();
  for (const row of payload.results.bindings) {
    const celex = row?.celex?.value;
    const title = typeof row?.title?.value === 'string' ? clean(row.title.value) : '';
    // Only real CELEX numbers get a stable EUR-Lex address; drafts and Official Journal notice ids are skipped.
    if (typeof celex !== 'string' || !/^[1-9]\d{4}[A-Z]{1,2}\d{4}$/.test(celex) || !title) continue;
    const matchedTerms = matchTerms(title, commissionTerms);
    const specialCase = commissionSpecialCelexes.includes(celex as (typeof commissionSpecialCelexes)[number]);
    if (matchedTerms.length === 0 && !specialCase) continue;
    found.set(celex, { institution: 'commission', externalId: celex, title, kind: celexKinds.find(([pattern]) => pattern.test(celex))?.[1] ?? 'Document', reference: `CELEX ${celex}`, documentDate: isoDay(row?.date?.value), officialUrl: `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${celex}`, matchedTerms: matchedTerms.length ? matchedTerms : ['OLAF oversight'] });
  }
  return [...found.values()];
}

// ---------- European Commission: Press Corner ----------

const pressSearches = ['harassment', 'psychosocial', 'whistleblower'];

export async function fetchCommissionPress(fetchImpl: typeof fetch = fetch): Promise<InstitutionUpdate[]> {
  const found = new Map<string, InstitutionUpdate>();
  for (const search of pressSearches) {
    const seenPageSignatures = new Set<string>();
    let rawCount = 0;
    let expectedTotal: number | null = null;
    let completed = false;
    for (let page = 1; page <= 100; page++) {
      const payload = await fetchJson(`https://ec.europa.eu/commission/presscorner/api/search?text=${encodeURIComponent(search)}&language=en&pagesize=25&pagenumber=${page}`, fetchImpl);
      if (!Array.isArray(payload?.docuLanguageListResources)) throw new Error('Press Corner returned malformed JSON');
      const actualPage = Number(payload.pageNumber);
      if (Number.isSafeInteger(actualPage) && actualPage !== page - 1) throw new Error('Press Corner search returned an unexpected page');
      rawCount += payload.docuLanguageListResources.length;
      for (const item of payload.docuLanguageListResources) {
        const ref = item?.refCode;
        const title = typeof item?.title === 'string' ? clean(item.title) : '';
        if (typeof ref !== 'string' || !/^[A-Z]+\/\d{2}\/\d+$/.test(ref) || !title) continue;
        const matchedTerms = matchTerms(title, commissionTerms);
        if (matchedTerms.length === 0) continue;
        found.set(ref, { institution: 'commission', externalId: ref, title, kind: typeof item?.docutype?.description === 'string' ? item.docutype.description : 'Press material', reference: ref, documentDate: isoDay(item.eventDate), officialUrl: `https://ec.europa.eu/commission/presscorner/detail/en/${ref.toLowerCase().replaceAll('/', '_')}`, matchedTerms });
      }
      const total = Number(payload.totalNumber);
      const pageSize = Number(payload.pageSize);
      if (Number.isSafeInteger(total) && total >= 0) expectedTotal = total;
      const pages = Number.isSafeInteger(total) && total >= 0 && Number.isSafeInteger(pageSize) && pageSize > 0 ? Math.ceil(total / pageSize) : null;
      const pageSignature = payload.docuLanguageListResources.map((item: any) => String(item?.refCode ?? '')).join('|');
      if (seenPageSignatures.has(pageSignature)) {
        if ((pages !== null && page <= pages) || (expectedTotal !== null && rawCount < expectedTotal)) throw new Error('Press Corner search returned a repeated page before completion');
        completed = true;
        break;
      }
      seenPageSignatures.add(pageSignature);
      if (payload.docuLanguageListResources.length === 0) {
        if (expectedTotal !== null && rawCount < expectedTotal) throw new Error('Press Corner search ended before its reported result count');
        completed = true;
        break;
      }
      // The API's totalNumber/pageSize are authoritative; without them, retain the old bounded first-page behaviour.
      if (pages === null || page >= pages) {
        if (expectedTotal !== null && rawCount < expectedTotal) throw new Error('Press Corner search ended before its reported result count');
        completed = true;
        break;
      }
    }
    if (!completed) throw new Error('Press Corner search exceeded the pagination limit');
  }
  return [...found.values()];
}
