import type { Lang, ParsedIngredient, UnitSystem } from './types';
import { unitLabel } from '../data/units';
import { convertQty } from './convert';

export function scaleFactor(base: number | null, target: number): number {
  if (!base || base <= 0 || !target || target <= 0) return 1;
  return target / base;
}

export function scaleIngredient(i: ParsedIngredient, f: number): ParsedIngredient {
  if (i.qty == null || f === 1) return i;
  return { ...i, qty: i.qty * f, qtyMax: i.qtyMax != null ? i.qtyMax * f : null };
}

const NICE_FRACTIONS: [number, string][] = [
  [0.125, '⅛'],
  [0.25, '¼'],
  [1 / 3, '⅓'],
  [0.375, '⅜'],
  [0.5, '½'],
  [0.625, '⅝'],
  [2 / 3, '⅔'],
  [0.75, '¾'],
  [0.875, '⅞'],
];

/** 0.5 -> '½', 1.5 -> '1½', 0.333 -> '⅓', 2 -> '2', 0.4 -> '0.4' */
export function formatQty(n: number): string {
  if (!Number.isFinite(n)) return '';
  const whole = Math.floor(n + 1e-9);
  const frac = n - whole;
  if (frac < 0.02) return String(whole || (n > 0 ? 0 : whole));
  if (frac > 0.98) return String(whole + 1);
  for (const [value, glyph] of NICE_FRACTIONS) {
    if (Math.abs(frac - value) <= 0.02) return whole ? `${whole}${glyph}` : glyph;
  }
  const rounded = Math.round(n * 10) / 10;
  return String(rounded);
}

export function formatQtyRange(qty: number, qtyMax: number | null): string {
  return qtyMax != null ? `${formatQty(qty)}–${formatQty(qtyMax)}` : formatQty(qty);
}

/**
 * Human string for one ingredient at a scale factor, optionally converted to a
 * unit system. Unparsed lines (qty == null) always render their raw text.
 */
export function displayIngredient(
  i: ParsedIngredient,
  f: number,
  lang: Lang,
  system: UnitSystem = 'original'
): string {
  if (i.qty == null) return i.raw;
  const scaled = scaleIngredient(i, f);
  let qty = scaled.qty as number;
  let qtyMax = scaled.qtyMax;
  let unit = scaled.unit;
  if (system !== 'original' && unit) {
    const conv = convertQty(qty, unit, system);
    if (conv) {
      qty = conv.qty;
      unit = conv.unit;
      qtyMax = qtyMax != null ? convertQty(qtyMax, scaled.unit as string, system)?.qty ?? qtyMax : null;
    }
  }
  const label = unitLabel(unit, qty, lang);
  const parts = [formatQtyRange(qty, qtyMax), label, i.name].filter(Boolean);
  const note = i.note ? `, ${i.note}` : '';
  return parts.join(' ') + note;
}
