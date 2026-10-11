import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';

type Run = { id: number; source_id: number; status: string; source_key: string; source_name: string; source_enabled: boolean; details: Record<string, unknown>; discovered_count: number; imported_count: number; failure_count: number; error_message: string | null };

const sources = [
  { id: 1, key: 'eurlex-sparql', name: 'EUR-Lex / Cellar SPARQL', enabled: true },
  { id: 2, key: 'commission-press', name: 'Commission Press Corner', enabled: true }
];
const runs: Run[] = [
  { id: 7, source_id: 1, source_key: 'eurlex-sparql', source_name: sources[0].name, source_enabled: true, status: 'partial', details: { failures: [{ celex: '62024TJ0145', kind: 'document', error: 'EUR-Lex document [http_404]: unavailable' }] }, discovered_count: 1, imported_count: 0, failure_count: 1, error_message: null },
  { id: 8, source_id: 2, source_key: 'commission-press', source_name: sources[1].name, source_enabled: true, status: 'partial', details: { failures: [{ kind: 'source', error: 'timeout' }] }, discovered_count: 0, imported_count: 0, failure_count: 1, error_message: 'timeout' }
];
const cases = new Map([['62024TJ0145', { id: 10, celex: '62024TJ0145', title: 'Stored case', judgment_date: '2026-01-02', language: 'English source version', official_url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62024TJ0145', work: 'urn:work' }]]);
const documents = new Map<string, { text_content: string | null; metadata: Record<string, unknown> }>([['62024TJ0145', { text_content: 'old text', metadata: { work: 'urn:work', truncated: true } }]]);
let nextRun = 20;
let lockAvailable = true;
let fetches: string[] = [];

function result<T extends Record<string, unknown>>(rows: T[] = []) { return { rows, rowCount: rows.length }; }

class FakeClient {
  async query(text: string, values: unknown[] = []) {
    if (/pg_try_advisory_lock/.test(text)) return result([{ locked: lockAvailable }]);
    if (/pg_advisory_unlock/.test(text)) return result([{ pg_advisory_unlock: true }]);
    if (text === 'BEGIN' || text === 'COMMIT' || text === 'ROLLBACK') return result();
    if (/INSERT INTO courts/.test(text)) return result([{ id: 1 }]);
    if (/SELECT id FROM cases WHERE celex/.test(text)) return result(cases.has(String(values[0])) ? [{ id: cases.get(String(values[0]))!.id }] : []);
    if (/INSERT INTO cases/.test(text)) {
      const celex = String(values[0]);
      const existing = cases.get(celex);
      if (existing) return result([{ id: existing.id }]);
      const row = { id: 30, celex, title: String(values[2]), judgment_date: values[4] as string, language: String(values[5]), official_url: '', work: '' };
      cases.set(celex, row); return result([{ id: row.id }]);
    }
    if (/INSERT INTO documents/.test(text)) {
      const previous = documents.get(String(values[2]));
      documents.set(String(values[2]), { text_content: values[4] as string | null ?? previous?.text_content ?? null, metadata: { ...previous?.metadata, ...JSON.parse(String(values[5])) } });
      return result();
    }
    if (/INSERT INTO institution_updates/.test(text)) return result([{ created: true }]);
    if (/SELECT id, terms_en FROM topics/.test(text)) return result();
    throw new Error(`Unhandled fake client query: ${text}`);
  }
  release(_error?: unknown) { /* fixture */ }
}

class FakePool {
  async connect() { return new FakeClient(); }
  async query(text: string, values: unknown[] = []) {
    if (/SELECT id, key, name, enabled FROM sources/.test(text)) return result(sources.filter((source) => source.key === values[0]));
    if (/SELECT mr.id,mr.status,s.key source_key/.test(text)) {
      const run = runs.find((item) => item.id === Number(values[0]));
      return result(run ? [{ id: run.id, status: run.status, source_key: run.source_key, source_enabled: run.source_enabled, details: run.details }] : []);
    }
    if (/SELECT c.celex,c.title/.test(text)) {
      const wanted = new Set((values[1] as string[]).map(String));
      return result([...cases.values()].filter((row) => wanted.has(row.celex)).map((row) => ({ ...row, official_url: row.official_url, work: row.work })));
    }
    if (/INSERT INTO institution_updates/.test(text)) return result([{ created: true }]);
    if (/INSERT INTO monitoring_runs/.test(text)) {
      const source = sources.find((item) => item.id === Number(values[0]))!;
      const row: Run = { id: nextRun++, source_id: source.id, source_key: source.key, source_name: source.name, source_enabled: source.enabled, status: 'running', details: JSON.parse(String(values[1])), discovered_count: 0, imported_count: 0, failure_count: 0, error_message: null };
      runs.unshift(row); return result([{ id: row.id }]);
    }
    if (/UPDATE monitoring_runs SET finished_at/.test(text) && /WHERE source_id/.test(text)) {
      for (const run of runs.filter((item) => item.source_id === Number(values[2]) && item.status === 'running')) { run.status = 'failed'; run.failure_count = 1; run.error_message = String(values[0]); run.details = { ...run.details, ...JSON.parse(String(values[1])) }; }
      return result();
    }
    if (/UPDATE monitoring_runs SET finished_at/.test(text) && /status = 'success'/.test(text)) {
      const run = runs.find((item) => item.id === Number(values[3]))!;
      run.status = 'success'; run.discovered_count = Number(values[0]); run.imported_count = Number(values[1]); run.failure_count = 0; run.details = { ...run.details, ...JSON.parse(String(values[2])) }; return result();
    }
    if (/UPDATE monitoring_runs SET finished_at/.test(text)) {
      const id = Number(values[values.length - 1]);
      const run = runs.find((item) => item.id === id)!;
      if (/status = 'failed'/.test(text)) { run.status = 'failed'; run.failure_count = Number(values[0]) || 1; run.error_message = String(values[1]); run.details = { ...run.details, ...JSON.parse(String(values[2])) }; }
      else { run.status = String(values[0]); run.discovered_count = Number(values[1]); run.imported_count = Number(values[2]); run.failure_count = Number(values[3]); run.details = { ...run.details, ...JSON.parse(String(values[4])) }; }
      return result();
    }
    if (/UPDATE sources SET/.test(text) || /UPDATE monitoring_runs SET finished_at = NOW\(\), status = 'failed'/.test(text)) return result();
    if (/SELECT mr.id,mr.source_id/.test(text)) {
      const run = runs.find((item) => item.id === Number(values[0]));
      return result(run ? [run] : []);
    }
    throw new Error(`Unhandled fake pool query: ${text}`);
  }
}

test('retry POST reserves a new run, targets only the stored failed CELEX, and preserves the original row', async () => {
  (pg as unknown as { Pool: typeof FakePool }).Pool = FakePool;
  process.env.NODE_ENV = 'development';
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => { fetches.push(url); return new Response('<html><body>new source text</body></html>', { status: 200, headers: { 'content-type': 'text/html' } }); }) as typeof fetch;
  try {
    const { POST } = await import('../src/pages/api/monitor/retry.ts');
    const response = await POST({ request: new Request('https://fixture.test/api/monitor/retry', { method: 'POST', body: JSON.stringify({ runId: 7 }), headers: { 'content-type': 'application/json' } }) } as any);
    assert.equal(response.status, 202, await response.clone().text());
    const body = await response.json();
    assert.equal(body.scope, 'failed-records');
    await new Promise((resolve) => setTimeout(resolve, 30));
    const original = runs.find((run) => run.id === 7)!;
    const retry = runs.find((run) => run.id === body.runId)!;
    assert.equal(original.status, 'partial');
    assert.equal(retry.status, 'success');
    assert.equal(retry.details.retryOf, 7);
    assert.equal(fetches.length, 1);
    assert.match(fetches[0], /62024TJ0145/);
    assert.equal(documents.get('62024TJ0145')?.text_content, 'new source text');
    documents.set('62024TJ0145', { text_content: 'preserve this text', metadata: { work: 'urn:work', truncated: true } });
    globalThis.fetch = (async () => { throw new Error('EUR-Lex document returned HTTP 500'); }) as typeof fetch;
    const failedRetry = await POST({ request: new Request('https://fixture.test/api/monitor/retry', { method: 'POST', body: JSON.stringify({ runId: 7 }), headers: { 'content-type': 'application/json' } }) } as any);
    assert.equal(failedRetry.status, 202);
    const failedBody = await failedRetry.json();
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(runs.find((run) => run.id === failedBody.runId)?.status, 'partial');
    assert.equal(documents.get('62024TJ0145')?.text_content, 'preserve this text');
    assert.equal(documents.get('62024TJ0145')?.metadata.truncated, true);
    lockAvailable = false;
    const conflict = await POST({ request: new Request('https://fixture.test/api/monitor/retry', { method: 'POST', body: JSON.stringify({ runId: 7 }), headers: { 'content-type': 'application/json' } }) } as any);
    assert.equal(conflict.status, 409);
    lockAvailable = true;
    globalThis.fetch = (async () => new Response(JSON.stringify({ docuLanguageListResources: [{ refCode: 'IP/26/1', title: 'Commission update on harassment', docutype: { description: 'Press release' }, eventDate: '2026-10-01' }] }), { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch;
    const institutionRetry = await POST({ request: new Request('https://fixture.test/api/monitor/retry', { method: 'POST', body: JSON.stringify({ runId: 8 }), headers: { 'content-type': 'application/json' } }) } as any);
    assert.equal(institutionRetry.status, 202);
    const institutionBody = await institutionRetry.json();
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(runs.find((run) => run.id === institutionBody.runId)?.status, 'success', JSON.stringify(runs.find((run) => run.id === institutionBody.runId)));
    assert.equal(runs.find((run) => run.id === 7)?.status, 'partial');
  } finally {
    globalThis.fetch = originalFetch;
    lockAvailable = true;
  }
});
