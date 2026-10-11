import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptSecret, decryptSecret, redactError } from '../src/lib/security.ts';
import { fetchEurLexCases, fetchEurLexDocument } from '../src/lib/source/eurlex.ts';
import { shouldRunSchedule } from '../src/lib/schedule.ts';
import { parseReport, buildChatRequest } from '../src/lib/ai.ts';
import { commissionCellarQuery, fetchCommissionDocuments, fetchCommissionPress, fetchOmbudsmanUpdates } from '../src/lib/source/institutions.ts';
import { selectedDecisions } from '../src/data/rules.ts';

test('encrypted credentials round-trip and errors redact full secrets', () => {
  process.env.CREDENTIAL_ENCRYPTION_KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
  const encrypted = encryptSecret('sk-live-secret-value');
  assert.equal(decryptSecret(encrypted), 'sk-live-secret-value');
  assert.ok(!encrypted.includes('sk-live-secret-value'));
  assert.ok(!redactError(new Error('authorization: Bearer sk-live-secret-value')).includes('sk-live-secret-value'));
});

test('source parser rejects malformed JSON and maps official records', async () => {
  const badFetch = async () => new Response('{not-json', { status: 200 });
  await assert.rejects(() => fetchEurLexCases(badFetch as typeof fetch));
  const goodFetch = async () => new Response(JSON.stringify({ results: { bindings: [{ celex: { value: '62023CJ0343' }, title: { value: 'Colombani v EEAS' }, work: { value: 'urn:work' }, date: { value: '2026-04-16' } }] } }), { status: 200 });
  const [record] = await fetchEurLexCases(goodFetch as typeof fetch);
  assert.equal(record.celex, '62023CJ0343');
  assert.equal(record.judgmentDate, '2026-04-16');
  assert.equal(record.language, 'English source version');
});

test('official Cellar redirects are upgraded to HTTPS and bounded', async () => {
  const requested: string[] = [];
  const redirectFetch = async (url: string) => { requested.push(url); return requested.length === 1 ? new Response('', { status: 302, headers: { location: 'http://publications.europa.eu/resource/cellar/document' } }) : new Response(`<html><body><p class="coj-count" id="point1">1</p><p>JUDGMENT OF THE COURT ${'The court considered the applicant and the relevant facts. '.repeat(20)}</p></body></html>`, { status: 200, headers: { 'content-type': 'application/xhtml+xml' } }); };
  const result = await fetchEurLexDocument({ celex: '62023CJ0343' }, redirectFetch as typeof fetch);
  assert.match(requested[1], /^https:\/\/publications\.europa\.eu/);
  assert.match(result.text, /\[paragraph 1\]/);
});

test('EUR-Lex document retrieval falls back from missing or challenge HTML', async () => {
  const requested: string[] = [];
  const fetchImpl = async (url: string) => {
    requested.push(url);
    if (url.includes('publications.europa.eu')) return new Response('', { status: 404 });
    return new Response(`<html><body><p class="coj-count" id="point1">1</p><p>JUDGMENT OF THE COURT ${'The court considered the applicant and the relevant facts. '.repeat(20)}</p></body></html>`, { status: 200, headers: { 'content-type': 'text/html' } });
  };
  const result = await fetchEurLexDocument({ celex: '62023CJ0343' }, fetchImpl as typeof fetch);
  assert.equal(requested.length, 2);
  assert.match(result.url, /legal-content\/EN\/TXT\/HTML\/\?uri=CELEX/);
  assert.match(result.text, /The court considered/);
});

test('EUR-Lex rejects a navigation shell that contains legal-looking words', async () => {
  const requested: string[] = [];
  const fetchImpl = async (url: string) => {
    requested.push(url);
    if (url.includes('publications.europa.eu')) return new Response('', { status: 500 });
    return new Response(`<html><body><p>JUDGMENT OF THE COURT ${'navigation '.repeat(100)}</p></body></html>`, { status: 200, headers: { 'content-type': 'text/html' } });
  };
  await assert.rejects(() => fetchEurLexDocument({ celex: '62022TJ0789' }, fetchImpl as typeof fetch), /unusable document body/);
  assert.equal(requested.length, 2);
});

test('EUR-Lex rejects an English metadata shell around a French court body', async () => {
  const fetchImpl = async (url: string) => {
    if (url.includes('publications.europa.eu')) return new Response('', { status: 404 });
    return new Response(`<html><body><p>JUDGMENT OF THE GENERAL COURT - English metadata title</p><p class="coj-count" id="point1">1</p><p>JUGEMENT DU TRIBUNAL ${'notamment douté du travail dans le cadre de la procédure, la décision et les parties. '.repeat(20)}</p></body></html>`, { status: 200, headers: { 'content-type': 'text/html' } });
  };
  await assert.rejects(() => fetchEurLexDocument({ celex: '62022TJ0789' }, fetchImpl as typeof fetch), /unusable document body/);
});

