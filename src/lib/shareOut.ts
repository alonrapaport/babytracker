import type { GroceryItem, Lang, Recipe } from './types';
import type { Dict } from '../i18n/en';
import en from '../i18n/en';
import he from '../i18n/he';
import { displayIngredient } from './scale';
import { unitLabel } from '../data/units';
import { formatQtyRange } from './scale';

const dicts: Record<Lang, Dict> = { en, he };

/** Formatted plain-text version of a recipe (for WhatsApp/SMS/email). */
export function recipeToShareText(r: Recipe, lang: Lang): string {
  const d = dicts[lang];
  const lines: string[] = [`🍴 ${r.title}`];
  if (r.description) lines.push(r.description);
  if (r.servings) lines.push(`${d.share_servings}: ${r.servings}`);
  lines.push('', `${d.share_ingredients}:`);
  let group: string | null = null;
  for (const ing of r.ingredients) {
    if (ing.group && ing.group !== group) {
      lines.push(`— ${ing.group} —`);
    }
    group = ing.group;
    lines.push(`• ${displayIngredient(ing, 1, lang)}`);
  }
  lines.push('', `${d.share_steps}:`);
  r.steps.forEach((s, i) => lines.push(`${i + 1}. ${s.text}`));
  if (r.notes) lines.push('', r.notes);
  if (r.source_url) lines.push('', `${d.share_source}: ${r.source_url}`);
  return lines.join('\n');
}

export function groceryListToText(items: GroceryItem[], lang: Lang, aisleName: (aisle: string) => string): string {
  const open = items.filter((i) => !i.checked);
  const byAisle = new Map<string, GroceryItem[]>();
  for (const item of open) {
    const list = byAisle.get(item.aisle) ?? [];
    list.push(item);
    byAisle.set(item.aisle, list);
  }
  const lines: string[] = ['🛒'];
  for (const [aisle, list] of byAisle) {
    lines.push('', `${aisleName(aisle)}:`);
    for (const item of list) {
      const qty = item.qty != null ? `${formatQtyRange(item.qty, null)} ${unitLabel(item.unit, item.qty, lang)}`.trim() : '';
      lines.push(`▢ ${item.name}${qty ? ` — ${qty}` : ''}`);
    }
  }
  return lines.join('\n');
}

/** navigator.share when available, clipboard otherwise. */
export async function shareText(title: string, text: string): Promise<'shared' | 'copied'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch {
      // user cancelled or share failed — fall through to clipboard
    }
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}
