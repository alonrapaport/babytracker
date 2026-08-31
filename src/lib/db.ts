import { supabase, isConfigured } from './supabase';
import { isDemo } from './demo';
import * as demoStore from './demoStore';
import { demoApi } from './demoStore';
import { mergeIncoming } from './grocery';
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

// Single data facade: every function branches to the localStorage demo store
// in demo mode, otherwise talks to Supabase (RLS enforces visibility).

// --- profile ---

export async function getProfile(uid: string): Promise<Profile | null> {
  if (isDemo) return demoApi.getProfile();
  const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    display_name: data.display_name,
    language: data.language === 'en' ? 'en' : 'he',
    unit_system: data.unit_system === 'metric' || data.unit_system === 'us' ? data.unit_system : 'original',
    custom_aisles: Array.isArray(data.custom_aisles) ? data.custom_aisles : [],
  };
}

export async function updateProfile(uid: string, patch: Partial<Profile>): Promise<void> {
  if (isDemo) {
    demoApi.updateProfile(patch);
    return;
  }
  await supabase.from('profiles').update(patch).eq('id', uid);
}

// --- recipes ---

export async function listRecipes(): Promise<Recipe[]> {
  if (isDemo) return demoApi.listRecipes();
  const { data } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
  return (data as Recipe[]) ?? [];
}

export async function createRecipe(
  input: Omit<Recipe, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
): Promise<Recipe | null> {
  if (isDemo) return demoApi.createRecipe(input);
  const { data } = await supabase.from('recipes').insert(input).select().single();
  return (data as Recipe) ?? null;
}

export async function updateRecipe(id: string, patch: Partial<Recipe>): Promise<void> {
  if (isDemo) {
    demoApi.updateRecipe(id, patch);
    return;
  }
  await supabase.from('recipes').update(patch).eq('id', id);
}

export async function deleteRecipe(id: string): Promise<void> {
  if (isDemo) {
    demoApi.deleteRecipe(id);
    return;
  }
  await supabase.from('recipes').delete().eq('id', id);
}

// --- cookbooks ---

export async function listCookbooks(): Promise<Cookbook[]> {
  if (isDemo) return demoApi.listCookbooks();
  const { data } = await supabase.from('cookbooks').select('*').order('created_at');
  return (data as Cookbook[]) ?? [];
}

export async function listCookbookRecipes(): Promise<CookbookRecipe[]> {
  if (isDemo) return demoApi.listCookbookRecipes();
  const { data } = await supabase.from('cookbook_recipes').select('id, cookbook_id, recipe_id');
  return (data as CookbookRecipe[]) ?? [];
}

export async function listCookbookMembers(cookbookId: string): Promise<CookbookMember[]> {
  if (isDemo) return demoApi.listCookbookMembers(cookbookId);
  const { data } = await supabase
    .from('cookbook_members')
    .select('id, cookbook_id, user_id, role')
    .eq('cookbook_id', cookbookId);
  return (data as CookbookMember[]) ?? [];
}

export async function createCookbook(name: string, emoji: string | null): Promise<Cookbook | null> {
  if (isDemo) return demoApi.createCookbook(name, emoji);
  const { data } = await supabase.from('cookbooks').insert({ name, emoji }).select().single();
  return (data as Cookbook) ?? null;
}

export async function updateCookbook(id: string, patch: Partial<Cookbook>): Promise<void> {
  if (isDemo) {
    demoApi.updateCookbook(id, patch);
    return;
  }
  await supabase.from('cookbooks').update(patch).eq('id', id);
}

export async function deleteCookbook(id: string): Promise<void> {
  if (isDemo) {
    demoApi.deleteCookbook(id);
    return;
  }
  await supabase.from('cookbooks').delete().eq('id', id);
}

export async function addRecipeToCookbook(cookbookId: string, recipeId: string): Promise<void> {
  if (isDemo) {
    demoApi.addRecipeToCookbook(cookbookId, recipeId);
    return;
  }
  await supabase.from('cookbook_recipes').insert({ cookbook_id: cookbookId, recipe_id: recipeId });
}

export async function removeRecipeFromCookbook(cookbookId: string, recipeId: string): Promise<void> {
  if (isDemo) {
    demoApi.removeRecipeFromCookbook(cookbookId, recipeId);
    return;
  }
  await supabase.from('cookbook_recipes').delete().eq('cookbook_id', cookbookId).eq('recipe_id', recipeId);
}

export async function leaveCookbook(cookbookId: string, userId: string): Promise<void> {
  if (isDemo) return;
  await supabase.from('cookbook_members').delete().eq('cookbook_id', cookbookId).eq('user_id', userId);
}

