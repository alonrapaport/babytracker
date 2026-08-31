import { describe, expect, it } from 'vitest';
import { estimateNutrition } from '../nutrition';
import { parseIngredientBlock } from '../parse/ingredient';

describe('estimateNutrition', () => {
  it('estimates a Hebrew shakshuka in a sane range', () => {
    const ings = parseIngredientBlock(
      [
        '2 ביצים',
        '1 בצל קצוץ',
        '2 שיני שום כתושות',
        '1 פלפל אדום',
        '2 כפות שמן זית',
        '400 גרם עגבניות מרוסקות',
        '1 כפית פפריקה מתוקה',
        'חצי כפית כמון',
        'מלח ופלפל שחור לפי הטעם',
      ].join('\n')
    );
    const est = estimateNutrition(ings, 2)!;
    expect(est).not.toBeNull();
    // 2 eggs + 30ml oil + 400g tomatoes + veg ≈ 300-350 kcal per serving of 2
    expect(est.nutrition.calories).toBeGreaterThan(150);
    expect(est.nutrition.calories).toBeLessThan(450);
    expect(est.nutrition.protein).toBeGreaterThan(5);
    // every line understood, incl. the quantity-less salt & pepper (zero-cal)
    expect(est.coveragePct).toBe(100);
  });

  it('estimates English pancakes with cup/tbsp conversions', () => {
    const ings = parseIngredientBlock(
      ['1½ cups flour', '2 tbsp sugar', '¾ cup milk', '2 eggs', '3 tbsp butter, melted'].join('\n')
    );
    const est = estimateNutrition(ings, 4)!;
    // ~180g flour + 25g sugar + 184g milk + 2 eggs + 42g butter ≈ 1400 kcal total
    expect(est.nutrition.calories).toBeGreaterThan(250);
    expect(est.nutrition.calories).toBeLessThan(450);
    expect(est.coveragePct).toBe(100);
  });

  it('prefers the more specific food name ("סוכר חום" over "סוכר")', () => {
    const brown = estimateNutrition(parseIngredientBlock('1 כוס סוכר חום'), 1)!;
    // brown sugar: 220 g/cup * 3.8 -> ~836 kcal (white sugar would be ~774)
    expect(brown.nutrition.calories).toBeGreaterThan(800);
  });

  it('uses per-unit weights for count items and averages ranges', () => {
    const est = estimateNutrition(parseIngredientBlock('1-3 בננות'), 1)!;
    // avg 2 bananas * 118g * 0.89 -> ~210 kcal
    expect(est.nutrition.calories).toBeGreaterThan(150);
    expect(est.nutrition.calories).toBeLessThan(280);
  });

  it('reports low coverage for unknown ingredients instead of guessing', () => {
    const est = estimateNutrition(parseIngredientBlock('2 כפות אבקת חד-קרן\n1 כוס קמח'), 1)!;
    expect(est.coveragePct).toBe(50);
    expect(est.matched).toBe(1);
    expect(est.total).toBe(2);
  });

  it('returns null for empty ingredient lists', () => {
    expect(estimateNutrition([], 4)).toBeNull();
  });

  it('treats a whole can via per-unit weight ("קופסה" line unparsed falls back gracefully)', () => {
    // parsed line with can unit: "1 קופסת עגבניות מרוסקות"
    const est = estimateNutrition(parseIngredientBlock('1 קופסת עגבניות מרוסקות'), 1)!;
    // 400g * 0.32 -> ~128 kcal
    expect(est.nutrition.calories).toBeGreaterThan(100);
    expect(est.nutrition.calories).toBeLessThan(160);
  });
});
