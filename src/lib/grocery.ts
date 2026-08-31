import type { GroceryItem, NewGroceryItem, Recipe } from './types';
import { UNITS } from '../data/units';
import { aisleFor } from '../data/aisles';
import { normalizeName, parseIngredientLine } from './parse/ingredient';
import { scaleFactor } from './scale';

/** Scaled shopping items for a recipe (ranges shop the max, to be safe). */
export function recipeToGroceryItems(r: Recipe, targetServings?: number | null): NewGroceryItem[] {
  const f = scaleFactor(r.servings, targetServings ?? r.servings ?? 0);
  return r.ingredients
    .filter((i) => i.name.trim())
    .map((i) => {
      const rawQty = i.qtyMax ?? i.qty;
      const normalized = normalizeName(i.name);
      return {
        name: i.name,
        normalized_name: normalized,
        qty: rawQty != null ? rawQty * f : null,
        unit: i.unit,
        aisle: aisleFor(normalized),
        recipe_id: r.id,
        recipe_title: r.title,
      };
    });
}

/** Quick-add: parse a free-typed line ("2 כוסות קמח") into an item. */
export function quickAddItem(line: string): NewGroceryItem | null {
  const ing = parseIngredientLine(line);
  if (!ing.name.trim()) return null;
  const normalized = normalizeName(ing.name);
  return {
    name: ing.name,
    normalized_name: normalized,
    qty: ing.qtyMax ?? ing.qty,
    unit: ing.unit,
    aisle: aisleFor(normalized),
    recipe_id: null,
    recipe_title: null,
  };
}

function toBase(qty: number, unitId: string | null): { base: number; kind: string } | null {
  if (!unitId) return null;
  const def = UNITS[unitId];
  if (!def?.toBase) return null;
  return { base: qty * def.toBase, kind: def.kind };
}

export type MergeResult = {
  updates: { id: string; qty: number; unit: string | null }[];
  inserts: NewGroceryItem[];
};

/**
 * Merges incoming items into the existing list:
 * - same normalized name + same unit -> sum quantities
 * - same name + convertible units (cup+tbsp, kg+g) -> sum in the larger unit
 * - both without quantity -> dedupe (no insert)
 * - checked items are never merge targets (re-adding something you bought
 *   inserts a fresh unchecked row)
 */
export function mergeIncoming(existing: GroceryItem[], incoming: NewGroceryItem[]): MergeResult {
  const updates: MergeResult['updates'] = [];
  const inserts: NewGroceryItem[] = [];
  // work on a mutable view so two incoming items can stack onto one row
  const pool = existing.filter((e) => !e.checked).map((e) => ({ ...e }));

  for (const inc of incoming) {
    const candidates = pool.filter((e) => e.normalized_name === inc.normalized_name);
    let merged = false;
    for (const target of candidates) {
      if (inc.qty == null && target.qty == null) {
        merged = true; // dedupe
        break;
      }
      if (inc.qty == null || target.qty == null) continue;
      if (inc.unit === target.unit) {
        target.qty = target.qty + inc.qty;
        upsertUpdate(updates, target);
        merged = true;
        break;
      }
      const a = toBase(target.qty, target.unit);
      const b = toBase(inc.qty, inc.unit);
      if (a && b && a.kind === b.kind) {
        // sum in the larger of the two units
        const targetDef = UNITS[target.unit as string];
        const incDef = UNITS[inc.unit as string];
        const bigger = (targetDef.toBase ?? 0) >= (incDef.toBase ?? 0) ? targetDef : incDef;
        const sumBase = a.base + b.base;
        target.qty = Math.round((sumBase / (bigger.toBase as number)) * 100) / 100;
        target.unit = bigger.id;
        upsertUpdate(updates, target);
        merged = true;
        break;
      }
    }
    if (!merged) inserts.push(inc);
  }
  return { updates, inserts };
}

function upsertUpdate(updates: MergeResult['updates'], item: { id: string; qty: number | null; unit: string | null }) {
  const found = updates.find((u) => u.id === item.id);
  if (found) {
    found.qty = item.qty as number;
    found.unit = item.unit;
  } else {
    updates.push({ id: item.id, qty: item.qty as number, unit: item.unit });
  }
}
