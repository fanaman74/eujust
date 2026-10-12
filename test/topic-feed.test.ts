import test from 'node:test';
import assert from 'node:assert/strict';
import { topicFeedXml, type TopicFeedItem } from '../src/lib/topic-feed';

const item: TopicFeedItem = {
  key: 'case-7', title: 'A v B', href: '/cases/7', source: 'General Court',
  date: '2026-04-16', addedAt: '2026-10-12T12:00:00Z', dateLabel: 'Judgment', categories: ['Workplace harassment']
};

test('RSS exposes real record links, categories and stable IDs; discovery and judgment dates stay distinct', () => {
  const xml = topicFeedXml([item, { ...item, key: 'update-7', href: 'https://www.ombudsman.europa.eu/decision/7', title: 'Institution update', dateLabel: 'Document' }]);
  assert.match(xml, /<link>https:\/\/www\.eujust\.online\/cases\/7<\/link>/);
  assert.match(xml, /<link>https:\/\/www\.ombudsman\.europa\.eu\/decision\/7<\/link>/);
  assert.match(xml, /#case-7<\/guid>/);
  assert.match(xml, /#update-7<\/guid>/);
  assert.match(xml, /<pubDate>Mon, 12 Oct 2026 12:00:00 GMT<\/pubDate>/);
  assert.match(xml, /Judgment date: 2026-04-16/);
  assert.match(xml, /<category>Workplace harassment<\/category>/);
  assert.match(xml, /rel="self" type="application\/rss\+xml"/);
});

test('RSS neutralizes untrusted XML, illegal controls, unpaired surrogates and executable source links', () => {
  const xml = topicFeedXml([{ ...item, title: '</title><script>bad</script>&\u0000\uD800🟢', href: 'javascript:alert(1)', categories: ['<topic>&'] }]);
  assert.match(xml, /&lt;script&gt;bad&lt;\/script&gt;&amp;🟢/);
  assert.match(xml, /<category>&lt;topic&gt;&amp;<\/category>/);
  assert.equal(xml.includes('\u0000'), false);
  assert.equal(xml.includes('\uD800'), false);
  assert.equal(xml.includes('javascript:'), false);
  assert.match(xml, /<link>https:\/\/www\.eujust\.online\/rules<\/link>/);
});

test('empty feeds and undated records do not invent publication or update timestamps', () => {
  const empty = topicFeedXml([]);
  assert.equal(empty.includes('<item>'), false);
  assert.equal(empty.includes('<lastBuildDate>'), false);
  const xml = topicFeedXml([{ ...item, date: null, addedAt: 'invalid' }]);
  assert.match(xml, /Judgment date: not recorded/);
  assert.equal(xml.includes('<pubDate>'), false);
  assert.equal(xml.includes('Invalid Date'), false);
});
