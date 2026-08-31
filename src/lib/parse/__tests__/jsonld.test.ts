import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { draftFromHtml, extractJsonLdBlocks, findRecipeNodes, parseYield, stripHtml } from '../jsonld';
import { parseIsoDurationMin } from '../duration';

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

describe('parseIsoDurationMin', () => {
  it('parses common durations', () => {
    expect(parseIsoDurationMin('PT1H30M')).toBe(90);
    expect(parseIsoDurationMin('PT20M')).toBe(20);
    expect(parseIsoDurationMin('P0DT2H15M')).toBe(135);
    expect(parseIsoDurationMin('PT45S')).toBe(1);
  });
  it('rejects garbage', () => {
    expect(parseIsoDurationMin('yesterday')).toBeNull();
    expect(parseIsoDurationMin('')).toBeNull();
    expect(parseIsoDurationMin(null)).toBeNull();
  });
});

describe('parseYield', () => {
  it('handles numbers, strings and arrays', () => {
    expect(parseYield(8)).toBe(8);
    expect(parseYield('4 servings')).toBe(4);
    expect(parseYield(['6', '6 cookies'])).toBe(6);
    expect(parseYield('4 מנות')).toBe(4);
    expect(parseYield(null)).toBeNull();
  });
});

describe('draftFromHtml — simple recipe', () => {
  const draft = draftFromHtml(fixture('simple.html'), 'https://example.com/pancakes')!;

  it('extracts core fields', () => {
    expect(draft.title).toBe('Fluffy Pancakes');
    expect(draft.image_url).toBe('https://example.com/pancakes.jpg');
    expect(draft.source_name).toBe('Jane Baker');
    expect(draft.prep_min).toBe(10);
    expect(draft.cook_min).toBe(20);
    expect(draft.total_min).toBe(30);
    expect(draft.servings).toBe(4);
    expect(draft.lang).toBe('en');
  });

  it('parses ingredients structurally', () => {
    expect(draft.ingredients).toHaveLength(6);
    expect(draft.ingredients[0]).toMatchObject({ qty: 1.5, unit: 'cup', name: 'all-purpose flour', note: 'sifted' });
    expect(draft.ingredients[2]).toMatchObject({ qty: 2, name: 'eggs' });
  });

  it('collects steps, nutrition and tags', () => {
    expect(draft.steps).toHaveLength(3);
    expect(draft.nutrition).toMatchObject({ calories: 240, protein: 8, carbs: 31, fat: 9 });
    expect(draft.tags).toEqual(expect.arrayContaining(['pancakes', 'american', 'breakfast']));
  });
});

describe('draftFromHtml — @graph and mixed @type', () => {
  const draft = draftFromHtml(fixture('graph.html'))!;

  it('finds the recipe inside @graph', () => {
    expect(draft.title).toBe('Chocolate Chip Cookies');
    expect(draft.servings).toBe(24);
    expect(draft.image_url).toBe('https://cookies.example.com/img1.jpg');
    expect(draft.source_name).toBe('Chef Choc');
  });

  it('splits string instructions on newlines', () => {
    expect(draft.steps.map((s) => s.text)).toEqual([
      'Cream the butter and sugar.',
      'Mix in the flour.',
      'Fold in the chips and bake at 180C.',
    ]);
  });
});

describe('draftFromHtml — Hebrew recipe (Israeli sites)', () => {
  const draft = draftFromHtml(fixture('hebrew.html'), 'https://example.co.il/shakshuka')!;

  it('extracts Hebrew fields and detects language', () => {
    expect(draft.title).toBe('שקשוקה ביתית');
    expect(draft.lang).toBe('he');
    expect(draft.servings).toBe(4);
    expect(draft.steps).toHaveLength(4);
    expect(draft.tags).toEqual(expect.arrayContaining(['שקשוקה']));
  });

  it('parses Hebrew ingredient grammar from JSON-LD', () => {
    expect(draft.ingredients[0]).toMatchObject({ qty: 6, name: 'ביצים' });
    expect(draft.ingredients[2]).toMatchObject({ qty: 3, unit: 'clove' });
    expect(draft.ingredients[5]).toMatchObject({ qty: 2, unit: 'tbsp', name: 'שמן זית' });
    const halfTsp = draft.ingredients[7];
    expect(halfTsp.qty).toBeCloseTo(0.5);
    expect(halfTsp.unit).toBe('tsp');
    // the unparseable "לפי הטעם" line survives raw
    expect(draft.ingredients[8].qty).toBeNull();
    expect(draft.ingredients[8].raw).toBe('מלח ופלפל שחור לפי הטעם');
  });
});

describe('draftFromHtml — HowToSection groups', () => {
  const draft = draftFromHtml(fixture('howto-sections.html'))!;

  it('maps sections to step groups', () => {
    expect(draft.steps).toHaveLength(3);
    expect(draft.steps[0].group).toBe('Make the batter');
    expect(draft.steps[2].group).toBe('Bake');
    expect(draft.servings).toBe(8);
  });
});

describe('draftFromHtml — resilience', () => {
  it('skips broken JSON blocks and unwraps comment wrappers', () => {
    const draft = draftFromHtml(fixture('broken.html'))!;
    expect(draft.title).toBe('Comment-wrapped Soup');
    expect(draft.ingredients).toHaveLength(2);
  });

  it('returns null when no recipe exists', () => {
    expect(draftFromHtml('<html><body><p>hello</p></body></html>')).toBeNull();
  });

  it('extractJsonLdBlocks never throws on junk', () => {
    expect(extractJsonLdBlocks('<script type="application/ld+json">{{{</script>')).toEqual([]);
    expect(findRecipeNodes([{ foo: 'bar' }])).toEqual([]);
  });
});

describe('stripHtml', () => {
  it('strips tags and decodes entities', () => {
    expect(stripHtml('<b>1 &amp; 2</b><br>next')).toBe('1 & 2\nnext');
    expect(stripHtml('&frac12; cup')).toBe('½ cup');
  });
});
