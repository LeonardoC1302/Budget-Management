"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Mode = "light" | "dark";

interface ModeContextValue {
  mode: Mode;
  setMode: (m: Mode) => void;
  toggle: () => void;
  hasExplicit: boolean;
}

const STORAGE_KEY = "perch:mode";

const ModeContext = createContext<ModeContextValue | null>(null);

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) {
    return { mode: "light", setMode: () => {}, toggle: () => {}, hasExplicit: false };
  }
  return ctx;
}

function readInitialMode(): { mode: Mode; explicit: boolean } {
  if (typeof window === "undefined") return { mode: "light", explicit: false };
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return { mode: stored, explicit: true };
    }
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return { mode: systemDark ? "dark" : "light", explicit: false };
  } catch {
    return { mode: "light", explicit: false };
  }
}

/**
 * Root theme provider. Owns the light/dark mode for the whole app and mirrors
 * the choice onto `<html data-mode>` so global CSS variables can respond.
 * First render is always "light" (SSR safe); a client `useEffect` flips it to
 * the stored or system-preference value on hydration.
 */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ mode: Mode; explicit: boolean }>({
    mode: "light",
    explicit: false,
  });

  useEffect(() => {
    setState(readInitialMode());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-mode", state.mode);
    return () => {
      // On unmount we leave the attribute in place — this component only
      // unmounts on full teardown.
    };
  }, [state.mode]);

  // Follow system preference silently until the user opts in explicitly.
  useEffect(() => {
    if (state.explicit) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      setState((s) =>
        s.explicit ? s : { mode: e.matches ? "dark" : "light", explicit: false },
      );
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [state.explicit]);

  const setMode = useCallback((m: Mode) => {
    setState({ mode: m, explicit: true });
    try {
      window.localStorage.setItem(STORAGE_KEY, m);
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setMode(state.mode === "dark" ? "light" : "dark");
  }, [state.mode, setMode]);

  return (
    <ModeContext.Provider
      value={{ mode: state.mode, setMode, toggle, hasExplicit: state.explicit }}
    >
      {children}
    </ModeContext.Provider>
  );
}
