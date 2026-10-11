import { query, withTransaction } from './db';
import { fetchEurLexCases, fetchEurLexDocument, type EurLexRecord } from './source/eurlex';
import { reserveMonitoringRun, sourceError, type MonitoringFailure, type MonitoringReservation, EURLEX_SOURCE_KEY } from './monitoring';
import { monitoringFailureMessage } from './monitoring-plan';

export type MonitorOptions = {
  fetchImpl?: typeof fetch;
  sourceKey?: string;
  retryOf?: number;
  retryFailures?: MonitoringFailure[];
};

export type MonitorResult = {
  runId: number;
  status: string;
  discovered: number;
  imported: number;
  failed: number;
  failures: MonitoringFailure[];
};

export async function runMonitoring(options: MonitorOptions = {}) {
  const started = await startMonitoringRun(options);
  const result = await started.completion;
  const failureMessage = monitoringFailureMessage(result);
  if (failureMessage) throw new Error(failureMessage);
  return result;
}

export async function startMonitoringRun(options: MonitorOptions = {}) {
  const sourceKey = options.sourceKey ?? EURLEX_SOURCE_KEY;
  const reservation = await reserveMonitoringRun(sourceKey, options.retryOf);
  const completion = executeMonitoring(reservation, options).finally(reservation.release);
  return { runId: reservation.runId, status: 'running' as const, completion };
}

async function executeMonitoring(reservation: MonitoringReservation, options: MonitorOptions): Promise<MonitorResult> {
  const { source, runId } = reservation;
  const fetchImpl = options.fetchImpl ?? fetch;
  const targetedRetry = Boolean(options.retryOf && options.retryFailures?.length);
  try {
    let records: EurLexRecord[];
    let unresolved: MonitoringFailure[] = [];
    if (targetedRetry) {
      const retry = await loadRetryRecords(source.id, options.retryFailures!, fetchImpl);
      records = retry.records;
      unresolved = retry.unresolved;
    } else {
      const terms = (await query<{ terms_en: string[] }>('SELECT terms_en FROM topics WHERE enabled = true')).rows.flatMap((row) => row.terms_en).map((term) => term.toLocaleLowerCase('en')).filter(Boolean);
      records = (await fetchEurLexCases(fetchImpl)).filter((record) => terms.some((term) => record.title.toLocaleLowerCase('en').includes(term)));
    }
    let imported = 0;
    let failed = unresolved.length;
    let retrievalFailures = 0;
    const failures: MonitoringFailure[] = [...unresolved];
    for (const record of records) {
      try {
        const result = await upsertRecord(source.id, record, fetchImpl);
        if (result.created) imported++;
        if (result.retrievalFailed) {
          retrievalFailures++;
          failures.push({ celex: record.celex, kind: 'document', error: result.retrievalError ?? 'document unavailable', officialUrl: record.officialUrl, source: source.name });
        }
      } catch (error) {
        failed++;
        failures.push({ celex: record.celex, kind: 'record', error: sourceError(error, source.name), officialUrl: record.officialUrl, source: source.name });
      }
    }
    const totalFailures = failed + retrievalFailures;
    const status = totalFailures ? (imported || records.length ? 'partial' : 'failed') : 'success';
    const details = { recordFailures: failed, documentFailures: retrievalFailures, retryScope: targetedRetry ? 'failed-records' : 'full-source', failures };
    const discovered = records.length + unresolved.length;
    await query(`UPDATE monitoring_runs SET finished_at = NOW(), status = $1, discovered_count = $2, imported_count = $3, failure_count = $4, details = COALESCE(details, '{}'::jsonb) || $5::jsonb WHERE id = $6`, [status, discovered, imported, totalFailures, JSON.stringify(details), runId]);
    await query(`UPDATE sources SET last_checked_at = NOW(), last_success_at = CASE WHEN $1 = 'success' AND $3 = true THEN NOW() ELSE last_success_at END WHERE id = $2`, [status, source.id, !targetedRetry]);
    return { runId, status, discovered, imported, failed: totalFailures, failures };
  } catch (error) {
    const message = sourceError(error, source.name);
    await query(`UPDATE monitoring_runs SET finished_at = NOW(), status = 'failed', failure_count = 1, error_message = $1, details = COALESCE(details, '{}'::jsonb) || $2::jsonb WHERE id = $3`, [message, JSON.stringify({ retryScope: targetedRetry ? 'failed-records' : 'full-source', failures: [{ kind: 'source', error: message, source: source.name }] }), runId]);
    await query('UPDATE sources SET last_checked_at = NOW() WHERE id = $1', [source.id]);
    return { runId, status: 'failed', discovered: 0, imported: 0, failed: 1, failures: [{ kind: 'source', error: message, source: source.name }] };
  }
}

