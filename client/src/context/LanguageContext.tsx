import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { localizeDigits } from '../utils/myanmarDigits';

export type Lang = 'en' | 'my';

type LanguageState = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  /** Format a number/string with Myanmar digits when language is Myanmar. */
  digits: (value: string | number) => string;
};

const STORAGE_KEY = 'smart_agro_lang';

function applyLangToDocument(lang: Lang) {
  const root = document.documentElement;
  root.lang = lang === 'my' ? 'my' : 'en';
  root.classList.toggle('lang-my', lang === 'my');
}

const LanguageContext = createContext<LanguageState | null>(null);

function loadLang(): Lang {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // English is the app default; only switch when user explicitly chose Myanmar
    if (raw === 'my') return 'my';
    if (raw === 'en') return 'en';
    return 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => loadLang());

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
      applyLangToDocument(next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'my' : 'en');
  }, [lang, setLang]);

  useEffect(() => {
    applyLangToDocument(lang);
  }, [lang]);

  const digits = useCallback((value: string | number) => localizeDigits(value, lang), [lang]);

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, digits }),
    [lang, setLang, toggleLang, digits]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
