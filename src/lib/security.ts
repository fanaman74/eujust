import crypto from 'node:crypto';

export function redactError(error: unknown) {
  return String(error instanceof Error ? error.message : error).replace(/sk-[\w-]+/gi, '[redacted]').replace(/((?:api[_ -]?key|authorization|bearer)\s*[:=]?\s*)\S+/gi, '$1[redacted]').slice(0, 1_000);
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return;
  const expected = new URL(request.url).origin;
  if (origin !== expected) throw new Error('Cross-origin request rejected');
}

export function assertAdmin(request: Request) {
  if ((process.env.NODE_ENV ?? 'development') !== 'production') return;
  const configured = process.env.ADMIN_TOKEN;
  const provided = request.headers.get('x-admin-token');
  if (!configured || !provided) throw new Error('Admin authentication required');
  const expected = Buffer.from(configured); const actual = Buffer.from(provided);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) throw new Error('Admin authentication required');
}
