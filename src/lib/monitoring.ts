import type { PoolClient } from 'pg';
import { getPool, query } from './db';
import { EURLEX_LOCK_KEY, EURLEX_SOURCE_KEY, MonitoringConflictError, type MonitoringSource } from './monitoring-plan';
export * from './monitoring-plan';

export type MonitoringReservation = {
  source: MonitoringSource;
  runId: number;
  release: () => Promise<void>;
};

export async function getMonitoringSource(sourceKey: string) {
  return (await query<MonitoringSource>('SELECT id, key, name, enabled FROM sources WHERE key = $1', [sourceKey])).rows[0] ?? null;
}

export async function reserveMonitoringRun(sourceKey: string, retryOf?: number): Promise<MonitoringReservation> {
  const source = await getMonitoringSource(sourceKey);
  if (!source) throw new Error(`Unknown monitoring source: ${sourceKey}`);
  if (!source.enabled) throw new Error(`Monitoring source is disabled: ${sourceKey}`);
  const lease = await acquireSourceLock(sourceKey);
  try {
    await recoverInterruptedRuns(source.id);
    const details = retryOf ? JSON.stringify({ retryOf }) : '{}';
    const run = await query<{ id: number }>('INSERT INTO monitoring_runs(source_id, details) VALUES($1, $2::jsonb) RETURNING id', [source.id, details]);
    return { source, runId: run.rows[0].id, release: lease.release };
  } catch (error) {
    await lease.release();
    throw error;
  }
}

async function acquireSourceLock(sourceKey: string) {
  let client: PoolClient | undefined;
  let locked = false;
  let conflict = false;
  try {
    client = await getPool().connect();
    const result = sourceKey === EURLEX_SOURCE_KEY
      ? await client.query<{ locked: boolean }>('SELECT pg_try_advisory_lock($1) AS locked', [EURLEX_LOCK_KEY])
      : await client.query<{ locked: boolean }>('SELECT pg_try_advisory_lock(hashtextextended($1, 0)) AS locked', [sourceKey]);
    locked = Boolean(result.rows[0]?.locked);
    if (!locked) { conflict = true; throw new MonitoringConflictError(`Source is already being checked: ${sourceKey}`); }
    let released = false;
    return {
      release: async () => {
        if (released) return;
        released = true;
        let unlocked = false;
        try {
          if (sourceKey === EURLEX_SOURCE_KEY) await client!.query('SELECT pg_advisory_unlock($1)', [EURLEX_LOCK_KEY]);
          else await client!.query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', [sourceKey]);
          unlocked = true;
        } catch { /* destroy a connection that may still hold the session lock */ }
        client!.release(!unlocked);
      }
    };
  } catch (error) {
    if (client) client.release(conflict ? undefined : true);
    throw error;
  }
}

async function recoverInterruptedRuns(sourceId: number) {
  const error = 'Monitoring process interrupted before this run finished; it was recovered when the source lock became available.';
  await query(`UPDATE monitoring_runs SET finished_at = NOW(), status = 'failed', failure_count = GREATEST(failure_count, 1), error_message = $1, details = COALESCE(details, '{}'::jsonb) || $2::jsonb WHERE source_id = $3 AND status = 'running'`, [error, JSON.stringify({ recovery: 'interrupted', failures: [{ kind: 'source', error }] }), sourceId]);
}
