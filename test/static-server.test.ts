import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, mkdir, writeFile, symlink, rm, readFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createStaticServer } from '../serve.js';
import { assembleStaticSite } from '../scripts/static-output.mjs';

test('published server keeps private files and symlink targets inaccessible, and survives malformed URLs', async (t) => {
  const temporary = await mkdtemp(path.join(tmpdir(), 'eujust-public-test-'));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const root = path.join(temporary, 'public');
  await mkdir(path.join(root, 'privacy'), { recursive: true });
  await writeFile(path.join(root, 'index.html'), '<h1>Public home</h1>');
  await writeFile(path.join(root, 'privacy/index.html'), '<h1>Privacy policy</h1>');
  await writeFile(path.join(root, '.hidden.html'), 'private fixture');
  await writeFile(path.join(temporary, 'outside.html'), 'outside fixture');
  await symlink(path.join(temporary, 'outside.html'), path.join(root, 'linked.html'));
  const server = createStaticServer(root);
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as import('node:net').AddressInfo).port;
  function request(url: string, method = 'GET') {
    return new Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }>((resolve, reject) => {
      const req = http.request({ hostname: '127.0.0.1', port, path: url, method }, (res) => {
        let body = ''; res.setEncoding('utf8'); res.on('data', (chunk) => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode!, body, headers: res.headers }));
      });
      req.on('error', reject); req.end();
    });
  }
  for (const url of ['/.hidden.html', '/%2ehidden.html', '/../outside.html', '/%2e%2e/outside.html', '/linked.html', '/serve.js', '/.env', '//example.invalid/']) {
    const response = await request(url);
    assert.equal(response.status, 404, url);
    assert.ok(!response.body.includes('fixture'), url);
  }
  assert.equal((await request('/%ZZ')).status, 400);
  assert.equal((await request('/', 'POST')).status, 405);
  const redirect = await request('/privacy?from=footer');
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.location, '/privacy/?from=footer');
  const policy = await request('/privacy/');
  assert.equal(policy.status, 200);
  assert.match(policy.body, /Privacy policy/);
  assert.equal(policy.headers['referrer-policy'], 'no-referrer');
  assert.equal((await request('/privacy/', 'HEAD')).body, '');
  assert.equal((await request('/')).status, 200);
});

test('publication manifest excludes repository data and rejects asset symlinks', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'eujust-build-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'privacy'), { recursive: true });
  await mkdir(path.join(root, 'assets'), { recursive: true });
  for (const name of ['privacy/index.html', 'index.html', 'styles.css', 'pages.css', 'privacy.css', 'main.js', 'pages.js', 'cookie-consent.js', 'sitemap.xml']) await writeFile(path.join(root, name), name);
  await writeFile(path.join(root, '.env'), 'private fixture');
  await writeFile(path.join(root, 'serve.js'), 'server fixture');
  assembleStaticSite(root, ['privacy/index.html']);
  assert.equal(await readFile(path.join(root, '.static-site/privacy/index.html'), 'utf8'), 'privacy/index.html');
  await assert.rejects(access(path.join(root, '.static-site/.env')));
  await assert.rejects(access(path.join(root, '.static-site/serve.js')));
  await symlink(path.join(root, '.env'), path.join(root, 'assets/leak.txt'));
  assert.throws(() => assembleStaticSite(root, ['privacy/index.html']), /Symlinks/);
  // A failed assembly must leave the last complete site available.
  assert.equal(await readFile(path.join(root, '.static-site/privacy/index.html'), 'utf8'), 'privacy/index.html');
});
