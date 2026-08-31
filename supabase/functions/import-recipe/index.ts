// Supabase Edge Function: fetches a recipe page server-side (the browser
// can't, because of CORS) and returns a normalized RecipeDraft extracted from
// its schema.org markup. Deploy with:  supabase functions deploy import-recipe
//
// Parsers under ./parse/ are synced copies of src/lib/parse (npm run sync:edge).

import { draftFromHtml, normalizeSchemaRecipe } from './parse/jsonld.ts';
import { extractMicrodataRecipe } from './parse/microdata.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json' } });

function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.local') || h === '::1') return true;
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;
  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 192 && b === 168) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 169 && b === 254)
  );
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    chunks.push(value);
    if (total > maxBytes) {
      reader.cancel();
      break;
    }
  }
  const merged = new Uint8Array(Math.min(total, maxBytes));
  let offset = 0;
  for (const chunk of chunks) {
    const slice = chunk.subarray(0, Math.max(0, merged.length - offset));
    merged.set(slice, offset);
    offset += slice.length;
    if (offset >= merged.length) break;
  }
  return new TextDecoder().decode(merged);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, reason: 'fetch_failed' }, 405);
  try {
    const { url } = await req.json();
    let parsed: URL;
    try {
      parsed = new URL(String(url));
    } catch {
      return json({ ok: false, reason: 'fetch_failed' });
    }
    if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password || isPrivateHost(parsed.hostname)) {
      return json({ ok: false, reason: 'fetch_failed' });
    }

    const res = await fetch(parsed.href, {
      redirect: 'follow',
      signal: AbortSignal.timeout(10_000),
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; RecipeBox/1.0; +https://github.com/alonrapaport/recipebox)',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'he,en;q=0.8',
      },
    });
    if (!res.ok) return json({ ok: false, reason: 'fetch_failed' });
    const html = await readCapped(res, 2 * 1024 * 1024);

    let draft = draftFromHtml(html, parsed.href);
    if (!draft) {
      try {
        const { parseHTML } = await import('npm:linkedom@0.18.5');
        const { document } = parseHTML(html);
        // linkedom's document is close enough to a DOM Document for our queries
        const node = extractMicrodataRecipe(document as unknown as Document);
        if (node) draft = normalizeSchemaRecipe(node, parsed.href);
      } catch {
        // microdata fallback unavailable — JSON-LD result stands
      }
    }
    return json(draft ? { ok: true, draft } : { ok: false, reason: 'no_recipe' });
  } catch {
    return json({ ok: false, reason: 'fetch_failed' });
  }
});
