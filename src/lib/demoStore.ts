import type {
  Cookbook,
  CookbookMember,
  CookbookRecipe,
  GroceryItem,
  MealPlanEntry,
  NewGroceryItem,
  Profile,
  Recipe,
} from './types';
import { buildSeed, DEMO_UID } from '../data/seedRecipes';
import { uid } from './format';

// Demo mode's whole backend: an in-memory store seeded with nice recipes and
// persisted to localStorage, so an imported recipe survives a reload even with
// no Supabase project. Every mutation persists + notifies subscribers.

const STORAGE_KEY = 'recipebox_demo_v1';

type StoreShape = {
  v: 1;
  profile: Profile;
  recipes: Recipe[];
  cookbooks: Cookbook[];
  cookbookRecipes: CookbookRecipe[];
  cookbookMembers: CookbookMember[];
  groceryItems: GroceryItem[];
  plans: MealPlanEntry[];
};

function defaultProfile(): Profile {
  return { id: DEMO_UID, display_name: 'אורח·ת', language: 'he', unit_system: 'original', custom_aisles: [] };
}

function freshStore(): StoreShape {
  const seed = buildSeed();
  return {
    v: 1,
    profile: defaultProfile(),
    recipes: seed.recipes,
    cookbooks: seed.cookbooks,
    cookbookRecipes: seed.cookbookRecipes,
    cookbookMembers: [],
    groceryItems: seed.groceryItems,
    plans: seed.plans,
  };
}

function load(): StoreShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreShape;
      if (parsed && parsed.v === 1 && Array.isArray(parsed.recipes)) return parsed;
    }
  } catch {
    // corrupted or unavailable storage — reseed
  }
  return freshStore();
}

let store: StoreShape = typeof localStorage !== 'undefined' ? load() : freshStore();

const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota exceeded (huge photos) — keep running in memory
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function reset(): void {
  store = freshStore();
  emit();
}

const nowIso = () => new Date().toISOString();

export const demoApi = {
  // --- profile ---
  getProfile(): Profile {
    return store.profile;
  },
  updateProfile(patch: Partial<Profile>): Profile {
    store.profile = { ...store.profile, ...patch };
    emit();
    return store.profile;
  },

  // --- recipes ---
  listRecipes(): Recipe[] {
    return [...store.recipes].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  createRecipe(data: Omit<Recipe, 'id' | 'owner_id' | 'created_at' | 'updated_at'>): Recipe {
    const r: Recipe = { ...data, id: uid(), owner_id: DEMO_UID, created_at: nowIso(), updated_at: nowIso() };
    store.recipes.push(r);
    emit();
    return r;
  },
  updateRecipe(id: string, patch: Partial<Recipe>): void {
    store.recipes = store.recipes.map((r) => (r.id === id ? { ...r, ...patch, updated_at: nowIso() } : r));
    emit();
  },
  deleteRecipe(id: string): void {
    store.recipes = store.recipes.filter((r) => r.id !== id);
    store.cookbookRecipes = store.cookbookRecipes.filter((cr) => cr.recipe_id !== id);
    store.plans = store.plans.filter((p) => p.recipe_id !== id);
    emit();
  },

  // --- cookbooks ---
  listCookbooks(): Cookbook[] {
    return [...store.cookbooks];
  },
  listCookbookRecipes(): CookbookRecipe[] {
    return [...store.cookbookRecipes];
  },
  listCookbookMembers(cookbookId: string): CookbookMember[] {
    const owner = store.cookbooks.find((c) => c.id === cookbookId);
    const members: CookbookMember[] = owner
      ? [{ id: `owner-${cookbookId}`, cookbook_id: cookbookId, user_id: owner.owner_id, role: 'owner', display_name: store.profile.display_name }]
      : [];
    return members.concat(store.cookbookMembers.filter((m) => m.cookbook_id === cookbookId));
  },
  createCookbook(name: string, emoji: string | null): Cookbook {
    const c: Cookbook = { id: uid(), owner_id: DEMO_UID, name, emoji, invite_token: uid(), created_at: nowIso() };
    store.cookbooks.push(c);
    emit();
    return c;
  },
  updateCookbook(id: string, patch: Partial<Cookbook>): void {
    store.cookbooks = store.cookbooks.map((c) => (c.id === id ? { ...c, ...patch } : c));
    emit();
  },
  deleteCookbook(id: string): void {
    store.cookbooks = store.cookbooks.filter((c) => c.id !== id);
    store.cookbookRecipes = store.cookbookRecipes.filter((cr) => cr.cookbook_id !== id);
    emit();
  },
  addRecipeToCookbook(cookbookId: string, recipeId: string): void {
    if (store.cookbookRecipes.some((cr) => cr.cookbook_id === cookbookId && cr.recipe_id === recipeId)) return;
    store.cookbookRecipes.push({ id: uid(), cookbook_id: cookbookId, recipe_id: recipeId });
    emit();
  },
  removeRecipeFromCookbook(cookbookId: string, recipeId: string): void {
    store.cookbookRecipes = store.cookbookRecipes.filter(
      (cr) => !(cr.cookbook_id === cookbookId && cr.recipe_id === recipeId)
    );
    emit();
  },
  joinCookbook(): string | null {
    // no second account in demo mode — joining is a no-op
    return null;
  },

  // --- grocery ---
  listGrocery(): GroceryItem[] {
    return [...store.groceryItems];
  },
  insertGroceryItems(items: NewGroceryItem[]): void {
    for (const item of items) {
      store.groceryItems.push({ ...item, id: uid(), user_id: DEMO_UID, checked: false, created_at: nowIso() });
    }
    emit();
  },
  updateGroceryItem(id: string, patch: Partial<GroceryItem>): void {
    store.groceryItems = store.groceryItems.map((g) => (g.id === id ? { ...g, ...patch } : g));
    emit();
  },
  deleteGroceryItem(id: string): void {
    store.groceryItems = store.groceryItems.filter((g) => g.id !== id);
    emit();
  },
  clearChecked(): void {
    store.groceryItems = store.groceryItems.filter((g) => !g.checked);
    emit();
  },

  // --- meal plans ---
  listPlans(): MealPlanEntry[] {
    return [...store.plans];
  },
  addPlan(entry: Omit<MealPlanEntry, 'id' | 'user_id'>): void {
    store.plans.push({ ...entry, id: uid(), user_id: DEMO_UID });
    emit();
  },
  deletePlan(id: string): void {
    store.plans = store.plans.filter((p) => p.id !== id);
    emit();
  },
};
