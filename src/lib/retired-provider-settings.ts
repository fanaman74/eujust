import type { APIRoute } from 'astro';

// Retired endpoints never read, save, test or forward submitted credentials.
export const retiredProviderSettings: APIRoute = () => Response.json(
  { error: 'AI provider settings have been removed.' },
  { status: 410, headers: { 'Cache-Control': 'no-store' } }
);
