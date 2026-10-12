import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import 'dotenv/config';
import { getSiteOrigin } from './src/config/site.mjs';

const publicSite = new URL(getSiteOrigin());
const trustedProxyDomains = [{ hostname: publicSite.hostname, protocol: 'https' }];
// Keep the existing apex-to-www redirect working behind the same HTTPS proxy.
if (publicSite.hostname === 'www.eujust.online') trustedProxyDomains.push({ hostname: 'eujust.online', protocol: 'https' });

export default defineConfig({
  site: publicSite.origin,
  // Astro must reconstruct the public HTTPS URL before checking browser origins.
  security: { allowedDomains: trustedProxyDomains },
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { host: process.env.HOST ?? '127.0.0.1', port: Number(process.env.PORT ?? 4321) },
  vite: { plugins: [tailwindcss()], ssr: { external: ['pg'] } }
});
