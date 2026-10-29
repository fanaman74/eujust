import test from 'node:test';
import assert from 'node:assert/strict';
import { redactProviderError, testProviderConnection } from '../src/lib/ai.ts';

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });

test('unsaved provider credentials test without a database write and deduplicate model ids', async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetcher: Fetcher = async (input, init) => { calls.push({ url: String(input), init }); return json({ data: [{ id: 'model-a' }, { id: 'model-a' }, { id: 'model-b' }] }); };
  const result = await testProviderConnection('openai', { apiKey: 'user-key-123', baseUrl: 'https://api.openai.com/v1' }, fetcher);
  assert.deepEqual(result.models, ['model-a', 'model-b']);
  assert.equal(calls.length, 1);
  assert.equal((calls[0].init?.headers as Record<string, string>).authorization, 'Bearer user-key-123');
});

test('empty input uses the saved key and endpoint from saved configuration', async () => {
  const loader = async () => ({ baseUrl: 'https://api.openai.com/v1', model: 'saved-model', apiKey: 'saved-key' });
  const fetcher: Fetcher = async (_input, init) => { assert.equal((init?.headers as Record<string, string>).authorization, 'Bearer saved-key'); return json({ data: [{ id: 'saved-model' }] }); };
  const result = await testProviderConnection('openai', undefined, fetcher, async (provider) => { assert.equal(provider, 'openai'); return loader(); });
  assert.deepEqual(result.models, ['saved-model']);
});

test('provider-specific endpoint hosts reject before any credential fetch', async () => {
  let calls = 0;
  const fetcher: Fetcher = async () => { calls += 1; return json({ data: [] }); };
  await assert.rejects(testProviderConnection('openai', { apiKey: 'secret-key', baseUrl: 'https://api.deepseek.com/v1' }, fetcher), /exact allowlisted HTTPS provider host/);
  assert.equal(calls, 0);
});

test('OpenRouter validates the key before reading its public catalog', async () => {
  const calls: string[] = [];
  const fetcher: Fetcher = async (input) => { calls.push(String(input)); return json({ error: 'invalid key' }, 401); };
  await assert.rejects(testProviderConnection('openrouter', { apiKey: 'arbitrary-key' }, fetcher), /key validation failed with HTTP 401/);
  assert.deepEqual(calls, ['https://openrouter.ai/api/v1/key']);
});

test('Anthropic model pagination follows cursors and guards duplicate model ids', async () => {
  const calls: string[] = [];
  const fetcher: Fetcher = async (input) => {
    const url = String(input); calls.push(url);
    return url.includes('after_id=cursor-1') ? json({ data: [{ id: 'claude-b' }, { id: 'claude-a' }], has_more: false, last_id: 'cursor-2' }) : json({ data: [{ id: 'claude-a' }], has_more: true, last_id: 'cursor-1' });
  };
  const result = await testProviderConnection('anthropic', { apiKey: 'anthropic-key' }, fetcher);
  assert.deepEqual(result.models, ['claude-a', 'claude-b']);
  assert.equal(calls.length, 2);
  assert.match(calls[1], /after_id=cursor-1/);
  const repeated: Fetcher = async () => json({ data: [{ id: 'claude-a' }], has_more: true, last_id: 'same-cursor' });
  await assert.rejects(testProviderConnection('anthropic', { apiKey: 'anthropic-key' }, repeated), /invalid model pagination cursor/);
});

test('malformed catalogs fail clearly while valid empty catalogs remain usable', async () => {
  const malformed: Fetcher = async () => json({ data: [{ name: 'missing id' }] });
  await assert.rejects(testProviderConnection('deepseek', { apiKey: 'deepseek-key' }, malformed), /malformed model catalog/);
  const empty: Fetcher = async () => json({ data: [] });
  const result = await testProviderConnection('deepseek', { apiKey: 'deepseek-key' }, empty);
  assert.deepEqual(result.models, []);
});

test('provider errors redact the complete submitted credential', () => {
  const key = 'custom-provider-key-with-sensitive-tail';
  const message = redactProviderError(new Error(`request failed for ${key}`), [key]);
  assert.equal(message.includes(key), false);
  assert.match(message, /\[redacted\]/);
});

test('provider fetch failures redact the submitted key before returning an API error', async () => {
  const key = 'provider-key-with-a-sensitive-tail';
  const fetcher: Fetcher = async () => { throw new Error(`upstream rejected ${key}`); };
  await assert.rejects(testProviderConnection('deepseek', { apiKey: key }, fetcher), (error: unknown) => {
    assert.equal(String(error).includes(key), false);
    return true;
  });
});

