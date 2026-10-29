import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const publicRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '.static-site');
/** @type {Record<string, string>} */
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.mp4': 'video/mp4'
};
/** @param {string} root @param {string} candidate */
const within = (root, candidate) => candidate === root || candidate.startsWith(root + path.sep);

export function createStaticServer(root = publicRoot) {
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    /** @param {number} status @param {string} message */
    const reply = (status, message) => {
      res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(req.method === 'HEAD' ? undefined : message);
    };
    if (!['GET', 'HEAD'].includes(req.method ?? '')) {
      res.setHeader('Allow', 'GET, HEAD');
      reply(405, 'Method not allowed'); return;
    }
    let requested;
    const rawUrl = req.url || '/';
    const rawPath = rawUrl.split('?')[0];
    try { requested = decodeURIComponent(rawPath); }
    catch { reply(400, 'Invalid URL'); return; }
    if (!requested.startsWith('/') || requested.startsWith('//') || /[\\\x00-\x1f\x7f]/.test(requested) || requested.split('/').some((part) => part.startsWith('.'))) {
      reply(404, 'Not found'); return;
    }
    let rootPath;
    try { rootPath = await realpath(root); }
    catch { reply(503, 'Site build unavailable'); return; }
    try {
      let filePath = await realpath(path.resolve(rootPath, '.' + requested));
      if (!within(rootPath, filePath)) { reply(404, 'Not found'); return; }
      if ((await stat(filePath)).isDirectory()) {
        if (!requested.endsWith('/')) {
          const location = rawPath + '/' + (rawUrl.includes('?') ? '?' + rawUrl.split('?').slice(1).join('?') : '');
          res.writeHead(301, { Location: location }); res.end(); return;
        }
        filePath = await realpath(path.join(filePath, 'index.html'));
      }
      if (!within(rootPath, filePath) || !types[path.extname(filePath)] || !(await stat(filePath)).isFile()) {
        reply(404, 'Not found'); return;
      }
      const data = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': types[path.extname(filePath)], 'Content-Length': data.length });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch { reply(404, 'Not found'); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 4173);
  const host = process.env.HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1');
  createStaticServer().listen(port, host, () => console.log(`EU JUST: http://${host}:${port}`));
}
