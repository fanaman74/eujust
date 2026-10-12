import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import 'dotenv/config';
import { getSiteOrigin } from './src/config/site.mjs';

export default defineConfig({
  site: getSiteOrigin(),
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { host: process.env.HOST ?? '127.0.0.1', port: Number(process.env.PORT ?? 4321) },
  vite: { plugins: [tailwindcss()], ssr: { external: ['pg'] } }
});
