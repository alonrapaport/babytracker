import type { RecipeDraft } from './types';
import { supabase, isConfigured } from './supabase';
import { isDemo } from './demo';
import { draftFromHtml, findRecipeNodes, normalizeSchemaRecipe } from './parse/jsonld';
import { extractMicrodataRecipe } from './parse/microdata';
import { parseRecipeText } from './parse/text';

export type ImportResult =
  | { ok: true; draft: RecipeDraft }
  | { ok: false; reason: 'unavailable' | 'fetch_failed' | 'no_recipe' };

// Public CORS-friendly fetch services, used only when the private edge
// function isn't available (demo mode, GitHub Pages before Supabase setup).
// Only the page ADDRESS is sent to the service, never any account data.
const PUBLIC_FETCHERS = [
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
];

async function fetchPageViaPublicService(url: string): Promise<string | null> {
  for (const build of PUBLIC_FETCHERS) {
    try {
      const res = await fetch(build(url), { signal: AbortSignal.timeout(12000) });
      if (res.ok) {
        const html = await res.text();
        if (html.length > 200) return html;
      }
    } catch {
      // blocked or down — try the next service
    }
  }
  return null;
}

/**
 * URL import prefers the private `import-recipe` Supabase Edge Function (the
 * browser can't fetch cross-origin recipe pages itself). Without it — demo
 * mode, or a deployment with no Supabase yet — it falls back to a public
 * fetch service and parses the page client-side.
 */
export async function importFromUrl(url: string): Promise<ImportResult> {
  if (!isDemo && isConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('import-recipe', { body: { url } });
      if (!error && data?.ok && data.draft) return { ok: true, draft: data.draft as RecipeDraft };
      if (!error && data?.reason === 'no_recipe') return { ok: false, reason: 'no_recipe' };
      // function missing or failed — fall through to the public service
    } catch {
      // fall through
    }
  }
  const html = await fetchPageViaPublicService(url);
  if (html) return importFromHtml(html, url);
  return { ok: false, reason: isDemo || !isConfigured ? 'unavailable' : 'fetch_failed' };
}

/** Client-side page parsing: JSON-LD -> microdata -> visible-text heuristics. */
export function importFromHtml(html: string, sourceUrl?: string): ImportResult {
  const viaJsonLd = draftFromHtml(html, sourceUrl);
  if (viaJsonLd) return { ok: true, draft: viaJsonLd };
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const node = extractMicrodataRecipe(doc);
    if (node) return { ok: true, draft: normalizeSchemaRecipe(node, sourceUrl) };
    const text = doc.body?.textContent?.trim();
    if (text && text.length > 40) {
      const draft = parseRecipeText(text);
      if (draft.ingredients.length >= 2) return { ok: true, draft: { ...draft, source_url: sourceUrl ?? null } };
    }
  } catch {
    // fall through
  }
  return { ok: false, reason: 'no_recipe' };
}

/** Caption / free-text import always "succeeds" — the editor is the safety net. */
export function importFromText(text: string): ImportResult {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: 'no_recipe' };
  return { ok: true, draft: parseRecipeText(trimmed) };
}

/** Payload handed over by the Chrome extension (raw JSON-LD block). */
export function importFromJsonLdPayload(json: string, sourceUrl?: string): ImportResult {
  try {
    const nodes = findRecipeNodes([JSON.parse(json)]);
    if (nodes.length) return { ok: true, draft: normalizeSchemaRecipe(nodes[0], sourceUrl) };
  } catch {
    // invalid payload
  }
  return { ok: false, reason: 'no_recipe' };
}