test('EUR-Lex preserves a primary retrieval error when every fallback fails', async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls++;
    if (calls === 1) throw new Error('primary timeout');
    return new Response('', { status: 404 });
  };
  await assert.rejects(() => fetchEurLexDocument({ celex: '62022TJ0371' }, fetchImpl as typeof fetch), /primary timeout/);
});

test('OLAF oversight records are included narrowly and unrelated titles stay out', async () => {
  assert.match(commissionCellarQuery('2026-01-01'), /52026DC0493/);
  const commissionFetch = async () => new Response(JSON.stringify({ results: { bindings: [
    { celex: { value: '52026DC0493' }, title: { value: 'Report from the Commission on the evaluation of Regulation 883/2013 concerning investigations conducted by OLAF' }, date: { value: '2026-09-18' } },
    { celex: { value: '52026DC0999' }, title: { value: 'OLAF annual report on procurement statistics' }, date: { value: '2026-09-17' } },
    { celex: { value: '52026DC0998' }, title: { value: 'Rules that give effect to the Staff Regulations' }, date: { value: '2026-09-16' } }
  ] } }), { status: 200 });
  const commissionRecords = await fetchCommissionDocuments(commissionFetch as typeof fetch, new Date('2026-10-03T00:00:00Z'));
  const [commissionRecord] = commissionRecords;
  assert.equal(commissionRecord.externalId, '52026DC0493');
  assert.deepEqual(commissionRecord.matchedTerms, ['OLAF oversight']);
  assert.match(commissionRecord.officialUrl, /CELEX:52026DC0493$/);
  assert.deepEqual(commissionRecords.find((record) => record.externalId === '52026DC0998')?.matchedTerms, ['give effect to the staff regulations']);

  const ombudsmanFetch = async () => new Response(JSON.stringify({ documents: [
    { techKey: 223656, documentClass: 'EODECISION', caseRef: '132/2025/ACB', documentDate: '2026-09-18', docVersionContent: { title: 'Decision on the European Commission’s refusal to give public access to documents concerning the follow-up to an OLAF investigation (case 132/2025/ACB)' } },
    { techKey: 223658, documentClass: 'EODECISION', caseRef: '134/2025/ACB', documentDate: '2026-09-18', docVersionContent: { title: 'Decision on disciplinary follow-up to an OLAF investigation concerning a Commission staff member' } },
    { techKey: 223657, documentClass: 'EODECISION', caseRef: '133/2025/ACB', documentDate: '2026-09-18', docVersionContent: { title: 'Decision on an OLAF investigation into procurement fraud' } }
  ] }), { status: 200 });
  const ombudsmanRecords = await fetchOmbudsmanUpdates(ombudsmanFetch as typeof fetch, new Date('2026-10-03T00:00:00Z'));
  assert.deepEqual(ombudsmanRecords.map((record) => record.externalId), ['223656', '223658']);
  assert.equal(ombudsmanRecords[0].officialUrl, 'https://www.ombudsman.europa.eu/decision/223656');
  assert.deepEqual(ombudsmanRecords[0].matchedTerms, ['OLAF oversight']);
  assert.deepEqual(ombudsmanRecords[1].matchedTerms, ['OLAF oversight']);

  assert.equal(selectedDecisions.length, 4);
  assert.deepEqual(selectedDecisions.map((item) => item.reference), ['CELEX 62024CJ0075', 'CELEX 62025TJ0006', 'Case 132/2025/ACB', 'CELEX 52026DC0493']);
  assert.deepEqual(selectedDecisions.map((item) => item.url), [
    'https://eur-lex.europa.eu/legal-content/EN/CASE/?uri=CELEX%3A62024CJ0075',
    'https://eur-lex.europa.eu/legal-content/EN/CASE/?uri=CELEX%3A62025TJ0006',
    'https://www.ombudsman.europa.eu/decision/223656',
    'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A52026DC0493'
  ]);
});

test('Ombudsman searches continue across result pages', async () => {
  const requestedPages: string[] = [];
  const ombudsmanFetch = async (url: string) => {
    const page = new URL(url).searchParams.get('page') ?? '';
    requestedPages.push(page);
    const documents = page === '1'
      ? [{ techKey: 990001, documentClass: 'EODECISION', documentDate: '2026-09-18', docVersionContent: { title: 'Decision on harassment at work' } }]
      : page === '2'
        ? [{ techKey: 990002, documentClass: 'EODECISION', documentDate: '2026-09-17', docVersionContent: { title: 'Decision on bullying at work' } }]
        : [];
    return new Response(JSON.stringify({ pageItem: { totalResult: 2, totalPages: 2 }, documents }), { status: 200 });
  };
  const records = await fetchOmbudsmanUpdates(ombudsmanFetch as typeof fetch, new Date('2026-10-03T00:00:00Z'));
  assert.deepEqual(records.map((record) => record.externalId), ['990001', '990002']);
  assert.ok(requestedPages.includes('2'));
});

