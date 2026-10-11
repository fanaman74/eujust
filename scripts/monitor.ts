import 'dotenv/config';
import { runMonitoring } from '../src/lib/monitor';
import { runUpdatesMonitoring } from '../src/lib/updates';
let failed = false;
try {
  console.log(await runMonitoring());
} catch (error) {
  failed = true;
  console.error('EUR-Lex monitoring failed:', error instanceof Error ? error.message : error);
} finally {
  try {
    const results = await runUpdatesMonitoring();
    console.log(results);
    if (results.some((result) => result.status === 'failed' || result.status === 'conflict')) failed = true;
  } catch (error) {
    failed = true;
    console.error('Institution monitoring failed:', error instanceof Error ? error.message : error);
  }
}
if (failed) process.exitCode = 1;
