import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as db from '../lib/db';
import type { Baby, Entry, Profile, Units } from '../lib/types';
import { useI18n } from '../i18n';

type AppState = {
  session: Session | null;
  loadingAuth: boolean;
  profile: Profile | null;
  babies: Baby[];
  activeBaby: Baby | null;
  entries: Entry[];
  units: Units;
  refreshBabies: () => Promise<void>;
  refreshEntries: () => Promise<void>;
  setActiveBaby: (id: string) => Promise<void>;
  setUnits: (u: Units) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AppState | null>(null);

const defaultUnits: Units = { volume: 'ml', weight: 'kg', length: 'cm' };

export function AppProvider({ children }: { children: ReactNode }) {
  const { setLang } = useI18n();
  const [session, setSession] = useState<Session | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [activeBabyId, setActiveBabyId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const unsubRef = useRef<(() => void) | null>(null);

  // --- auth bootstrap ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoadingAuth(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // --- load profile + babies when signed in ---
  const loadCore = useCallback(async () => {
    const uid = session?.user?.id;
    if (!uid) return;
    const p = await db.getProfile(uid);
    if (p) {
      setProfile(p);
      if (p.language) setLang(p.language);
    }
    const bs = await db.listBabies();
    setBabies(bs);
    const active = p?.active_baby_id && bs.some((b) => b.id === p.active_baby_id)
      ? p.active_baby_id
      : bs[0]?.id ?? null;
    setActiveBabyId(active);
  }, [session, setLang]);

  useEffect(() => {
    if (session) loadCore();
    else {
      setProfile(null);
      setBabies([]);
      setActiveBabyId(null);
      setEntries([]);
    }
  }, [session, loadCore]);

  const refreshEntries = useCallback(async () => {
    if (!activeBabyId) {
      setEntries([]);
      return;
    }
    setEntries(await db.listEntries(activeBabyId));
  }, [activeBabyId]);

  // --- load entries + realtime subscription for the active baby ---
  useEffect(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    if (!activeBabyId) {
      setEntries([]);
      return;
    }
    refreshEntries();
    unsubRef.current = db.subscribeEntries(activeBabyId, () => {
      db.listEntries(activeBabyId).then(setEntries);
    });
    return () => {
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = null;
    };
  }, [activeBabyId, refreshEntries]);

  const refreshBabies = useCallback(async () => {
    setBabies(await db.listBabies());
  }, []);

  const setActiveBaby = useCallback(
    async (id: string) => {
      setActiveBabyId(id);
      const uid = session?.user?.id;
      if (uid) await db.updateProfile(uid, { active_baby_id: id });
    },
    [session]
  );

  const setUnits = useCallback(
    async (u: Units) => {
      setProfile((p) => (p ? { ...p, units: u } : p));
      const uid = session?.user?.id;
      if (uid) await db.updateProfile(uid, { units: u });
    },
    [session]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const activeBaby = useMemo(
    () => babies.find((b) => b.id === activeBabyId) ?? null,
    [babies, activeBabyId]
  );

  const value: AppState = {
    session,
    loadingAuth,
    profile,
    babies,
    activeBaby,
    entries,
    units: profile?.units ?? defaultUnits,
    refreshBabies,
    refreshEntries,
    setActiveBaby,
    setUnits,
    signOut,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
