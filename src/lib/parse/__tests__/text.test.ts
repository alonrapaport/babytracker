import { describe, expect, it } from 'vitest';
import { looksLikeIngredient, parseRecipeText } from '../text';

const EN_CAPTION = `The BEST fluffy pancakes ever
Save this one for the weekend!

INGREDIENTS:
- 1½ cups flour
- ¾ cup milk
- 2 eggs
- 2 tbsp sugar

DIRECTIONS:
1. Whisk dry ingredients.
2. Add wet, mix until smooth.
3. Cook until golden.

Serves 4
#pancakes #breakfast #easyrecipe`;

const HE_CAPTION = `שקשוקה של שישי 🍳
המתכון שכולם מבקשים ממני

מצרכים:
✅ 6 ביצים
✅ 1 בצל קצוץ
✅ 3 שיני שום
✅ 2 כפות שמן זית
✅ חצי כפית כמון

אופן הכנה:
1. מטגנים את הבצל עד הזהבה.
2. מוסיפים שום ומטגנים עוד דקה.
3. שוברים פנימה את הביצים ומכסים.

ל-4 מנות
#שקשוקה #ארוחתבוקר`;

const HEADERLESS = `Quick tomato salad
2 tomatoes
1 cucumber
2 tbsp olive oil
Mix everything and season well with salt.`;

describe('parseRecipeText — English caption', () => {
  const draft = parseRecipeText(EN_CAPTION);

  it('detects both sections (high confidence)', () => {
    expect(draft.confidence).toBe('high');
    expect(draft.title).toContain('fluffy pancakes');
    expect(draft.description).toContain('weekend');
    expect(draft.lang).toBe('en');
  });

  it('parses the ingredient block', () => {
    expect(draft.ingredients).toHaveLength(4);
    expect(draft.ingredients[0]).toMatchObject({ qty: 1.5, unit: 'cup', name: 'flour' });
    expect(draft.ingredients[3]).toMatchObject({ qty: 2, unit: 'tbsp', name: 'sugar' });
  });

  it('parses steps without ordinals and drops meta lines', () => {
    expect(draft.steps.map((s) => s.text)).toEqual([
      'Whisk dry ingredients.',
      'Add wet, mix until smooth.',
      'Cook until golden.',
    ]);
  });

  it('scrapes servings and hashtags', () => {
    expect(draft.servings).toBe(4);
    expect(draft.tags).toEqual(expect.arrayContaining(['pancakes', 'breakfast']));
  });
});

describe('parseRecipeText — Hebrew caption', () => {
  const draft = parseRecipeText(HE_CAPTION);

  it('detects Hebrew headers (מצרכים / אופן הכנה)', () => {
    expect(draft.confidence).toBe('high');
    expect(draft.lang).toBe('he');
    expect(draft.title).toContain('שקשוקה');
  });

  it('parses Hebrew ingredients with emoji bullets', () => {
    expect(draft.ingredients).toHaveLength(5);
    expect(draft.ingredients[0]).toMatchObject({ qty: 6, name: 'ביצים' });
    expect(draft.ingredients[3]).toMatchObject({ qty: 2, unit: 'tbsp', name: 'שמן זית' });
    expect(draft.ingredients[4].qty).toBeCloseTo(0.5);
    expect(draft.ingredients[4].unit).toBe('tsp');
  });

  it('parses Hebrew steps and servings ("ל-4 מנות")', () => {
    expect(draft.steps).toHaveLength(3);
    expect(draft.steps[0].text).toBe('מטגנים את הבצל עד הזהבה.');
    expect(draft.servings).toBe(4);
    expect(draft.tags).toEqual(expect.arrayContaining(['שקשוקה']));
  });
});

describe('parseRecipeText — headerless fallback', () => {
  const draft = parseRecipeText(HEADERLESS);

  it('finds the quantity-leading run as ingredients', () => {
    expect(draft.confidence).toBe('low');
    expect(draft.title).toBe('Quick tomato salad');
    expect(draft.ingredients).toHaveLength(3);
    expect(draft.steps).toHaveLength(1);
    expect(draft.steps[0].text).toContain('Mix everything');
  });
});

describe('parseRecipeText — sectioned caption without an Ingredients header', () => {
  // the common chef-caption style: section titles instead of "Ingredients:"
  const CAPTION = `STICKY HONEY 🍯 PUDDINGS & BAHARAT CREAM

my mom's honey cake recipe with an English twist. Save the recipe 🫶

Makes 6 individual puddings

HONEY PUDDINGS:
150 g all-purpose flour
1 tsp baking powder
½ tsp baking soda
½ tsp cinnamon
¼ tsp salt
2 large eggs
140 g honey
80 ml neutral oil

BAHARAT CREAM:
200 ml heavy cream
2 tbsp honey
½ tsp baharat

Whisk the dry ingredients, then fold in the wet ones and bake at 175C for 20 minutes.`;

  const draft = parseRecipeText(CAPTION);

  it('captures BOTH sections as grouped ingredients', () => {
    expect(draft.ingredients.length).toBe(11);
    expect(draft.ingredients[0].group).toBe('HONEY PUDDINGS');
    const cream = draft.ingredients.filter((i) => i.group === 'BAHARAT CREAM');
    expect(cream).toHaveLength(3);
    expect(cream[0]).toMatchObject({ qty: 200, unit: 'ml' });
  });

  it('reads "Makes 6" as servings and keeps instructions as steps', () => {
    expect(draft.servings).toBe(6);
    expect(draft.title).toContain('STICKY HONEY');
    expect(draft.steps.some((s) => s.text.includes('bake at 175C'))).toBe(true);
    expect(draft.steps.some((s) => s.text.includes('heavy cream'))).toBe(false);
  });
});

describe('looksLikeIngredient', () => {
  it('accepts qty-leading and unit-leading lines', () => {
    expect(looksLikeIngredient('2 cups flour')).toBe(true);
    expect(looksLikeIngredient('חצי כפית מלח')).toBe(true);
    expect(looksLikeIngredient('- olive oil')).toBe(true);
  });
  it('rejects prose', () => {
    expect(looksLikeIngredient('Preheat the oven to 180 degrees and butter the pan generously.')).toBe(false);
    expect(looksLikeIngredient('')).toBe(false);
  });
});
