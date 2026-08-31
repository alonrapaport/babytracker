import { describe, expect, it } from 'vitest';
import { displayIngredient, formatQty, scaleFactor, scaleIngredient } from '../scale';
import type { ParsedIngredient } from '../types';

const ing = (partial: Partial<ParsedIngredient>): ParsedIngredient => ({
  raw: '',
  qty: null,
  qtyMax: null,
  unit: null,
  name: '',
  note: null,
  group: null,
  ...partial,
});

describe('formatQty', () => {
  const cases: [number, string][] = [
    [0.5, '½'],
    [1.5, '1½'],
    [1 / 3, '⅓'],
    [0.25, '¼'],
    [0.75, '¾'],
    [2, '2'],
    [2.5, '2½'],
    [0.4, '0.4'],
    [3.0000001, '3'],
    [0.66, '⅔'],
  ];
  for (const [n, s] of cases) {
    it(`${n} -> ${s}`, () => expect(formatQty(n)).toBe(s));
  }
});

describe('scaleFactor / scaleIngredient', () => {
  it('computes the ratio and guards nulls', () => {
    expect(scaleFactor(2, 4)).toBe(2);
    expect(scaleFactor(null, 4)).toBe(1);
    expect(scaleFactor(0, 4)).toBe(1);
  });

  it('scales qty and ranges, passes through unparsed', () => {
    const scaled = scaleIngredient(ing({ qty: 1, qtyMax: 2 }), 2);
    expect(scaled.qty).toBe(2);
    expect(scaled.qtyMax).toBe(4);
    const rawOnly = ing({ raw: 'לפי הטעם', qty: null });
    expect(scaleIngredient(rawOnly, 3)).toBe(rawOnly);
  });
});

describe('displayIngredient', () => {
  it('renders Hebrew scaled lines ("2 ביצים" -> "4 ביצים")', () => {
    const eggs = ing({ raw: '2 ביצים', qty: 2, name: 'ביצים' });
    expect(displayIngredient(eggs, 2, 'he')).toBe('4 ביצים');
  });

  it('pluralizes Hebrew units (כף -> כפות)', () => {
    const oil = ing({ qty: 1, unit: 'tbsp', name: 'שמן זית' });
    expect(displayIngredient(oil, 1, 'he')).toBe('1 כף שמן זית');
    expect(displayIngredient(oil, 3, 'he')).toBe('3 כפות שמן זית');
  });

  it('renders ranges and notes', () => {
    const honey = ing({ qty: 1, qtyMax: 2, unit: 'tbsp', name: 'דבש', note: 'אמיתי' });
    expect(displayIngredient(honey, 2, 'he')).toBe('2–4 כפות דבש, אמיתי');
  });

  it('falls back to raw for unparsed lines', () => {
    const raw = ing({ raw: 'מלח ופלפל לפי הטעם', qty: null, name: 'מלח ופלפל לפי הטעם' });
    expect(displayIngredient(raw, 5, 'he')).toBe('מלח ופלפל לפי הטעם');
  });

  it('converts cups to metric on demand', () => {
    const flour = ing({ qty: 1, unit: 'cup', name: 'flour' });
    expect(displayIngredient(flour, 1, 'en', 'metric')).toBe('240 ml flour');
  });
});