test('provider fetch failures redact the saved credential too', async () => {
  const key = 'saved-provider-key-with-sensitive-tail';
  const fetcher: Fetcher = async () => { throw new Error(`upstream rejected ${key}`); };
  await assert.rejects(testProviderConnection('openai', undefined, fetcher, async () => ({ baseUrl: 'https://api.openai.com/v1', model: 'saved-model', apiKey: key })), (error: unknown) => {
    assert.equal(String(error).includes(key), false);
    return true;
  });
});

test('retired provider settings cannot accept credentials or contact a provider', async () => {
  const routes = await Promise.all([
    import('../src/pages/api/providers.ts'),
    import('../src/pages/api/providers/[provider]/index.ts'),
    import('../src/pages/api/providers/[provider]/test.ts'),
    import('../src/pages/api/providers/[provider]/models.ts')
  ]);
  for (const route of routes) {
    for (const method of ['GET', 'POST', 'DELETE']) {
      const request = new Request('https://app.test/api/providers/openai', { method, ...(method === 'POST' ? { body: JSON.stringify({ apiKey: 'do-not-store-or-forward' }) } : {}) });
      const response = await route.ALL({ request, params: { provider: 'openai' } } as any);
      assert.equal(response.status, 410);
      assert.deepEqual(await response.json(), { error: 'AI provider settings have been removed.' });
    }
  }
});

test('OpenRouter returns routing providers separately from models without leaking credentials to the directory', async () => {
  const calls: string[] = [];
  const fetcher: Fetcher = async (input, init) => {
    const url = String(input); calls.push(url);
    if (url.endsWith('/key')) return json({ data: { label: 'valid test key' } });
    if (url.endsWith('/models')) return json({ data: [{ id: 'anthropic/claude-test' }] });
    assert.equal(new Headers(init?.headers).has('authorization'), false);
    assert.equal(init?.redirect, 'error');
    return json({ data: [{ name: 'Together', slug: 'together' }, { name: 'Anthropic', slug: 'anthropic' }, { name: 'Together', slug: 'together' }] });
  };
  const result = await testProviderConnection('openrouter', { apiKey: 'private-test-key' }, fetcher);
  assert.deepEqual(result.models, ['anthropic/claude-test']);
  assert.deepEqual(result.providers, [{ name: 'Anthropic', slug: 'anthropic' }, { name: 'Together', slug: 'together' }]);
  assert.deepEqual(calls, ['https://openrouter.ai/api/v1/key', 'https://openrouter.ai/api/v1/models', 'https://openrouter.ai/api/v1/providers']);
});

test('OpenRouter directory errors keep a verified connection and models usable with a retry message', async () => {
  for (const directory of [json({}, 503), json({ data: [{ name: 'Invalid' }] })]) {
    const fetcher: Fetcher = async (input) => String(input).endsWith('/providers') ? directory : json({ data: [{ id: 'model-test' }] });
    const result = await testProviderConnection('openrouter', { apiKey: 'test-key' }, fetcher);
    assert.equal(result.ok, true);
    assert.deepEqual(result.models, ['model-test']);
    assert.deepEqual(result.providers, []);
    assert.match(result.catalogWarning ?? '', /test again to retry/);
  }
});

test('subscription handoff distinguishes metadata from evidence and flags incomplete source text', async () => {
  const { buildResearchPrompt } = await import('../src/lib/research-prompt.ts');
  const metadata = { title: 'QA record title', reference: 'QA-1', celex: 'QA-CELEX', officialUrl: 'https://eur-lex.europa.eu/example' };
  const referenceOnly = buildResearchPrompt(metadata);
  assert.match(referenceOnly, /Only metadata and links are supplied, not the judgment text/);
  assert.match(referenceOnly, /ask me to paste it before analysing/);
  const full = buildResearchPrompt({ ...metadata, text: '[paragraph 1] Actual source text.' });
  assert.match(full, /\[paragraph 1\] Actual source text\./);
  assert.doesNotMatch(full, /OFFICIAL SOURCE TEXT \(incomplete\)/);
  const truncated = buildResearchPrompt({ ...metadata, text: 'a'.repeat(120_001) });
  assert.match(truncated, /OFFICIAL SOURCE TEXT \(incomplete\)/);
  assert.match(truncated, /do not claim to summarise the full judgment/);
  assert.equal(truncated.includes('a'.repeat(120_001)), false);
  assert.match(buildResearchPrompt({ ...metadata, text: 'Partial source', truncated: true }), /OFFICIAL SOURCE TEXT \(incomplete\)/);
});
