import { query } from './db';
import { fetchCommissionDocuments, fetchCommissionPress, fetchOmbudsmanUpdates, type InstitutionUpdate } from './source/institutions';
import { INSTITUTION_SOURCE_KEYS, MonitoringConflictError, reserveMonitoringRun, sourceError } from './monitoring';

const fetchers: Record<string, (fetchImpl?: typeof fetch) => Promise<InstitutionUpdate[]>> = {
  'ombudsman-documents': fetchOmbudsmanUpdates,
  'commission-cellar': fetchCommissionDocuments,
  'commission-press': fetchCommissionPress
};

export const supportedInstitutionSources = [...INSTITUTION_SOURCE_KEYS];
export type UpdatesMonitoringOptions = { sourceKeys?: string[]; retryOf?: number };
export type UpdatesMonitoringResult = { source: string; status: string; runId?: number; discovered: number; imported: number; error?: string }[];

/** Checks each institution source in turn. One source failing is recorded on its own run and does not stop the others. */
export async function runUpdatesMonitoring(fetchImpl?: typeof fetch, options: UpdatesMonitoringOptions = {}) {
  const selected = options.sourceKeys?.length ? options.sourceKeys : Object.keys(fetchers);
  const results: UpdatesMonitoringResult = [];
  for (const key of selected) {
    if (!fetchers[key]) continue;
    try {
      const started = await startInstitutionMonitoring(key, fetchImpl, options.retryOf);
      results.push(await started.completion);
    } catch (error) {
      const message = error instanceof MonitoringConflictError ? error.message : sourceError(error, key);
      results.push({ source: key, status: error instanceof MonitoringConflictError ? 'conflict' : 'failed', discovered: 0, imported: 0, error: message });
    }
  }
  return results;
}

export async function startInstitutionMonitoring(sourceKey: string, fetchImpl?: typeof fetch, retryOf?: number) {
  const reservation = await reserveMonitoringRun(sourceKey, retryOf);
  const completion = executeInstitutionMonitoring(reservation.source.id, reservation.source.name, reservation.runId, sourceKey, fetchImpl ?? fetch, Boolean(retryOf)).finally(reservation.release);
  return { runId: reservation.runId, status: 'running' as const, completion };
}

async function executeInstitutionMonitoring(sourceId: number, sourceName: string, runId: number, sourceKey: string, fetchImpl: typeof fetch, targetedRetry: boolean) {
  try {
    const updates = await fetchers[sourceKey](fetchImpl);
    let imported = 0;
    for (const update of updates) {
      const saved = await query<{ created: boolean }>(`INSERT INTO institution_updates(source_id, institution, external_id, title, kind, reference, document_date, official_url, matched_terms)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT(source_id, external_id) DO UPDATE SET title=EXCLUDED.title, kind=EXCLUDED.kind, reference=EXCLUDED.reference, document_date=EXCLUDED.document_date, official_url=EXCLUDED.official_url, matched_terms=EXCLUDED.matched_terms
        RETURNING (xmax = 0) AS created`, [sourceId, update.institution, update.externalId, update.title, update.kind, update.reference, update.documentDate, update.officialUrl, update.matchedTerms]);
      if (saved.rows[0].created) imported++;
    }
    await query(`UPDATE monitoring_runs SET finished_at = NOW(), status = 'success', discovered_count = $1, imported_count = $2, failure_count = 0, details = COALESCE(details, '{}'::jsonb) || $3::jsonb WHERE id = $4`, [updates.length, imported, JSON.stringify({ retryScope: targetedRetry ? 'source' : 'full-source', failures: [] }), runId]);
    await query('UPDATE sources SET last_checked_at = NOW(), last_success_at = NOW() WHERE id = $1', [sourceId]);
    return { source: sourceKey, status: 'success', runId, discovered: updates.length, imported };
  } catch (error) {
    const message = sourceError(error, sourceName);
    await query(`UPDATE monitoring_runs SET finished_at = NOW(), status = 'failed', failure_count = 1, error_message = $1, details = COALESCE(details, '{}'::jsonb) || $2::jsonb WHERE id = $3`, [message, JSON.stringify({ retryScope: targetedRetry ? 'source' : 'full-source', failures: [{ kind: 'source', error: message, source: sourceName }] }), runId]);
    await query('UPDATE sources SET last_checked_at = NOW() WHERE id = $1', [sourceId]);
    return { source: sourceKey, status: 'failed', runId, discovered: 0, imported: 0, error: message };
  }
}
