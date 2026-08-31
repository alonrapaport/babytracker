import type { RecipeDraft, Step } from '../types';
import { unitFor } from '../../data/units';
import {
  parseIngredientBlock,
  parseQuantity,
  stripStepPrefix,
  stripSymbolBullet,
} from './ingredient';

// Deterministic parser for Instagram/TikTok captions, notes-app exports and
// any pasted plain text — Hebrew and English. No AI: header keywords, bullet
// shapes and quantity-leading lines. The recipe editor is the safety net for
// whatever this gets wrong.

const ING_HEADERS = new Set([
  'ingredients', 'ingredient', 'whatyoullneed', 'whatyouneed', 'whatyoullneedis', 'shoppinglist', 'youllneed', 'youneed',
  'מצרכים', 'רכיבים', 'מרכיבים', 'חומרים', 'החומרים', 'המצרכים', 'הרכיבים', 'מהצריך', 'מהשצריך',
]);
const STEP_HEADERS = new Set([
  'instructions', 'directions', 'method', 'steps', 'preparation', 'howtomake', 'howto', 'process',
  'הוראות', 'הוראותהכנה', 'אופןהכנה', 'אופןההכנה', 'הכנה', 'ההכנה', 'שלביהכנה', 'שלביההכנה', 'אופןהכנתהמנה',
]);

function headerKey(line: string): string {
  // strip everything that isn't a letter so "🛒 INGREDIENTS:" matches
  return line.replace(/[^\p{L}]/gu, '').toLowerCase();
}

export function looksLikeIngredient(rawLine: string): boolean {
  const line = stripSymbolBullet(rawLine.trim());
  if (!line || line.length > 120) return false;
  const { qty, rest } = parseQuantity(line);
  if (qty != null) return true;
  const first = rest.match(/^([^\s,()]+)/);
  if (first && unitFor(first[1])) return true;
  // bullet + short phrase counts too ("- olive oil")
  const hadBullet = rawLine.trim() !== line;
  return hadBullet && line.split(/\s+/).length <= 6 && !/[.!?]$/.test(line);
}

function scrapeServings(text: string): number | null {
  const patterns = [
    /(?:serves|serving[s]?|makes|yields?)\s*[:\-]?\s*(\d+)/i,
    /ל[-\s]?(\d+)\s*מנות/,
    /(\d+)\s*מנות/,
    /יוצא(?:ות)?\s*[כ-]?\s*(\d+)/,
    /מספיק ל[-\s]?(\d+)/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const n = Number(m[1]);
      if (n > 0 && n <= 100) return n;
    }
  }
  return null;
}

function scrapeHashtags(text: string): string[] {
  const out: string[] = [];
  const re = /#([\p{L}\p{N}_]+)/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) && out.length < 6) {
    const t = m[1].toLowerCase();
    if (!out.includes(t)) out.push(t);
  }
  return out;
}

const HEBREW_RE = /[֐-׿]/;

export function parseRecipeText(text: string): RecipeDraft {
  const lines = text.split(/\r?\n/).map((l) => l.trim());

  let ingHeaderIdx = -1;
  let stepHeaderIdx = -1;
  lines.forEach((line, i) => {
    const key = headerKey(line);
    if (!key || line.length > 40) return;
    if (ingHeaderIdx === -1 && ING_HEADERS.has(key)) ingHeaderIdx = i;
    else if (stepHeaderIdx === -1 && STEP_HEADERS.has(key)) stepHeaderIdx = i;
  });

  let ingLines: string[] = [];
  let stepLines: string[] = [];
  let preLines: string[] = [];

  if (ingHeaderIdx !== -1 && stepHeaderIdx !== -1) {
    const [a, b] = [Math.min(ingHeaderIdx, stepHeaderIdx), Math.max(ingHeaderIdx, stepHeaderIdx)];
    const firstIsIng = ingHeaderIdx < stepHeaderIdx;
    preLines = lines.slice(0, a);
    const mid = lines.slice(a + 1, b);
    const tail = lines.slice(b + 1);
    ingLines = firstIsIng ? mid : tail;
    stepLines = firstIsIng ? tail : mid;
  } else if (ingHeaderIdx !== -1) {
    preLines = lines.slice(0, ingHeaderIdx);
    const after = lines.slice(ingHeaderIdx + 1);
    // ingredients until the lines stop looking like ingredients
    let split = after.length;
    for (let i = 0; i < after.length; i++) {
      const l = after[i];
      if (!l) continue;
      if (!looksLikeIngredient(l) && stripStepPrefix(l).length > 25) {
        split = i;
        break;
      }
    }
    ingLines = after.slice(0, split);
    stepLines = after.slice(split);
  } else {
    // headerless: find the longest contiguous run of ingredient-looking lines
    let bestStart = -1;
    let bestLen = 0;
    let start = -1;
    let len = 0;
    lines.forEach((l, i) => {
      if (l && looksLikeIngredient(l)) {
        if (start === -1) start = i;
        len++;
        if (len > bestLen) {
          bestLen = len;
          bestStart = start;
        }
      } else if (l) {
        start = -1;
        len = 0;
      }
    });
    if (bestLen >= 2) {
      preLines = lines.slice(0, bestStart);
      ingLines = lines.slice(bestStart, bestStart + bestLen);
      stepLines = lines.slice(bestStart + bestLen);
    } else {
      preLines = lines.slice(0, 1);
      stepLines = lines.slice(1);
    }
  }

  const isMetaLine = (l: string) =>
    /^#/.test(l) ||
    (l.length <= 30 && (scrapeServings(l) != null || /follow|עקבו|לינק בביו|link in bio/i.test(l)));

  const ingredients = parseIngredientBlock(ingLines.join('\n'));
  const steps: Step[] = stepLines
    .map((l) => stripStepPrefix(l))
    .filter((l) => l && !isMetaLine(l))
    .map((text_) => ({ text: text_, group: null }));

  const preClean = preLines.map((l) => stripSymbolBullet(l)).filter(Boolean);
  const title = (preClean[0] ?? '').replace(/[#*_~]/g, '').trim() || 'Recipe';
  const description = preClean.slice(1).join('\n') || null;

  const confidence = ingHeaderIdx !== -1 && stepHeaderIdx !== -1 ? 'high' : ingHeaderIdx !== -1 || stepHeaderIdx !== -1 ? 'medium' : 'low';

  return {
    title,
    description,
    image_url: null,
    source_url: null,
    source_name: null,
    prep_min: null,
    cook_min: null,
    total_min: null,
    servings: scrapeServings(text),
    ingredients,
    steps,
    notes: null,
    tags: scrapeHashtags(text),
    nutrition: null,
    lang: HEBREW_RE.test(text) ? 'he' : 'en',
    confidence,
  };
}
