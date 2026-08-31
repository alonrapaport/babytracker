// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { extractMicrodataRecipe } from '../microdata';
import { normalizeSchemaRecipe } from '../jsonld';
// eslint-disable-next-line import/no-unresolved
import html from './fixtures/microdata.html?raw';

describe('extractMicrodataRecipe', () => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const node = extractMicrodataRecipe(doc)!;

  it('finds the recipe scope and collects props', () => {
    expect(node).not.toBeNull();
    expect(node.name).toBe("Grandma's Banana Bread");
    expect(node.recipeIngredient).toHaveLength(4);
  });

  it('normalizes through the shared schema pipeline', () => {
    const draft = normalizeSchemaRecipe(node, 'https://example.com/banana');
    expect(draft.title).toBe("Grandma's Banana Bread");
    expect(draft.prep_min).toBe(15);
    expect(draft.cook_min).toBe(60);
    expect(draft.total_min).toBe(75);
    expect(draft.servings).toBe(10);
    expect(draft.steps).toHaveLength(3);
    expect(draft.ingredients[3]).toMatchObject({ qty: 0.5, unit: 'cup', name: 'butter', note: 'melted' });
  });

  it('returns null for pages without microdata', () => {
    const empty = new DOMParser().parseFromString('<html><body><p>nope</p></body></html>', 'text/html');
    expect(extractMicrodataRecipe(empty)).toBeNull();
  });
});
