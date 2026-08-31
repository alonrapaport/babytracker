import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { isDemo } from '../lib/demo';
import * as db from '../lib/db';
import type {
  Cookbook,
  CookbookRecipe,
  GroceryItem,
  MealPlanEntry,
  Profile,
  Recipe,
  UnitSystem,
} from '../lib/types';
import { useI18n } from '../i18n';
import { DEMO_UID } from '../data/seedRecipes';

type AppState = {
  session: Session | null;
  loadingAuth: boolean;
  uid: string | null;
  profile: Profile | null;
  /** everything visible to me (own + shared + community) */
  recipes: Recipe[];
  /** my library: own recipes + recipes shared with me via cookbooks */
  libraryRecipes: Recipe[];
  /** community feed: everything public */
  publicRecipes: Recipe[];
  cookbooks: Cookbook[];
  cookbookRecipes: CookbookRecipe[];
  groceryItems: GroceryItem[];
  plans: MealPlanEntry[];
  unitSystem: UnitSystem;
  customAisles: string[];
  refreshRecipes: () => Promise<void>;
  refreshCookbooks: () => Promise<void>;
  refreshGrocery: () => Promise<void>;
  refreshPlans: () => Promise<void>;
  setUnitSystem: (u: UnitSystem) => Promise<void>;
  setCustomAisles: (aisles: string[]) => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { setLang } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [cookbookRecipes, setCookbookRecipes] = useState<CookbookRecipe[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [plans, setPlans] = useState<MealPlanEntry[]>([]);

  // --- auth bootstrap ---
  useEffect(() => {
    if (isDemo) {
      // synthetic session so the app proceeds straight to the recipes screen
      setSession({ user: { id: DEMO_UID } } as unknown as Session);
      setLoadingAuth(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoadingAuth(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const uid = session?.user?.id ?? null;

  const refreshRecipes = useCallback(async () => {
    setRecipes(await db.listRecipes());
  }, []);
  const refreshCookbooks = useCallback(async () => {
    const [cbs, crs] = await Promise.all([db.listCookbooks(), db.listCookbookRecipes()]);
    setCookbooks(cbs);
    setCookbookRecipes(crs);
  }, []);
  const refreshGrocery = useCallback(async () => {
    setGroceryItems(await db.listGrocery());
  }, []);
  const refreshPlans = useCallback(async () => {
    setPlans(await db.listPlans());
  }, []);

  // --- load everything when signed in; clear when signed out ---
  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setRecipes([]);
      setCookbooks([]);
      setCookbookRecipes([]);
      setGroceryItems([]);
      setPlans([]);
      return;
    }
    db.getProfile(uid).then((p) => {
      if (p) {
        setProfile(p);
        if (p.language) setLang(p.language);
      }
    });
    refreshRecipes();
    refreshCookbooks();
    refreshGrocery();
    refreshPlans();
  }, [uid, setLang, refreshRecipes, refreshCookbooks, refreshGrocery, refreshPlans]);

  // --- realtime ---
  useEffect(() => {
    if (!uid) return;
    const unsubs = [
      db.subscribeRecipes(refreshRecipes),
      db.subscribeGrocery(refreshGrocery),
      db.subscribePlans(refreshPlans),
      db.subscribeCookbookRecipes(refreshCookbooks),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid, refreshRecipes, refreshGrocery, refreshPlans, refreshCookbooks]);

  const setUnitSystem = useCallback(
    async (u: UnitSystem) => {
      setProfile((p) => (p ? { ...p, unit_system: u } : p));
      if (uid) await db.updateProfile(uid, { unit_system: u });
    },
    [uid]
  );

  const setCustomAisles = useCallback(
    async (aisles: string[]) => {
      setProfile((p) => (p ? { ...p, custom_aisles: aisles } : p));
      if (uid) await db.updateProfile(uid, { custom_aisles: aisles });
    },
    [uid]
  );

  const setDisplayName = useCallback(
    async (name: string) => {
      setProfile((p) => (p ? { ...p, display_name: name } : p));
      if (uid) await db.updateProfile(uid, { display_name: name });
    },
    [uid]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const sharedRecipeIds = useMemo(() => new Set(cookbookRecipes.map((cr) => cr.recipe_id)), [cookbookRecipes]);

  const libraryRecipes = useMemo(
    () => recipes.filter((r) => r.owner_id === uid || sharedRecipeIds.has(r.id)),
    [recipes, uid, sharedRecipeIds]
  );

  const publicRecipes = useMemo(() => recipes.filter((r) => r.is_public), [recipes]);

  const value: AppState = {
    session,
    loadingAuth,
    uid,
    profile,
    recipes,
    libraryRecipes,
    publicRecipes,
    cookbooks,
    cookbookRecipes,
    groceryItems,
    plans,
    unitSystem: profile?.unit_system ?? 'original',
    customAisles: profile?.custom_aisles ?? [],
    refreshRecipes,
    refreshCookbooks,
    refreshGrocery,
    refreshPlans,
    setUnitSystem,
    setCustomAisles,
    setDisplayName,
    signOut,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
