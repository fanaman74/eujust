import test from 'node:test';
import assert from 'node:assert/strict';
import { getSiteOrigin } from '../src/config/site.mjs';
import { canonicalUrl, isIndexable, jsonLd, pageStructuredData } from '../src/lib/seo';
import { sitemapXml, xmlEscape } from '../src/lib/sitemap';

const production = { NODE_ENV: 'production', SITE_URL: 'https://www.eujust.online' };

test('canonical site configuration rejects credentials and non-origin URLs', () => {
  assert.equal(getSiteOrigin({}), 'https://www.eujust.online');
  for (const value of ['http://www.eujust.online', 'https://user:password@www.eujust.online', 'https://www.eujust.online/path', 'https://www.eujust.online/?key=value', 'https://www.eujust.online/#fragment']) {
    assert.throws(() => getSiteOrigin({ SITE_URL: value }));
  }
});

test('canonicals stay on the configured host, remove trailing slashes and retain real pagination', () => {
  assert.equal(canonicalUrl('/cases/', 2), 'https://www.eujust.online/cases?page=2');
  assert.equal(canonicalUrl('/cases', 1), 'https://www.eujust.online/cases');
  assert.equal(new URL(canonicalUrl('//other.example/path')).hostname, 'www.eujust.online');
});

test('indexing admits public records and pagination while excluding search, operations, errors and previews', () => {
  for (const path of ['/', '/cases', '/cases?page=2', '/cases/7', '/topics/workplace-harassment', '/cases?utm_source=example']) {
    assert.equal(isIndexable(new URL(path, production.SITE_URL), 200, false, production), true, path);
  }
  for (const path of ['/monitoring', '/settings', '/api/topics', '/cases?q=harassment', '/cases?topic=workplace-harassment', '/cases?court=General', '/cases?sort=name', '/cases?page=1.5', '/cases?page=-1']) {
    assert.equal(isIndexable(new URL(path, production.SITE_URL), 200, false, production), false, path);
  }
  assert.equal(isIndexable(new URL(production.SITE_URL), 503, false, production), false);
  assert.equal(isIndexable(new URL(production.SITE_URL), 404, false, production), false);
  assert.equal(isIndexable(new URL(production.SITE_URL), 200, true, production), false);
  assert.equal(isIndexable(new URL('http://localhost:4321'), 200, false, production), false);
  assert.equal(isIndexable(new URL('https://preview.up.railway.app'), 200, false, production), false);
  assert.equal(isIndexable(new URL(production.SITE_URL), 200, false, { ...production, NODE_ENV: 'development' }), false);
});

test('untrusted court titles cannot break out of JSON-LD script elements', () => {
  const title = '</script><img src=x onerror=alert(1)>\u2028\u2029';
  const encoded = jsonLd(pageStructuredData(title, 'Source metadata only', canonicalUrl('/cases/1'), 'WebPage'));
  assert.equal(encoded.includes('<'), false);
  assert.equal(encoded.includes('\u2028'), false);
  assert.equal(JSON.parse(encoded)['@graph'][2].name, title);
});

test('sitemaps escape XML, use real update dates and omit invalid or invented timestamps', () => {
  assert.equal(xmlEscape('<>&\'"\\'), '&lt;&gt;&amp;&apos;&quot;\\');
  const xml = sitemapXml([{ path: '/cases/7', updated: '2026-10-01T12:30:00Z' }, { path: '/rules', updated: 'invalid-date' }, { path: '/topics' }]);
  assert.match(xml, /<loc>https:\/\/www\.eujust\.online\/cases\/7<\/loc><lastmod>2026-10-01T12:30:00.000Z<\/lastmod>/);
  assert.equal((xml.match(/<lastmod>/g) ?? []).length, 1);
  assert.equal(xml.includes('Invalid Date'), false);
});