/** Joins a shared cookbook by invite token. Returns the cookbook id. */
export async function joinCookbook(token: string): Promise<string | null> {
  if (isDemo) return demoApi.joinCookbook();
  const { data, error } = await supabase.rpc('join_cookbook', { token });
  if (error) return null;
  return (data as string) ?? null;
}

// --- grocery ---

export async function listGrocery(): Promise<GroceryItem[]> {
  if (isDemo) return demoApi.listGrocery();
  const { data } = await supabase.from('grocery_items').select('*').order('created_at');
  return (data as GroceryItem[]) ?? [];
}

/** Adds items with smart merging into the existing (unchecked) list. */
export async function addGroceryItems(items: NewGroceryItem[]): Promise<void> {
  const existing = await listGrocery();
  const { updates, inserts } = mergeIncoming(existing, items);
  if (isDemo) {
    for (const u of updates) demoApi.updateGroceryItem(u.id, { qty: u.qty, unit: u.unit });
    demoApi.insertGroceryItems(inserts);
    return;
  }
  for (const u of updates) {
    await supabase.from('grocery_items').update({ qty: u.qty, unit: u.unit }).eq('id', u.id);
  }
  if (inserts.length) await supabase.from('grocery_items').insert(inserts);
}

export async function updateGroceryItem(id: string, patch: Partial<GroceryItem>): Promise<void> {
  if (isDemo) {
    demoApi.updateGroceryItem(id, patch);
    return;
  }
  await supabase.from('grocery_items').update(patch).eq('id', id);
}

export async function deleteGroceryItem(id: string): Promise<void> {
  if (isDemo) {
    demoApi.deleteGroceryItem(id);
    return;
  }
  await supabase.from('grocery_items').delete().eq('id', id);
}

export async function clearCheckedGrocery(): Promise<void> {
  if (isDemo) {
    demoApi.clearChecked();
    return;
  }
  await supabase.from('grocery_items').delete().eq('checked', true);
}

// --- meal plans ---

export async function listPlans(): Promise<MealPlanEntry[]> {
  if (isDemo) return demoApi.listPlans();
  const { data } = await supabase.from('meal_plans').select('*').order('plan_date');
  return (data as MealPlanEntry[]) ?? [];
}

export async function addPlan(entry: Omit<MealPlanEntry, 'id' | 'user_id'>): Promise<void> {
  if (isDemo) {
    demoApi.addPlan(entry);
    return;
  }
  await supabase.from('meal_plans').insert(entry);
}

export async function deletePlan(id: string): Promise<void> {
  if (isDemo) {
    demoApi.deletePlan(id);
    return;
  }
  await supabase.from('meal_plans').delete().eq('id', id);
}

// --- realtime ---

function subscribeTable(table: string, onChange: () => void): () => void {
  if (isDemo || !isConfigured) return demoStore.subscribe(onChange);
  const channel = supabase
    .channel(`rt-${table}-${Math.random().toString(36).slice(2, 8)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export const subscribeRecipes = (onChange: () => void) => subscribeTable('recipes', onChange);
export const subscribeGrocery = (onChange: () => void) => subscribeTable('grocery_items', onChange);
export const subscribePlans = (onChange: () => void) => subscribeTable('meal_plans', onChange);
export const subscribeCookbookRecipes = (onChange: () => void) => subscribeTable('cookbook_recipes', onChange);

// --- photos ---

/** Uploads a JPEG dataURL; returns a storage path (or the dataURL in demo). */
export async function uploadPhoto(dataUrl: string): Promise<string> {
  if (isDemo || !isConfigured) return dataUrl;
  const blob = await (await fetch(dataUrl)).blob();
  const path = `${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from('recipe-photos').upload(path, blob, { contentType: 'image/jpeg' });
  if (error) return dataUrl; // fall back to inline
  return path;
}

const signedUrlCache = new Map<string, string>();

/** Resolves a recipe photo reference (dataURL, http URL, or storage path). */
export async function photoUrl(pathOrUrl: string | null): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('data:') || pathOrUrl.startsWith('http')) return pathOrUrl;
  const cached = signedUrlCache.get(pathOrUrl);
  if (cached) return cached;
  const { data } = await supabase.storage.from('recipe-photos').createSignedUrl(pathOrUrl, 60 * 60);
  if (data?.signedUrl) {
    signedUrlCache.set(pathOrUrl, data.signedUrl);
    return data.signedUrl;
  }
  return null;
}

export function resetDemo(): void {
  demoStore.reset();
}
