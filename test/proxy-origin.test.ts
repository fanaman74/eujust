import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequest } from 'astro/app/node';
import config from '../astro.config.mjs';
import { assertSameOrigin } from '../src/lib/security.ts';
import { POST } from '../src/pages/api/providers/[provider]/test.ts';

const site = new URL(config.site!);
function proxiedRequest(origin: string, forwardedHost = site.host, protocol = 'https') {
  // The edge terminates TLS; Node receives HTTP and an internal host.
  const incoming = {
    method: 'POST', url: '/api/providers/openrouter/test', body: '{}',
    headers: { host: 'railway.internal:8080', origin, 'content-type': 'application/json', 'x-forwarded-host': forwardedHost, 'x-forwarded-proto': protocol },
    socket: { remoteAddress: '127.0.0.1', on() {}, off() {} }
  };
  return createRequest(incoming as any, { allowedDomains: config.security!.allowedDomains });
}

test('HTTPS proxy reconstructs the configured public origin before provider checks', async () => {
  const request = proxiedRequest(site.origin);
  assert.equal(new URL(request.url).origin, site.origin);
  assert.doesNotThrow(() => assertSameOrigin(request));
  const previousEnv = process.env.NODE_ENV;
  const previousToken = process.env.ADMIN_TOKEN;
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.ADMIN_TOKEN;
    const response = await POST({ request, params: { provider: 'openrouter' } } as any);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'Admin authentication required' });
  } finally {
    if (previousEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousEnv;
    if (previousToken === undefined) delete process.env.ADMIN_TOKEN; else process.env.ADMIN_TOKEN = previousToken;
  }
});

test('proxy fix still rejects foreign origins, lookalike domains, ports and insecure schemes', () => {
  for (const origin of ['https://attacker.test', `${site.origin}.attacker.test`, `${site.origin}:8443`, site.origin.replace('https:', 'http:'), 'null']) {
    assert.throws(() => assertSameOrigin(proxiedRequest(origin)), /Cross-origin request rejected/);
  }
  const forged = proxiedRequest('https://attacker.test', 'attacker.test');
  assert.notEqual(new URL(forged.url).hostname, 'attacker.test');
  assert.throws(() => assertSameOrigin(forged), /Cross-origin request rejected/);
  const insecure = proxiedRequest(site.origin, site.host, 'http');
  assert.notEqual(new URL(insecure.url).origin, site.origin);
  assert.throws(() => assertSameOrigin(insecure), /Cross-origin request rejected/);
});

test('direct local requests keep the same-origin development behavior', () => {
  assert.doesNotThrow(() => assertSameOrigin(new Request('http://localhost:4321/api/providers/openrouter/test', { headers: { origin: 'http://localhost:4321' } })));
  assert.throws(() => assertSameOrigin(new Request('http://localhost:4321/api/providers/openrouter/test', { headers: { origin: site.origin } })), /Cross-origin request rejected/);
});
