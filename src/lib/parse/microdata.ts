// Classic schema.org microdata (itemscope/itemprop) fallback for pages that
// don't ship JSON-LD. Takes a Document so it works with the browser DOMParser
// and with linkedom inside the edge function.

/* eslint-disable @typescript-eslint/no-explicit-any */

function propValue(el: Element): string | null {
  const tag = el.tagName.toLowerCase();
  if (el.hasAttribute('content')) return el.getAttribute('content');
  if (tag === 'time' && el.hasAttribute('datetime')) return el.getAttribute('datetime');
  if (tag === 'img') return el.getAttribute('src');
  if (tag === 'a' || tag === 'link') return el.getAttribute('href');
  return el.textContent?.trim() || null;
}

/** Builds a schema.org-shaped node from microdata, or null if none found. */
export function extractMicrodataRecipe(doc: Document): any | null {
  const root = Array.from(doc.querySelectorAll('[itemtype]')).find((el) =>
    /schema\.org\/?recipe/i.test(el.getAttribute('itemtype') ?? '')
  );
  if (!root) return null;

  const all = (prop: string): string[] =>
    Array.from(root.querySelectorAll(`[itemprop="${prop}"]`))
      .map(propValue)
      .filter((v): v is string => !!v);
  const one = (prop: string): string | null => all(prop)[0] ?? null;

  const node: any = {
    '@type': 'Recipe',
    name: one('name'),
    description: one('description'),
    image: one('image'),
    author: one('author'),
    prepTime: one('prepTime'),
    cookTime: one('cookTime'),
    totalTime: one('totalTime'),
    recipeYield: one('recipeYield'),
    recipeIngredient: all('recipeIngredient').concat(all('ingredients')),
    recipeInstructions: all('recipeInstructions').concat(all('step')),
    keywords: one('keywords'),
    recipeCuisine: one('recipeCuisine'),
    recipeCategory: one('recipeCategory'),
    inLanguage: doc.documentElement.getAttribute('lang'),
  };
  const nutrition: any = {
    calories: one('calories'),
    proteinContent: one('proteinContent'),
    carbohydrateContent: one('carbohydrateContent'),
    fatContent: one('fatContent'),
  };
  if (Object.values(nutrition).some(Boolean)) node.nutrition = nutrition;
  if (!node.name || !node.recipeIngredient.length) return null;
  return node;
}
