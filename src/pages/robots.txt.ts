import type { APIRoute } from 'astro';
import { getSiteOrigin } from '../config/site.mjs';
import { isPublicDeployment } from '../lib/seo';

export const GET: APIRoute = ({ url }) => new Response(isPublicDeployment(url)
  ? `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${getSiteOrigin()}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
