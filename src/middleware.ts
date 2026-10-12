import { defineMiddleware } from 'astro:middleware';
import { getSiteOrigin } from './config/site.mjs';
import { isPublicDeployment } from './lib/seo';

export const onRequest = defineMiddleware(async (context, next) => {
  const canonical = new URL(getSiteOrigin());
  // Consolidate the known alternate domain; leave localhost and deployment previews usable.
  if (process.env.NODE_ENV === 'production' && context.url.hostname === 'eujust.online' && canonical.hostname === 'www.eujust.online' && ['GET', 'HEAD'].includes(context.request.method)) {
    const target = new URL(canonical.origin);
    target.pathname = context.url.pathname;
    target.search = context.url.search;
    return context.redirect(target.href, 308);
  }
  const response = await next();
  if (!isPublicDeployment(context.url) || /^\/(?:api(?:\/|$)|monitoring(?:\/|$)|settings(?:\/|$))/.test(context.url.pathname) || response.status >= 400) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
});
