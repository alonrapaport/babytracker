import type { Nutrition, ParsedIngredient, RecipeDraft, Step } from '../types';
import { parseIngredientLine } from './ingredient';
import { parseIsoDurationMin } from './duration';

// String-in / draft-out and dependency-free on purpose: this module is shared
// verbatim with the Supabase edge function (scripts/sync-edge.mjs).

const ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#34;': '"',
  '&#39;': "'", '&apos;': "'", '&nbsp;': ' ', '&ndash;': '–', '&mdash;': '—',
  '&frac12;': '½', '&frac14;': '¼', '&frac34;': '¾', '&deg;': '°',
};

export function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&[a-z0-9#]+;/gi, (e) => ENTITIES[e.toLowerCase()] ?? ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    let txt = m[1].trim();
    txt = txt
      .replace(/^\s*<!--/, '')
      .replace(/-->\s*$/, '')
      .replace(/^\s*\/\*\s*<!\[CDATA\[\s*\*\//, '')
      .replace(/\/\*\s*\]\]>\s*\*\/\s*$/, '')
      .replace(/^\s*<!\[CDATA\[/, '')
      .replace(/\]\]>\s*$/, '');
    try {
      blocks.push(JSON.parse(txt));
    } catch {
      // broken block — skip, never throw
    }
  }
  return blocks;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function findRecipeNodes(blocks: unknown[]): any[] {
  const out: any[] = [];
  const seen = new Set<any>();
  const visit = (node: any) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    const t = node['@type'];
    const types = Array.isArray(t) ? t : t ? [t] : [];
    if (types.some((x: unknown) => typeof x === 'string' && x.toLowerCase() === 'recipe')) out.push(node);
    if (node['@graph']) visit(node['@graph']);
    if (node.mainEntity) visit(node.mainEntity);
    if (node.mainEntityOfPage && typeof node.mainEntityOfPage === 'object') visit(node.mainEntityOfPage);
  };
  blocks.forEach(visit);
  return out;
}

function asText(v: any): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return stripHtml(v) || null;
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return asText(v[0]);
  if (typeof v === 'object') return asText(v.name ?? v['@value'] ?? v.text ?? null);
  return null;
}

function firstImageUrl(v: any): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v || null;
  if (Array.isArray(v)) {
    for (const item of v) {
      const u = firstImageUrl(item);
      if (u) return u;
    }
    return null;
  }
  if (typeof v === 'object') return firstImageUrl(v.url ?? v.contentUrl ?? null);
  return null;
}

