import type { APIRoute } from 'astro';
import { runMonitoring } from '../../lib/monitor';
import { runUpdatesMonitoring } from '../../lib/updates';
import { MonitoringConflictError } from '../../lib/monitoring';
import { assertAdmin, assertSameOrigin, redactError } from '../../lib/security';

const errorStatus = (error: unknown) => error instanceof MonitoringConflictError ? 409 : String(error instanceof Error ? error.message : error).includes('authentication required') ? 401 : String(error instanceof Error ? error.message : error).includes('Cross-origin') ? 403 : 500;

type CasesRunner = () => Promise<Awaited<ReturnType<typeof runMonitoring>>>;
type InstitutionsRunner = () => Promise<Awaited<ReturnType<typeof runUpdatesMonitoring>>>;

/** Run the independent source groups even when one group reports a fatal result. */
export async function runMonitoringWithInstitutions(runCases: CasesRunner = runMonitoring, runInstitutions: InstitutionsRunner = runUpdatesMonitoring) {
  let cases: Awaited<ReturnType<typeof runMonitoring>> | null = null;
  let casesError: unknown = null;
  try { cases = await runCases(); } catch (error) { casesError = error; }
  let institutions: Awaited<ReturnType<typeof runUpdatesMonitoring>> = [];
  let institutionsError: unknown = null;
  try { institutions = await runInstitutions(); } catch (error) { institutionsError = error; }
  return { cases, institutions, casesError, institutionsError };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    assertSameOrigin(request);
    assertAdmin(request);
    const result = await runMonitoringWithInstitutions();
    if (result.casesError) return Response.json({ error: redactError(result.casesError), institutions: result.institutions }, { status: errorStatus(result.casesError) });
    if (result.institutionsError) return Response.json({ ...result.cases!, institutions: result.institutions, error: redactError(result.institutionsError) }, { status: errorStatus(result.institutionsError) });
    return Response.json({ ...result.cases!, institutions: result.institutions });
  } catch (error) {
    return Response.json({ error: redactError(error) }, { status: errorStatus(error) });
  }
};
