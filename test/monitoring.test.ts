import test from 'node:test';
import assert from 'node:assert/strict';
import { monitoringFailureMessage, planMonitoringRetry, retryFailuresFromDetails, sourceError } from '../src/lib/monitoring-plan.ts';

test('fatal monitor results retain a thrown error for synchronous callers', () => {
  assert.equal(monitoringFailureMessage({ status: 'success' }), null);
  assert.equal(monitoringFailureMessage({ status: 'failed', failures: [{ kind: 'source', error: 'EUR-Lex [http_500]: endpoint failed' }] }), 'EUR-Lex [http_500]: endpoint failed');
  assert.equal(monitoringFailureMessage({ status: 'failed', failures: [] }), 'Monitoring source check failed');
});

test('retry planning targets saved EUR-Lex document failures and preserves scope', () => {
  const plan = planMonitoringRetry({
    status: 'partial',
    sourceKey: 'eurlex-sparql',
    sourceEnabled: true,
    details: { failures: [{ celex: '62024TJ0145', kind: 'document', error: 'EUR-Lex document returned HTTP 404' }] }
  });
  assert.equal(plan.ok, true);
  if (plan.ok) {
    assert.equal(plan.scope, 'failed-records');
    assert.deepEqual(plan.failures?.map((failure) => failure.celex), ['62024TJ0145']);
  }
});

test('retry planning uses a full source check only when no EUR-Lex failure details exist', () => {
  const plan = planMonitoringRetry({ status: 'failed', sourceKey: 'eurlex-sparql', sourceEnabled: true, details: {} });
  assert.deepEqual(plan, { ok: true, sourceKey: 'eurlex-sparql', scope: 'source' });
  const sourceFailure = planMonitoringRetry({ status: 'failed', sourceKey: 'eurlex-sparql', sourceEnabled: true, details: { failures: [{ kind: 'source', error: 'EUR-Lex [http_500]: endpoint failed' }] } });
  assert.deepEqual(sourceFailure, { ok: true, sourceKey: 'eurlex-sparql', scope: 'source' });
  const institution = planMonitoringRetry({ status: 'partial', sourceKey: 'commission-press', sourceEnabled: true, details: { failures: [{ kind: 'source', error: 'timeout' }] } });
  assert.deepEqual(institution, { ok: true, sourceKey: 'commission-press', scope: 'source' });
});

test('retry planning rejects terminal success, disabled sources and unsupported sources', () => {
  assert.equal(planMonitoringRetry({ status: 'success', sourceKey: 'eurlex-sparql', sourceEnabled: true, details: {} }).ok, false);
  assert.equal(planMonitoringRetry({ status: 'partial', sourceKey: 'eurlex-sparql', sourceEnabled: false, details: {} }).ok, false);
  assert.equal(planMonitoringRetry({ status: 'failed', sourceKey: 'manual', sourceEnabled: true, details: {} }).ok, false);
});

test('retry failure details require a usable kind and error', () => {
  assert.deepEqual(retryFailuresFromDetails({ failures: [{ celex: 'x', kind: 'document', error: 'missing' }, { kind: 'source', error: 'ignored' }, { celex: 'x', kind: 'source', error: 'ignored' }, { kind: 3, error: 'ignored' }] }), [{ celex: 'x', kind: 'document', error: 'missing' }]);
  assert.equal(retryFailuresFromDetails({}), null);
});

test('source errors expose safe connection context without raw cause data', () => {
  const error = Object.assign(new Error('request failed'), { cause: { code: 'UND_ERR_CONNECT_TIMEOUT', secret: 'do-not-display' } });
  const message = sourceError(error, 'Ombudsman');
  assert.match(message, /cause=UND_ERR_CONNECT_TIMEOUT/);
  assert.doesNotMatch(message, /do-not-display/);
});
