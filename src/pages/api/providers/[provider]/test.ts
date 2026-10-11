import type { APIRoute } from 'astro';
import { testProvider } from '../../../../lib/ai';
import { assertAdmin, assertSameOrigin } from '../../../../lib/security';
import { redactProviderError, providerNames, type ProviderName } from '../../../../lib/ai';
import { z } from 'zod';

const providerInput = z.object({ apiKey: z.string().max(500).optional(), baseUrl: z.string().max(300).optional() });
const providerSchema = z.enum(providerNames);

export const POST: APIRoute = async ({ request, params }) => {
  let body: z.infer<typeof providerInput> | undefined;
  try {
    assertSameOrigin(request); assertAdmin(request);
    const provider = providerSchema.parse(params.provider) as ProviderName;
    const text = await request.text();
    body = text.trim() ? providerInput.parse(JSON.parse(text)) : undefined;
    return Response.json(await testProvider(provider, body));
  } catch (error) { return Response.json({ error: redactProviderError(error, body?.apiKey ? [body.apiKey] : []) }, { status: 400 }); }
};
