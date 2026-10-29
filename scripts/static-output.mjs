import fs from 'node:fs';
import path from 'node:path';

// Copy only the publication manifest, never the repository or its data/config files.
/** @param {string} root @param {string[]} pages */
export function assembleStaticSite(root, pages) {
  const output = path.join(root, '.static-site');
  const staging = fs.mkdtempSync(path.join(root, '.static-site-build-'));
  /** @param {string} relative */
  function copy(relative) {
    const source = path.resolve(root, relative);
    const target = path.resolve(staging, relative);
    if (!source.startsWith(root + path.sep) || !target.startsWith(staging + path.sep) || relative.split(/[\\/]/).some((part) => part.startsWith('.'))) throw new Error('Invalid publication path');
    const info = fs.lstatSync(source);
    if (info.isSymbolicLink()) throw new Error('Symlinks cannot be published');
    if (info.isDirectory()) {
      for (const child of fs.readdirSync(source)) copy(path.join(relative, child));
    } else if (info.isFile()) {
      if (!/\.(html|css|js|svg|png|jpe?g|webp|ico|woff2?|xml|txt|mp4)$/.test(relative)) throw new Error('Unsupported publication file');
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
    }
  }
  try {
    for (const file of [...pages, 'index.html', 'styles.css', 'pages.css', 'privacy.css', 'main.js', 'pages.js', 'cookie-consent.js', 'sitemap.xml', 'assets']) copy(file);
    fs.rmSync(output, { recursive: true, force: true });
    fs.renameSync(staging, output);
  } catch (error) {
    fs.rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}
