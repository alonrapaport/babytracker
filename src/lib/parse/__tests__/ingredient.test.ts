import { describe, expect, it } from 'vitest';
import { normalizeName, parseIngredientBlock, parseIngredientLine, parseQuantity } from '../ingredient';

describe('parseQuantity', () => {
  const cases: [string, number | null, number | null][] = [
    ['1 cup flour', 1, null],
    ['1.5 cups', 1.5, null],
    ['1,5 ליטר מים', 1.5, null],
    ['½ cup sugar', 0.5, null],
    ['1½ cups milk', 1.5, null],
    ['1 1/2 cups milk', 1.5, null],
    ['3/4 cup', 0.75, null],
    ['1-2 tbsp oil', 1, 2],
    ['2–3 שיני שום', 2, 3],
    ['1 to 2 lemons', 1, 2],
    ['1 עד 2 כפות דבש', 1, 2],
    ['חצי כוס סוכר', 0.5, null],
    ['רבע כפית מלח', 0.25, null],
    ['שליש כוס שמן', 1 / 3, null],
    ['שלושת רבעי כוס קמח', 0.75, null],
    ['no numbers here', null, null],
  ];
  for (const [input, qty, qtyMax] of cases) {
    it(`parses "${input}"`, () => {
      const r = parseQuantity(input);
      if (qty == null) expect(r.qty).toBeNull();
      else expect(r.qty).toBeCloseTo(qty, 3);
      if (qtyMax == null) expect(r.qtyMax).toBeNull();
      else expect(r.qtyMax).toBeCloseTo(qtyMax, 3);
    });
  }
});

describe('parseIngredientLine — English', () => {
  it('parses qty + unit + name + note', () => {
    const r = parseIngredientLine('1 1/2 cups all-purpose flour, sifted');
    expect(r.qty).toBeCloseTo(1.5);
    expect(r.unit).toBe('cup');
    expect(r.name).toBe('all-purpose flour');
    expect(r.note).toBe('sifted');
    expect(r.raw).toBe('1 1/2 cups all-purpose flour, sifted');
  });

  it('parses count items without a unit', () => {
    const r = parseIngredientLine('2 eggs');
    expect(r).toMatchObject({ qty: 2, unit: null, name: 'eggs' });
  });

  it('parses ranges', () => {
    const r = parseIngredientLine('1-2 tbsp olive oil');
    expect(r).toMatchObject({ qty: 1, qtyMax: 2, unit: 'tbsp', name: 'olive oil' });
  });

  it('parses "pinch of salt" with implicit qty', () => {
    const r = parseIngredientLine('pinch of salt');
    expect(r).toMatchObject({ qty: 1, unit: 'pinch', name: 'salt' });
  });

  it('extracts a leading parenthetical as a note', () => {
    const r = parseIngredientLine('1 (400g) can crushed tomatoes');
    expect(r).toMatchObject({ qty: 1, unit: 'can', name: 'crushed tomatoes', note: '400g' });
  });

  it('extracts a parenthetical after the unit', () => {
    const r = parseIngredientLine('1 cup (240ml) warm water');
    expect(r).toMatchObject({ qty: 1, unit: 'cup', name: 'warm water', note: '240ml' });
  });

  it('keeps unparseable lines whole and raw', () => {
    const r = parseIngredientLine('a generous glug of love');
    expect(r.qty).toBeNull();
    expect(r.name).toBe('a generous glug of love');
  });

  it('strips emoji bullets', () => {
    const r = parseIngredientLine('🧅 1 red onion, diced');
    expect(r).toMatchObject({ qty: 1, name: 'red onion', note: 'diced' });
  });
});

describe('parseIngredientLine — Hebrew', () => {
  it('parses unit-first Hebrew ("2 כוסות קמח")', () => {
    const r = parseIngredientLine('2 כוסות קמח');
    expect(r).toMatchObject({ qty: 2, unit: 'cup', name: 'קמח' });
  });

  it('parses "½ כפית מלח"', () => {
    const r = parseIngredientLine('½ כפית מלח');
    expect(r.qty).toBeCloseTo(0.5);
    expect(r.unit).toBe('tsp');
    expect(r.name).toBe('מלח');
  });

  it('parses garlic-clove ranges ("2-3 שיני שום קצוצות")', () => {
    const r = parseIngredientLine('2-3 שיני שום קצוצות');
    expect(r).toMatchObject({ qty: 2, qtyMax: 3, unit: 'clove', name: 'שום קצוצות' });
  });

  it('parses grams ("100 גרם חמאה רכה")', () => {
    const r = parseIngredientLine('100 גרם חמאה רכה');
    expect(r).toMatchObject({ qty: 100, unit: 'g', name: 'חמאה רכה' });
  });

  it('parses gershayim kilos ("1 ק"ג עגבניות")', () => {
    const r = parseIngredientLine('1 ק"ג עגבניות');
    expect(r).toMatchObject({ qty: 1, unit: 'kg', name: 'עגבניות' });
  });

  it('parses Hebrew fraction words ("חצי כוס סוכר")', () => {
    const r = parseIngredientLine('חצי כוס סוכר');
    expect(r.qty).toBeCloseTo(0.5);
    expect(r.unit).toBe('cup');
    expect(r.name).toBe('סוכר');
  });

  it('parses comma decimals ("1,5 ליטר מים")', () => {
    const r = parseIngredientLine('1,5 ליטר מים');
    expect(r.qty).toBeCloseTo(1.5);
    expect(r.unit).toBe('l');
    expect(r.name).toBe('מים');
  });

  it('parses dash notes ("2 כוסות קמח - מנופה")', () => {
    const r = parseIngredientLine('2 כוסות קמח - מנופה');
    expect(r).toMatchObject({ qty: 2, unit: 'cup', name: 'קמח', note: 'מנופה' });
  });

  it('falls back to raw for reversed lines ("קמח - 2 כוסות")', () => {
    const r = parseIngredientLine('קמח - 2 כוסות');
    expect(r.qty).toBeNull();
    expect(r.name).toBe('קמח - 2 כוסות');
  });

  it('parses tablespoon plurals ("3 כפות שמן זית")', () => {
    const r = parseIngredientLine('3 כפות שמן זית');
    expect(r).toMatchObject({ qty: 3, unit: 'tbsp', name: 'שמן זית' });
  });
});

describe('parseIngredientBlock', () => {
  it('tracks group headers in Hebrew and English', () => {
    const block = ['לרוטב:', '2 כפות טחינה', 'מיץ מחצי לימון', 'For the salad:', '2 tomatoes'].join('\n');
    const items = parseIngredientBlock(block);
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ group: 'לרוטב', unit: 'tbsp' });
    expect(items[1].group).toBe('לרוטב');
    expect(items[2]).toMatchObject({ group: 'For the salad', qty: 2 });
  });

  it('skips blank lines and strips bullets', () => {
    const items = parseIngredientBlock('- 1 cup rice\n\n• 2 cups water');
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ qty: 1, unit: 'cup', name: 'rice' });
  });
});

describe('normalizeName', () => {
  it('lowercases, de-plurals English and strips punctuation', () => {
    expect(normalizeName('Tomatoes')).toBe('tomatoe');
    expect(normalizeName('Eggs!')).toBe('egg');
    expect(normalizeName('קמח לבן')).toBe('קמח לבן');
    expect(normalizeName('  שמן   זית ')).toBe('שמן זית');
  });

  it('is a stable merge key for the same word', () => {
    expect(normalizeName('eggs')).toBe(normalizeName('Eggs'));
    expect(normalizeName('עגבניות')).toBe(normalizeName('עגבניות'));
  });
});