test('Commission Press searches continue across result pages', async () => {
  const requestedPages: string[] = [];
  const pressFetch = async (url: string) => {
    const page = new URL(url).searchParams.get('pagenumber') ?? '';
    requestedPages.push(page);
    const resources = page === '1'
      ? [{ refCode: 'IP/26/1', title: 'Commission update on harassment', docutype: { description: 'Press release' }, eventDate: '2026-09-18' }]
      : page === '2'
        ? [{ refCode: 'IP/26/2', title: 'Commission update on psychosocial risks', docutype: { description: 'Press release' }, eventDate: '2026-09-17' }]
        : [];
    return new Response(JSON.stringify({ totalNumber: 2, pageSize: 1, pageNumber: Number(page) - 1, docuLanguageListResources: resources }), { status: 200 });
  };
  const records = await fetchCommissionPress(pressFetch as typeof fetch);
  assert.deepEqual(records.map((record) => record.externalId), ['IP/26/1', 'IP/26/2']);
  assert.ok(requestedPages.includes('2'));
});

test('empty paginated institution responses are accepted when totals are zero', async () => {
  const pressFetch = async () => new Response(JSON.stringify({ totalNumber: 0, pageSize: 25, pageNumber: 0, docuLanguageListResources: [] }), { status: 200 });
  assert.deepEqual(await fetchCommissionPress(pressFetch as typeof fetch), []);
});

test('institution pagination rejects incomplete, repeated, and misreported pages', async () => {
  const ombudsmanIncomplete = async (url: string) => {
    const page = new URL(url).searchParams.get('page');
    return new Response(JSON.stringify({ pageItem: { totalResult: 2, totalPages: 2, actualPage: Number(page) }, documents: page === '1' ? [{ techKey: 991001, documentClass: 'EODECISION', docVersionContent: { title: 'Decision on harassment at work' } }] : [] }), { status: 200 });
  };
  await assert.rejects(() => fetchOmbudsmanUpdates(ombudsmanIncomplete as typeof fetch, new Date('2026-10-03T00:00:00Z')), /ended before its reported result count/);

  const ombudsmanWrongPage = async () => new Response(JSON.stringify({ pageItem: { totalResult: 1, totalPages: 1, actualPage: 2 }, documents: [] }), { status: 200 });
  await assert.rejects(() => fetchOmbudsmanUpdates(ombudsmanWrongPage as typeof fetch, new Date('2026-10-03T00:00:00Z')), /unexpected page/);

  const pressRepeated = async (url: string) => {
    const page = Number(new URL(url).searchParams.get('pagenumber'));
    return new Response(JSON.stringify({ totalNumber: 2, pageSize: 1, pageNumber: page - 1, docuLanguageListResources: [{ refCode: 'IP/26/9', title: 'Commission update on harassment', eventDate: '2026-09-18' }] }), { status: 200 });
  };
  await assert.rejects(() => fetchCommissionPress(pressRepeated as typeof fetch), /repeated page before completion/);
});

test('schedule catches up once per local day after configured time', () => {
  assert.equal(shouldRunSchedule({ day: '2026-10-02', hour: 7, minute: 0 }, { hour: 6, minute: 30 }, null), true);
  assert.equal(shouldRunSchedule({ day: '2026-10-02', hour: 7, minute: 0 }, { hour: 6, minute: 30 }, '2026-10-02'), false);
  assert.equal(shouldRunSchedule({ day: '2026-10-02', hour: 6, minute: 0 }, { hour: 6, minute: 30 }, null), false);
});

test('AI report parser rejects invalid shape, marks invented citations incomplete, and provider payloads use safe roles/tokens', () => {
  const valid = JSON.stringify({ summary: 'supported', establishedFacts: ['fact'], legalQuestions: ['question'], outcome: 'outcome', relevance: 'relevance', citations: ['[paragraph 1]'], incomplete: false });
  assert.deepEqual(parseReport(valid, 'Source [paragraph 1]'), { summary: 'supported', establishedFacts: ['fact'], legalQuestions: ['question'], outcome: 'outcome', relevance: 'relevance', citations: ['[paragraph 1]'], incomplete: false });
  const invented = parseReport(valid, 'Source without that marker');
  assert.equal(invented.incomplete, true);
  assert.deepEqual(invented.citations, []);
  assert.throws(() => parseReport(JSON.stringify({ summary: 'bad' }), 'Source'));
  const openai = buildChatRequest('openai', 'https://api.openai.com/v1', 'secret', 'o4-mini', 'prompt');
  assert.match(openai.init.body as string, /max_completion_tokens/);
  assert.match(openai.init.body as string, /"role":"system"/);
  const deepseek = buildChatRequest('deepseek', 'https://api.deepseek.com/v1', 'secret', 'deepseek-chat', 'prompt');
  assert.match(deepseek.init.body as string, /max_tokens/);
  const anthropic = buildChatRequest('anthropic', 'https://api.anthropic.com/v1', 'secret', 'claude', 'prompt');
  assert.match(anthropic.init.body as string, /"system"/);
  assert.equal((anthropic.init.headers as Record<string, string>)['anthropic-version'], '2023-06-01');
});
