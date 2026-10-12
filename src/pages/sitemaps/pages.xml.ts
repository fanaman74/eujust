import type { APIRoute } from 'astro';
import { researchTopics } from '../../data/research-topics';
import { sitemapXml, xmlResponse } from '../../lib/sitemap';

export const GET: APIRoute = () => xmlResponse(sitemapXml(['/', '/cases', '/rules', '/decisions', '/discharge', '/topics', ...researchTopics.map((topic) => `/topics/${topic.slug}`)].map((path) => ({ path }))));
