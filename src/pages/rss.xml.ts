import type { APIRoute } from 'astro';
import { getTopicFeed, topicFeedXml } from '../lib/topic-feed';

export const GET: APIRoute = async () => {
  try {
    return new Response(topicFeedXml(await getTopicFeed()), {
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=300' }
    });
  } catch {
    return new Response('Topic feed temporarily unavailable. Please retry.', {
      status: 503, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' }
    });
  }
};
