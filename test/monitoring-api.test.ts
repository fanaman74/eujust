import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../src/pages/api/monitor/retry.ts';
import { runMonitoringWithInstitutions } from '../src/pages/api/monitor.ts';

const context = (request: Request) => ({ request }) as any;

test('retry endpoint keeps production authentication and same-origin checks', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const unauthenticated = await POST(context(new Request('https://example.test/api/monitor/retry', { method: 'POST', body: JSON.stringify({ runId: 1 }), headers: { 'content-type': 'application/json' } })));
    assert.equal(unauthenticated.status, 401);
    const crossOrigin = await POST(context(new Request('https://example.test/api/monitor/retry', { method: 'POST', body: JSON.stringify({ runId: 1 }), headers: { 'content-type': 'application/json', 'x-admin-token': 'secret', origin: 'https://attacker.test' } })));
    assert.equal(crossOrigin.status, 403);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});

test('retry endpoint rejects non-safe identifiers before database access', async () => {
  const response = await POST(context(new Request('https://example.test/api/monitor/retry', { method: 'POST', body: JSON.stringify({ runId: true }), headers: { 'content-type': 'application/json' } })));
  assert.equal(response.status, 400);
});

test('monitor API runs institution sources after a fatal EUR-Lex result', async () => {
  const calls: string[] = [];
  const result = await runMonitoringWithInstitutions(
    async () => { calls.push('cases'); throw new Error('EUR-Lex failed'); },
    async () => { calls.push('institutions'); return []; }
  );
  assert.deepEqual(calls, ['cases', 'institutions']);
  assert.equal(result.cases, null);
  assert.equal((result.casesError as Error).message, 'EUR-Lex failed');
  assert.deepEqual(result.institutions, []);
});
