"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  setLanguage as setModuleLanguage,
  storedLanguage,
  type Language,
} from "@/lib/i18n";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
}

const Ctx = createContext<LanguageContextValue | null>(null);

/**
 * Holds the UI language. Starts in English (matching the server render) and
 * switches to this device's saved choice after mount. The signed-in profile's
 * preference is applied by PreferencesProvider once it loads.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setState] = useState<Language>("en");

  const setLanguage = useCallback((next: Language) => {
    setModuleLanguage(next);
    setState(next);
  }, []);

  useEffect(() => {
    const saved = storedLanguage();
    if (saved && saved !== "en") {
      setModuleLanguage(saved);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from device storage after hydration
      setState(saved);
    }
  }, []);

  return <Ctx.Provider value={{ language, setLanguage }}>{children}</Ctx.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
