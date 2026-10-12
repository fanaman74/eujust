import type { APIRoute } from 'astro';
import { query } from '../../../../lib/db';
import { redactError } from '../../../../lib/security';
import { buildResearchPrompt } from '../../../../lib/research-prompt';

export const GET: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!/^\d+$/.test(params.id ?? '') || !Number.isSafeInteger(id) || id < 1) return Response.json({ error: 'Case not found' }, { status: 404 });
  try {
    // The handoff contains the same public record and official source material,
    // never provider settings, stored keys or generated reports.
    const { rows } = await query(`SELECT c.title, c.case_number, c.celex, d.official_url, d.text_content, d.metadata
      FROM cases c LEFT JOIN LATERAL (SELECT official_url, text_content, metadata FROM documents
      WHERE case_id=c.id ORDER BY (text_content IS NOT NULL) DESC, retrieved_at DESC NULLS LAST LIMIT 1) d ON true WHERE c.id=$1`, [id]);
    if (!rows[0]) return Response.json({ error: 'Case not found' }, { status: 404 });
    const record = rows[0];
    return Response.json({ prompt: buildResearchPrompt({ title: record.title, reference: record.case_number || record.celex, celex: record.celex, officialUrl: record.official_url, text: record.text_content, truncated: record.metadata?.truncated === true }) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return Response.json({ error: redactError(error) }, { status: 503, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } }); }
};
