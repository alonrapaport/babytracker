import type { RecipeDraft } from './types';
import { supabase, isConfigured } from './supabase';
import { isDemo } from './demo';
import { draftFromHtml, findRecipeNodes, normalizeSchemaRecipe } from './parse/jsonld';
import { extractMicrodataRecipe } from './parse/microdata';
import { parseRecipeText } from './parse/text';

export type ImportResult =
  | { ok: true; draft: RecipeDraft }
  | { ok: false; reason: 'unavailable' | 'fetch_failed' | 'no_recipe' };

/**
 * URL import goes through the `import-recipe` Supabase Edge Function (the
 * browser can't fetch cross-origin recipe pages itself). In demo mode or
 * before the function is deployed the UI steers users to the paste tabs.
 */
export async function importFromUrl(url: string): Promise<ImportResult> {
  if (isDemo || !isConfigured) return { ok: false, reason: 'unavailable' };
  try {
    const { data, error } = await supabase.functions.invoke('import-recipe', { body: { url } });
    if (error) return { ok: false, reason: 'fetch_failed' };
    if (data?.ok && data.draft) return { ok: true, draft: data.draft as RecipeDraft };
    return { ok: false, reason: (data?.reason as 'no_recipe') ?? 'no_recipe' };
  } catch {
    return { ok: false, reason: 'fetch_failed' };
  }
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
