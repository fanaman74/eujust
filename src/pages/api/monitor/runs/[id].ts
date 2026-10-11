import type { APIRoute } from 'astro';
import { query } from '../../../../lib/db';
import { redactError } from '../../../../lib/security';

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });

export const GET: APIRoute = async ({ params }) => {
  try {
    const id = Number(params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return json({ error: 'Invalid monitoring run id' }, 400);
    const run = (await query(`SELECT mr.id,mr.source_id,s.key source_key,s.name source_name,s.enabled source_enabled,mr.started_at,mr.finished_at,mr.status,mr.discovered_count,mr.imported_count,mr.failure_count,mr.error_message,mr.details FROM monitoring_runs mr JOIN sources s ON s.id=mr.source_id WHERE mr.id=$1`, [id])).rows[0];
    return run ? json(run) : json({ error: 'Monitoring run not found' }, 404);
  } catch (error) {
    return json({ error: redactError(error) }, 500);
  }
};