async function loadRetryRecords(sourceId: number, failures: MonitoringFailure[], fetchImpl: typeof fetch) {
  const celexes = [...new Set(failures.map((failure) => failure.celex).filter((celex): celex is string => Boolean(celex)))];
  if (!celexes.length) return { records: [], unresolved: failures.map((failure) => ({ ...failure, kind: 'retry-target', error: 'No CELEX was saved for this failure' })) };
  const rows = (await query<{ celex: string; title: string; judgment_date: string | null; language: string | null; official_url: string | null; work: string | null }>(`SELECT c.celex,c.title,c.judgment_date::text judgment_date,c.language,d.official_url,d.metadata->>'work' work FROM cases c LEFT JOIN documents d ON d.source_id = $1 AND d.source_reference = c.celex WHERE c.celex = ANY($2::text[])`, [sourceId, celexes])).rows;
  const byCelex = new Map<string, EurLexRecord>(rows.map((row) => [row.celex, { celex: row.celex, title: row.title, judgmentDate: row.judgment_date, work: row.work ?? '', language: row.language ?? 'English source version', officialUrl: row.official_url ?? `https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:${encodeURIComponent(row.celex)}` }]));
  const missing = celexes.filter((celex) => !byCelex.has(celex));
  let lookupError: string | null = null;
  if (missing.length) {
    try {
      for (const record of await fetchEurLexCases(fetchImpl)) if (missing.includes(record.celex)) byCelex.set(record.celex, record);
    } catch (error) {
      lookupError = sourceError(error, 'EUR-Lex targeted retry lookup');
    }
  }
  const records: EurLexRecord[] = [];
  const unresolved: MonitoringFailure[] = [];
  const seenRecords = new Set<string>();
  for (const failure of failures) {
    if (!failure.celex) { unresolved.push({ ...failure, kind: 'retry-target', error: 'No CELEX was saved for this failure' }); continue; }
    const row = byCelex.get(failure.celex);
    if (!row) { unresolved.push({ ...failure, kind: 'retry-target', error: lookupError ?? 'Stored case metadata and the targeted source record are unavailable for this retry' }); continue; }
    if (seenRecords.has(row.celex)) continue;
    seenRecords.add(row.celex);
    records.push(row);
  }
  return { records, unresolved };
}

async function upsertRecord(sourceId: number, record: EurLexRecord, fetchImpl?: typeof fetch) {
  let document: { text: string; truncated: boolean } | null = null;
  let retrievalError: string | null = null;
  try { document = await fetchEurLexDocument(record, fetchImpl ?? fetch); } catch (error) { retrievalError = sourceError(error, `EUR-Lex document ${record.celex}`); }
  return withTransaction(async (client) => {
    const courtName = record.celex.includes('FJ') || record.celex.includes('FO') ? 'Civil Service Tribunal of the European Union' : record.celex.includes('TJ') || record.celex.includes('TO') ? 'General Court of the European Union' : 'Court of Justice of the European Union';
    const court = await client.query<{ id: number }>('INSERT INTO courts(name, jurisdiction) VALUES($1,$2) ON CONFLICT(name,jurisdiction) DO UPDATE SET name=EXCLUDED.name RETURNING id', [courtName, 'European Union']);
    const existing = await client.query<{ id: number }>('SELECT id FROM cases WHERE celex = $1', [record.celex]);
    const result = await client.query<{ id: number }>(`INSERT INTO cases(celex, case_number, title, court_id, judgment_date, publication_date, language, updated_at)
      VALUES($1,$2,$3,$4,$5,NULL,$6,NOW()) ON CONFLICT(celex) DO UPDATE SET title=EXCLUDED.title, judgment_date=COALESCE(EXCLUDED.judgment_date,cases.judgment_date), updated_at=NOW() RETURNING id`, [record.celex, caseNumber(record.celex, record.title), record.title, court.rows[0].id, record.judgmentDate, record.language]);
    const caseId = result.rows[0].id;
    const metadata: Record<string, unknown> = { work: record.work, retrievalError };
    if (document) metadata.truncated = document.truncated;
    await client.query(`INSERT INTO documents(case_id, source_id, source_reference, official_url, text_content, retrieved_at, publication_date, metadata)
      VALUES($1,$2,$3,$4,$5::text,CASE WHEN $5::text IS NULL THEN NULL ELSE NOW() END,NULL,$6::jsonb)
      ON CONFLICT(source_id, source_reference) DO UPDATE SET official_url=EXCLUDED.official_url, text_content=COALESCE(EXCLUDED.text_content,documents.text_content), retrieved_at=COALESCE(EXCLUDED.retrieved_at,documents.retrieved_at), metadata=documents.metadata || EXCLUDED.metadata`, [caseId, sourceId, record.celex, record.officialUrl, document?.text ?? null, JSON.stringify(metadata)]);
    const terms = await client.query<{ id: number; terms_en: string[] }>('SELECT id, terms_en FROM topics WHERE enabled = true');
    const lowerTitle = record.title.toLocaleLowerCase('en');
    for (const topic of terms.rows) if (topic.terms_en.some((term: string) => lowerTitle.includes(term.toLocaleLowerCase('en')))) await client.query('INSERT INTO case_topics(case_id, topic_id, match_type) VALUES($1,$2,\'keyword match\') ON CONFLICT DO NOTHING', [caseId, topic.id]);
    return { created: !existing.rows[0], retrievalFailed: Boolean(retrievalError), retrievalError };
  });
}

function caseNumber(celex: string, title = '') { const match = celex.match(/^6(\d{4})(C|T|F)(J|O)(\d{4})$/); if (!match) return celex; const appeal = /\b[CPF]-?\d+\/\d+\s+P\b|\(.*\bP\b\)/i.test(title) ? ' P' : ''; return `${match[2]}-${Number(match[4])}/${match[1].slice(2)}${appeal}`; }
