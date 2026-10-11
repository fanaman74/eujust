import { redactError } from './security.ts';

export const EURLEX_SOURCE_KEY = 'eurlex-sparql';
export const INSTITUTION_SOURCE_KEYS = ['ombudsman-documents', 'commission-cellar', 'commission-press'] as const;
export const RETRYABLE_STATUSES = ['failed', 'partial'] as const;
export const EURLEX_LOCK_KEY = 684321987;

export type MonitoringFailure = {
  celex?: string;
  kind: string;
  error: string;
  officialUrl?: string;
  source?: string;
};

export type MonitoringSource = { id: number; key: string; name: string; enabled: boolean };

export function monitoringFailureMessage(result: { status: string; failures?: MonitoringFailure[] }) {
  return result.status === 'failed' ? result.failures?.[0]?.error ?? 'Monitoring source check failed' : null;
}

export class MonitoringConflictError extends Error {
  constructor(message = 'This source is already being checked') {
    super(message);
    this.name = 'MonitoringConflictError';
  }
}

export function isRetryableSource(sourceKey: string) {
  return sourceKey === EURLEX_SOURCE_KEY || (INSTITUTION_SOURCE_KEYS as readonly string[]).includes(sourceKey);
}

export function isRetryableStatus(status: string | null | undefined) {
  return (RETRYABLE_STATUSES as readonly string[]).includes(status ?? '');
}

export type RetryPlan = { ok: true; sourceKey: string; scope: 'failed-records' | 'source'; failures?: MonitoringFailure[] } | { ok: false; status: 400 | 409; error: string };

export function planMonitoringRetry(run: { status: string; sourceKey: string; sourceEnabled: boolean; details: unknown }): RetryPlan {
  if (!isRetryableStatus(run.status)) return { ok: false, status: 409, error: `Only failed or partial runs can be retried; this run is ${run.status}.` };
  if (!isRetryableSource(run.sourceKey)) return { ok: false, status: 400, error: 'This monitoring source cannot be retried from the dashboard.' };
  if (!run.sourceEnabled) return { ok: false, status: 409, error: 'This monitoring source is disabled. Enable it before retrying.' };
  const failures = run.sourceKey === EURLEX_SOURCE_KEY ? retryFailuresFromDetails(run.details) : null;
  return failures?.length ? { ok: true, sourceKey: run.sourceKey, scope: 'failed-records', failures } : { ok: true, sourceKey: run.sourceKey, scope: 'source' };
}

export function retryFailuresFromDetails(details: unknown): MonitoringFailure[] | null {
  if (!details || typeof details !== 'object' || !Array.isArray((details as { failures?: unknown }).failures)) return null;
  return (details as { failures: unknown[] }).failures.filter((failure): failure is MonitoringFailure => {
    if (!failure || typeof failure !== 'object') return false;
    const value = failure as Partial<MonitoringFailure>;
    return typeof value.celex === 'string' && value.celex.trim().length > 0 && ['document', 'record', 'retry-target'].includes(value.kind ?? '') && typeof value.error === 'string';
  }).map((failure) => ({ ...failure, celex: failure.celex!.trim() }));
}

export function sourceError(error: unknown, source: string) {
  const message = redactError(error);
  const http = message.match(/\bHTTP\s+(\d{3})\b/i);
  const code = http ? `http_${http[1]}` : /timeout|timed out|abort/i.test(message) ? 'timeout' : /datastream|content datastream|unusable document/i.test(message) ? 'content_unavailable' : /json|payload/i.test(message) ? 'invalid_payload' : 'source_error';
  const cause = error instanceof Error && error.cause && typeof error.cause === 'object' ? error.cause as { code?: unknown; name?: unknown } : null;
  const causeValue = [cause?.code, cause?.name].find((value): value is string => typeof value === 'string' && /^[A-Za-z0-9_.-]{1,64}$/.test(value));
  return `${source} [${code}${causeValue ? `; cause=${causeValue}` : ''}]: ${message}`.slice(0, 1_000);
}
