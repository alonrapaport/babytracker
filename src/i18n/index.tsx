import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import en, { type Dict } from './en';
import he from './he';
import type { Lang } from '../lib/types';

const dicts: Record<Lang, Dict> = { en, he };

type I18nCtx = {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  setLang: (l: Lang) => void;
  t: (key: keyof Dict, vars?: Record<string, string | number>) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

const STORAGE_KEY = 'nara_lang';

function initialLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
  return saved === 'en' || saved === 'he' ? saved : 'he';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const dir: 'ltr' | 'rtl' = lang === 'he' ? 'rtl' : 'ltr';

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'he' ? 'rtl' : 'ltr';
  }, []);

  const t = useCallback(
    (key: keyof Dict, vars?: Record<string, string | number>) => {
      let str = (dicts[lang][key] ?? dicts.en[key] ?? String(key)) as string;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [lang]
  );

  // keep <html> attributes in sync on first render
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;

  const value = useMemo(() => ({ lang, dir, setLang, t }), [lang, dir, setLang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