export function parseYield(v: any): number | null {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v > 0 ? v : null;
  if (Array.isArray(v)) {
    for (const item of v) {
      const n = parseYield(item);
      if (n) return n;
    }
    return null;
  }
  if (typeof v === 'string') {
    const m = v.match(/\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : null;
  }
  if (typeof v === 'object') return parseYield(v.value ?? v.name ?? null);
  return null;
}

function numericPrefix(v: any): number | null {
  const s = asText(v);
  if (!s) return null;
  const m = s.match(/-?\d+(?:[.,]\d+)?/);
  return m ? Number(m[0].replace(',', '.')) : null;
}

function parseNutrition(v: any): Nutrition | null {
  if (!v || typeof v !== 'object') return null;
  const n: Nutrition = {
    calories: numericPrefix(v.calories),
    protein: numericPrefix(v.proteinContent),
    carbs: numericPrefix(v.carbohydrateContent),
    fat: numericPrefix(v.fatContent),
  };
  return n.calories == null && n.protein == null && n.carbs == null && n.fat == null ? null : n;
}

function collectSteps(v: any, group: string | null, out: Step[]): void {
  if (v == null) return;
  if (typeof v === 'string') {
    const text = stripHtml(v);
    for (const piece of splitInstructionText(text)) out.push({ text: piece, group });
    return;
  }
  if (Array.isArray(v)) {
    v.forEach((item) => collectSteps(item, group, out));
    return;
  }
  if (typeof v === 'object') {
    const t = String(Array.isArray(v['@type']) ? v['@type'][0] : v['@type'] ?? '').toLowerCase();
    if (t === 'howtosection') {
      const name = asText(v.name);
      collectSteps(v.itemListElement, name ?? group, out);
      return;
    }
    if (v.itemListElement) {
      collectSteps(v.itemListElement, group, out);
      return;
    }
    const text = asText(v.text ?? v.name);
    if (text) out.push({ text, group });
  }
}

function splitInstructionText(text: string): string[] {
  const byLine = text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (byLine.length > 1) return byLine;
  const single = byLine[0] ?? '';
  if (single.length <= 300) return single ? [single] : [];
  // one huge paragraph: split on sentence boundaries followed by a capital/Hebrew letter
  return single
    .split(/(?<=\.)\s+(?=[A-ZА-Я֐-׿])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toIngredients(v: any): ParsedIngredient[] {
  const arr = Array.isArray(v) ? v : v != null ? [v] : [];
  const out: ParsedIngredient[] = [];
  for (const item of arr) {
    const s = asText(item);
    if (s) out.push(parseIngredientLine(s));
  }
  return out;
}

function toTags(node: any): string[] {
  const raw: string[] = [];
  const push = (v: any) => {
    if (v == null) return;
    if (Array.isArray(v)) return v.forEach(push);
    const s = asText(v);
    if (!s) return;
    s.split(',').forEach((piece) => raw.push(piece.trim()));
  };
  push(node.keywords);
  push(node.recipeCuisine);
  push(node.recipeCategory);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of raw) {
    const t = tag.toLowerCase().trim();
    if (!t || t.length > 30 || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= 8) break;
  }
  return out;
}

const HEBREW_RE = /[֐-׿]/;

export function normalizeSchemaRecipe(node: any, sourceUrl?: string): RecipeDraft {
  const title = asText(node.name) ?? 'Recipe';
  const prep = parseIsoDurationMin(node.prepTime);
  const cook = parseIsoDurationMin(node.cookTime);
  const total = parseIsoDurationMin(node.totalTime) ?? (prep != null || cook != null ? (prep ?? 0) + (cook ?? 0) : null);
  const steps: Step[] = [];
  collectSteps(node.recipeInstructions ?? node.instructions, null, steps);
  const author = asText(node.author);
  let sourceName = author;
  if (!sourceName && sourceUrl) {
    try {
      sourceName = new URL(sourceUrl).hostname.replace(/^www\./, '');
    } catch {
      sourceName = null;
    }
  }
  const inLang = asText(node.inLanguage) ?? '';
  const lang = inLang.toLowerCase().startsWith('he') || HEBREW_RE.test(title) ? 'he' : 'en';
  return {
    title,
    description: asText(node.description),
    image_url: firstImageUrl(node.image),
    source_url: sourceUrl ?? asText(node.url),
    source_name: sourceName,
    prep_min: prep,
    cook_min: cook,
    total_min: total,
    servings: parseYield(node.recipeYield ?? node.yield),
    ingredients: toIngredients(node.recipeIngredient ?? node.ingredients),
    steps,
    notes: null,
    tags: toTags(node),
    nutrition: parseNutrition(node.nutrition),
    lang,
    confidence: 'high',
  };
}

/** JSON-LD only (no DOM needed). Returns null when the page has no Recipe. */
export function draftFromHtml(html: string, sourceUrl?: string): RecipeDraft | null {
  const nodes = findRecipeNodes(extractJsonLdBlocks(html));
  if (!nodes.length) return null;
  // prefer the node with the most ingredients
  const best = nodes
    .map((n) => normalizeSchemaRecipe(n, sourceUrl))
    .sort((a, b) => b.ingredients.length - a.ingredients.length)[0];
  return best.ingredients.length || best.steps.length ? best : null;
}
