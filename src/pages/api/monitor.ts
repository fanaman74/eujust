import type { APIRoute } from 'astro';
import { runMonitoring } from '../../lib/monitor';
import { runUpdatesMonitoring } from '../../lib/updates';
import { MonitoringConflictError } from '../../lib/monitoring';
import { assertAdmin, assertSameOrigin, redactError } from '../../lib/security';

const errorStatus = (error: unknown) => error instanceof MonitoringConflictError ? 409 : String(error instanceof Error ? error.message : error).includes('authentication required') ? 401 : String(error instanceof Error ? error.message : error).includes('Cross-origin') ? 403 : 500;

export const POST: APIRoute = async ({ request }) => {
  try {
    assertSameOrigin(request);
    assertAdmin(request);
    const cases = await runMonitoring();
    const institutions = await runUpdatesMonitoring();
    return Response.json({ ...cases, institutions });
  } catch (error) {
    return Response.json({ error: redactError(error) }, { status: errorStatus(error) });
  }
};
