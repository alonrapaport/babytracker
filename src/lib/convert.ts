import { UNITS } from '../data/units';

// Metric <-> US-customary display conversion (ReciMe's "change recipe
// measurements between standard and metric"). Count units pass through.

type Converted = { qty: number; unit: string };

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function convertQty(qty: number, unitId: string, target: 'metric' | 'us'): Converted | null {
  const def = UNITS[unitId];
  if (!def || !def.toBase || def.kind === 'count') return null;
  const base = qty * def.toBase; // ml or g

  if (def.kind === 'volume') {
    if (target === 'metric') {
      if (unitId === 'ml' || unitId === 'l') return null; // already metric
      return base >= 1000 ? { qty: round1(base / 1000), unit: 'l' } : { qty: Math.round(base), unit: 'ml' };
    }
    if (unitId === 'cup' || unitId === 'tbsp' || unitId === 'tsp') return null; // already US-style
    const cups = base / 240;
    if (cups >= 0.24) {
      const quarterCups = Math.round(cups * 4) / 4;
      return { qty: quarterCups >= 0.25 ? quarterCups : round1(cups), unit: 'cup' };
    }
    const tbsp = base / 15;
    if (tbsp >= 0.9) return { qty: round1(tbsp), unit: 'tbsp' };
    return { qty: round1(base / 5), unit: 'tsp' };
  }

  // mass
  if (target === 'metric') {
    if (unitId === 'g' || unitId === 'kg') return null;
    return base >= 1000 ? { qty: round1(base / 1000), unit: 'kg' } : { qty: Math.round(base), unit: 'g' };
  }
  if (unitId === 'oz' || unitId === 'lb') return null;
  const lbs = base / 453.6;
  if (lbs >= 0.95) return { qty: round1(lbs), unit: 'lb' };
  return { qty: round1(base / 28.35), unit: 'oz' };
}
