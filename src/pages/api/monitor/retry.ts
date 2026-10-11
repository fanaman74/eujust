import type { APIRoute } from 'astro';
import { z } from 'zod';
import { query } from '../../../lib/db';
import { startMonitoringRun } from '../../../lib/monitor';
import { startInstitutionMonitoring } from '../../../lib/updates';
import { MonitoringConflictError, planMonitoringRetry } from '../../../lib/monitoring';
import { assertAdmin, assertSameOrigin, redactError } from '../../../lib/security';

const schema = z.object({ runId: z.number().int().positive().refine(Number.isSafeInteger, 'runId must be a safe integer') });

const statusFor = (error: unknown) => error instanceof MonitoringConflictError ? 409 : String(error instanceof Error ? error.message : error).includes('authentication required') ? 401 : String(error instanceof Error ? error.message : error).includes('Cross-origin') ? 403 : 400;

export const POST: APIRoute = async ({ request }) => {
  try {
    assertSameOrigin(request);
    assertAdmin(request);
    const { runId } = schema.parse(await request.json());
    const run = (await query<{ id: number; status: string; source_key: string; source_enabled: boolean; details: unknown }>('SELECT mr.id,mr.status,s.key source_key,s.enabled source_enabled,mr.details FROM monitoring_runs mr JOIN sources s ON s.id = mr.source_id WHERE mr.id = $1', [runId])).rows[0];
    if (!run) return Response.json({ error: 'Monitoring run not found' }, { status: 404 });
    const plan = planMonitoringRetry({ status: run.status, sourceKey: run.source_key, sourceEnabled: run.source_enabled, details: run.details });
    if (!plan.ok) return Response.json({ error: plan.error }, { status: plan.status });
    const failures = plan.failures;
    const started = run.source_key === 'eurlex-sparql'
      ? await startMonitoringRun({ sourceKey: run.source_key, retryOf: run.id, retryFailures: failures?.length ? failures : undefined })
      : await startInstitutionMonitoring(run.source_key, undefined, run.id);
    void started.completion.catch((error) => console.error('Monitoring retry failed:', redactError(error)));
    return Response.json({ runId: started.runId, retryOf: run.id, status: started.status, scope: plan.scope }, { status: 202 });
  } catch (error) {
    return Response.json({ error: redactError(error) }, { status: statusFor(error) });
  }
};
