import type { Cookbook, CookbookRecipe, MealPlanEntry, Recipe } from './types';
import * as db from './db';
import { uid } from './format';

// Whole-library backup: versioned JSON download + re-import with id remapping
// (works in both demo and Supabase modes — also the migration path between them).

export type LibraryExport = {
  app: 'recipebox';
  version: 1;
  exported_at: string;
  recipes: Recipe[];
  cookbooks: Cookbook[];
  cookbookRecipes: CookbookRecipe[];
  plans: MealPlanEntry[];
};

export function exportLibrary(data: {
  recipes: Recipe[];
  cookbooks: Cookbook[];
  cookbookRecipes: CookbookRecipe[];
  plans: MealPlanEntry[];
}): void {
  const payload: LibraryExport = {
    app: 'recipebox',
    version: 1,
    exported_at: new Date().toISOString(),
    ...data,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  a.href = url;
  a.download = `recipebox-export-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importLibrary(file: File): Promise<{ added: number }> {
  const text = await file.text();
  const data = JSON.parse(text) as LibraryExport;
  if (data.app !== 'recipebox' || data.version !== 1 || !Array.isArray(data.recipes)) {
    throw new Error('not a RecipeBox export');
  }
  const recipeIdMap = new Map<string, string>();
  let added = 0;
  for (const r of data.recipes) {
    const created = await db.createRecipe({
      title: r.title ?? 'Recipe',
      description: r.description ?? null,
      image_path: typeof r.image_path === 'string' && r.image_path.startsWith('data:') ? r.image_path : null,
      image_url: r.image_url ?? null,
      source_url: r.source_url ?? null,
      source_name: r.source_name ?? null,
      prep_min: r.prep_min ?? null,
      cook_min: r.cook_min ?? null,
      total_min: r.total_min ?? null,
      servings: r.servings ?? null,
      ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
      steps: Array.isArray(r.steps) ? r.steps : [],
      notes: r.notes ?? null,
      tags: Array.isArray(r.tags) ? r.tags : [],
      nutrition: r.nutrition ?? null,
      favorite: !!r.favorite,
      is_public: false,
      lang: r.lang === 'en' ? 'en' : 'he',
    });
    if (created) {
      recipeIdMap.set(r.id, created.id);
      added++;
    }
  }
  for (const cb of data.cookbooks ?? []) {
    const created = await db.createCookbook(cb.name ?? 'Cookbook', cb.emoji ?? null);
    if (!created) continue;
    for (const cr of (data.cookbookRecipes ?? []).filter((x) => x.cookbook_id === cb.id)) {
      const newRecipeId = recipeIdMap.get(cr.recipe_id);
      if (newRecipeId) await db.addRecipeToCookbook(created.id, newRecipeId);
    }
  }
  for (const p of data.plans ?? []) {
    const newRecipeId = recipeIdMap.get(p.recipe_id);
    if (newRecipeId && p.plan_date && p.slot) {
      await db.addPlan({ plan_date: p.plan_date, slot: p.slot, recipe_id: newRecipeId, servings: p.servings ?? null });
    }
  }
  return { added };
}

export const newLocalId = uid;
