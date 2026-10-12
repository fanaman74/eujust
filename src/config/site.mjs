export const DEFAULT_SITE_URL = 'https://www.eujust.online';

/** @param {Record<string, string | undefined>} [environment] */
export function getSiteOrigin(environment = process.env) {
  const url = new URL(environment.SITE_URL || DEFAULT_SITE_URL);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_URL must be an HTTPS origin without credentials, a path, query or fragment.');
  }
  return url.origin;
}
