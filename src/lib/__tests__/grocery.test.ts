import { describe, expect, it } from 'vitest';
import { mergeIncoming, quickAddItem, recipeToGroceryItems } from '../grocery';
import { aisleFor } from '../../data/aisles';
import type { GroceryItem, Recipe } from '../types';

const existing = (partial: Partial<GroceryItem>): GroceryItem => ({
  id: 'x1',
  user_id: 'u',
  name: '',
  normalized_name: '',
  qty: null,
  unit: null,
  aisle: 'other',
  recipe_id: null,
  recipe_title: null,
  checked: false,
  created_at: '',
  ...partial,
});

describe('aisleFor (he + en)', () => {
  const cases: [string, string][] = [
    ['קמח', 'dry_goods'],
    ['עגבניות מרוסקות', 'canned'],
    ['פלפל שחור', 'spices'],
    ['פלפל אדום', 'produce'],
    ['בצל', 'produce'],
    ['שמן זית', 'condiments'],
    ['חלב', 'dairy_eggs'],
    ['ביצים', 'dairy_eggs'],
    ['חזה עוף', 'meat_fish'],
    ['chicken breast', 'meat_fish'],
    ['milk', 'dairy_eggs'],
    ['black pepper', 'spices'],
    ['crushed tomatoes', 'canned'],
    ['mystery thing', 'other'],
  ];
  for (const [name, aisle] of cases) {
    it(`${name} -> ${aisle}`, () => expect(aisleFor(name)).toBe(aisle));
  }
});

describe('quickAddItem', () => {
  it('parses a Hebrew quick-add line', () => {
    const item = quickAddItem('2 כוסות קמח')!;
    expect(item).toMatchObject({ qty: 2, unit: 'cup', aisle: 'dry_goods' });
    expect(item.normalized_name).toBe('קמח');
  });
  it('parses plain names', () => {
    const item = quickAddItem('חלב')!;
    expect(item).toMatchObject({ qty: null, aisle: 'dairy_eggs', name: 'חלב' });
  });
});

describe('recipeToGroceryItems', () => {
  const recipe = {
    id: 'r1',
    title: 'עוגה',
    servings: 2,
    ingredients: [
      { raw: '1.5 כוסות קמח', qty: 1.5, qtyMax: null, unit: 'cup', name: 'קמח', note: null, group: null },
      { raw: '1-2 בננות', qty: 1, qtyMax: 2, unit: null, name: 'בננות', note: null, group: null },
      { raw: 'קורט מלח', qty: 1, qtyMax: null, unit: 'pinch', name: 'מלח', note: null, group: null },
    ],
  } as unknown as Recipe;

  it('scales to target servings and shops the max of ranges', () => {
    const items = recipeToGroceryItems(recipe, 4);
    expect(items[0]).toMatchObject({ qty: 3, unit: 'cup', aisle: 'dry_goods', recipe_id: 'r1' });
    expect(items[1].qty).toBe(4); // max of the range, doubled
    expect(items[2]).toMatchObject({ aisle: 'spices' });
  });
});

describe('mergeIncoming', () => {
  it('sums same name + same unit', () => {
    const res = mergeIncoming(
      [existing({ id: 'a', normalized_name: 'קמח', qty: 2, unit: 'cup' })],
      [{ name: 'קמח', normalized_name: 'קמח', qty: 1.5, unit: 'cup', aisle: 'dry_goods', recipe_id: null, recipe_title: null }]
    );
    expect(res.updates).toEqual([{ id: 'a', qty: 3.5, unit: 'cup' }]);
    expect(res.inserts).toHaveLength(0);
  });

  it('converts compatible units and sums in the larger one', () => {
    const res = mergeIncoming(
      [existing({ id: 'b', normalized_name: 'sugar', qty: 2, unit: 'tbsp' })],
      [{ name: 'sugar', normalized_name: 'sugar', qty: 0.5, unit: 'cup', aisle: 'dry_goods', recipe_id: null, recipe_title: null }]
    );
    expect(res.updates).toEqual([{ id: 'b', qty: 0.63, unit: 'cup' }]); // (30+120)/240 rounded
  });

  it('keeps incompatible kinds separate', () => {
    const res = mergeIncoming(
      [existing({ id: 'c', normalized_name: 'קמח', qty: 100, unit: 'g' })],
      [{ name: 'קמח', normalized_name: 'קמח', qty: 1, unit: 'cup', aisle: 'dry_goods', recipe_id: null, recipe_title: null }]
    );
    expect(res.updates).toHaveLength(0);
    expect(res.inserts).toHaveLength(1);
  });

  it('never merges into checked items', () => {
    const res = mergeIncoming(
      [existing({ id: 'd', normalized_name: 'חלב', qty: 1, unit: 'l', checked: true })],
      [{ name: 'חלב', normalized_name: 'חלב', qty: 1, unit: 'l', aisle: 'dairy_eggs', recipe_id: null, recipe_title: null }]
    );
    expect(res.updates).toHaveLength(0);
    expect(res.inserts).toHaveLength(1);
  });

  it('dedupes quantity-less duplicates', () => {
    const res = mergeIncoming(
      [existing({ id: 'e', normalized_name: 'מלח' })],
      [{ name: 'מלח', normalized_name: 'מלח', qty: null, unit: null, aisle: 'spices', recipe_id: null, recipe_title: null }]
    );
    expect(res.updates).toHaveLength(0);
    expect(res.inserts).toHaveLength(0);
  });

  it('stacks two incoming items onto one row', () => {
    const res = mergeIncoming(
      [existing({ id: 'f', normalized_name: 'ביצה', qty: 2, unit: null })],
      [
        { name: 'ביצה', normalized_name: 'ביצה', qty: 4, unit: null, aisle: 'dairy_eggs', recipe_id: null, recipe_title: null },
        { name: 'ביצה', normalized_name: 'ביצה', qty: 6, unit: null, aisle: 'dairy_eggs', recipe_id: null, recipe_title: null },
      ]
    );
    expect(res.updates).toEqual([{ id: 'f', qty: 12, unit: null }]);
  });
});
