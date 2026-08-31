import type { Nutrition, ParsedIngredient } from './types';
import { FOODS, ZERO_CAL_NAMES, type FoodDef } from '../data/nutrition';
import { UNITS } from '../data/units';
import { normalizeName } from './parse/ingredient';

// Deterministic per-serving nutrition estimation ("calculate calories for
// every recipe" without any AI or API): parsed quantities are converted to
// grams (mass directly, volume via per-food density, count via per-unit
// weight), multiplied by per-100g USDA-style values and summed.

type Matcher = { key: string; def: FoodDef };

// longest match name wins, so "סוכר חום" beats "סוכר". Hebrew feminine nouns
// pluralize ה -> ות (בננה -> בננות), so those get an automatic plural variant.
const MATCHERS: Matcher[] = FOODS.flatMap((def) =>
  def.names.flatMap((name) => {
    const key = normalizeName(name);
    const variants = key.endsWith('ה') ? [key, `${key.slice(0, -1)}ות`] : [key];
    return variants.map((v) => ({ key: v, def }));
  })
).sort((a, b) => b.key.length - a.key.length);

function findFood(normalized: string): FoodDef | null {
  for (const m of MATCHERS) {
    if (normalized.includes(m.key)) return m.def;
  }
  return null;
}

function gramsFor(ing: ParsedIngredient, def: FoodDef): number | null {
  const qty = ing.qtyMax != null && ing.qty != null ? (ing.qty + ing.qtyMax) / 2 : ing.qty;
  if (qty == null || qty <= 0) return null;
  const unit = ing.unit ? UNITS[ing.unit] : null;

  if (unit?.kind === 'mass' && unit.toBase) return qty * unit.toBase;
  if (unit?.kind === 'volume' && unit.toBase) {
    const ml = qty * unit.toBase;
    const gPerMl = def.gPerCup != null ? def.gPerCup / 240 : 1; // watery default
    return ml * gPerMl;
  }
  // count units
  if (ing.unit === 'clove') return qty * 5;
  if (ing.unit === 'pinch') return qty * 0.4;
  if (ing.unit === 'slice') return qty * (def.gPerUnit ?? 30);
  if (ing.unit === 'can' || ing.unit === 'pkg') return qty * (def.gPerUnit ?? 400);
  if (ing.unit === 'bunch') return qty * (def.gPerUnit ?? 60);
  // bare count ("2 ביצים", "1 בצל")
  if (def.gPerUnit != null) return qty * def.gPerUnit;
  return null;
}

export type NutritionEstimate = {
  nutrition: Nutrition;
  /** 0-100: share of ingredient lines the estimator understood */
  coveragePct: number;
  matched: number;
  total: number;
};

export function estimateNutrition(ingredients: ParsedIngredient[], servings: number | null): NutritionEstimate | null {
  const lines = ingredients.filter((i) => i.name.trim());
  if (!lines.length) return null;

  let cal = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let matched = 0;

  for (const ing of lines) {
    const normalized = normalizeName(ing.name);
    const def = findFood(normalized);
    const grams = def ? gramsFor(ing, def) : null;
    if (def && grams != null) {
      cal += (def.per100g.cal * grams) / 100;
      protein += (def.per100g.protein * grams) / 100;
      carbs += (def.per100g.carbs * grams) / 100;
      fat += (def.per100g.fat * grams) / 100;
      matched++;
      continue;
    }
    if (ZERO_CAL_NAMES.some((z) => normalized.includes(normalizeName(z)))) {
      matched++; // counted as understood, contributes ~0
    }
  }

  const per = servings && servings > 0 ? servings : 1;
  return {
    nutrition: {
      calories: Math.round(cal / per),
      protein: Math.round((protein / per) * 10) / 10,
      carbs: Math.round((carbs / per) * 10) / 10,
      fat: Math.round((fat / per) * 10) / 10,
    },
    coveragePct: Math.round((matched / lines.length) * 100),
    matched,
    total: lines.length,
  };
}

/** Coverage bar for auto-filling on import: below this we don't guess. */
export const AUTO_ESTIMATE_MIN_COVERAGE = 60;
