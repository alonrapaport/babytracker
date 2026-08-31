// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

// jsdom provides localStorage; reset modules per test so the store re-loads.
async function freshStore() {
  const mod = await import('../demoStore');
  mod.reset();
  return mod;
}

beforeEach(() => {
  localStorage.clear();
});

describe('demoStore', () => {
  it('seeds recipes, cookbooks, plans and grocery on first load', async () => {
    const { demoApi } = await freshStore();
    const recipes = demoApi.listRecipes();
    expect(recipes.length).toBeGreaterThanOrEqual(9);
    expect(recipes.some((r) => r.title === 'שקשוקה קלאסית')).toBe(true);
    expect(recipes.some((r) => r.is_public)).toBe(true);
    expect(demoApi.listCookbooks()).toHaveLength(2);
    expect(demoApi.listPlans().length).toBeGreaterThan(0);
    expect(demoApi.listGrocery().length).toBeGreaterThan(0);
  });

  it('persists mutations to localStorage', async () => {
    const { demoApi } = await freshStore();
    const created = demoApi.createRecipe({
      title: 'בדיקה',
      description: null,
      image_path: null,
      image_url: null,
      source_url: null,
      source_name: null,
      prep_min: null,
      cook_min: null,
      total_min: null,
      servings: 2,
      ingredients: [],
      steps: [],
      notes: null,
      tags: [],
      nutrition: null,
      favorite: false,
      is_public: false,
      lang: 'he',
    });
    const raw = localStorage.getItem('recipebox_demo_v1');
    expect(raw).toBeTruthy();
    expect(raw).toContain('בדיקה');
    demoApi.deleteRecipe(created.id);
    expect(localStorage.getItem('recipebox_demo_v1')).not.toContain('בדיקה');
  });

  it('reset() reseeds cleanly', async () => {
    const mod = await freshStore();
    mod.demoApi.deleteRecipe('seed-shakshuka');
    expect(mod.demoApi.listRecipes().some((r) => r.id === 'seed-shakshuka')).toBe(false);
    mod.reset();
    expect(mod.demoApi.listRecipes().some((r) => r.id === 'seed-shakshuka')).toBe(true);
  });

  it('parses seed ingredients through the real parser', async () => {
    const { demoApi } = await freshStore();
    const shak = demoApi.listRecipes().find((r) => r.id === 'seed-shakshuka')!;
    const eggs = shak.ingredients.find((i) => i.name === 'ביצים')!;
    expect(eggs.qty).toBe(2);
    const cookies = demoApi.listRecipes().find((r) => r.id === 'seed-cookies')!;
    expect(cookies.ingredients.some((i) => i.group === 'לבצק')).toBe(true);
  });
});
