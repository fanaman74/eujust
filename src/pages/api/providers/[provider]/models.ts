import type { APIRoute } from 'astro';
import { providerModels, providerNames, redactProviderError, type ProviderName } from '../../../../lib/ai';
import { assertAdmin, assertSameOrigin } from '../../../../lib/security';
import { z } from 'zod';

const providerInput = z.object({ apiKey: z.string().max(500).optional(), baseUrl: z.string().max(300).optional() });
const providerSchema = z.enum(providerNames);

async function models(params: Record<string, string | undefined>, body?: z.infer<typeof providerInput>) {
  const provider = providerSchema.parse(params.provider) as ProviderName;
  return Response.json({ models: await providerModels(provider, body) });
}
export const GET: APIRoute = async ({ request, params }) => { try { assertSameOrigin(request); assertAdmin(request); return await models(params); } catch (error) { return Response.json({ error: redactProviderError(error) }, { status: 400 }); } };
export const POST: APIRoute = async ({ request, params }) => {
  let body: z.infer<typeof providerInput> | undefined;
  try {
    assertSameOrigin(request); assertAdmin(request);
    const text = await request.text(); body = text.trim() ? providerInput.parse(JSON.parse(text)) : undefined;
    return await models(params, body);
  } catch (error) { return Response.json({ error: redactProviderError(error, body?.apiKey ? [body.apiKey] : []) }, { status: 400 }); }
};
