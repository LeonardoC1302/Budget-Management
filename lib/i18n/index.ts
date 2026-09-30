import { es } from "@/lib/i18n/es";

// English text is the key. The Spanish dictionary maps each English template
// to its translation; anything missing falls back to English, so a new string
// never renders blank. Templates use {name} placeholders.
//
// The current language lives at module level so plain helpers (formatDate,
// formatCurrency, monthLabel) can follow it without React. LanguageProvider
// sets it and remounts the tree when it changes.

export type Language = "en" | "es";

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
];

const STORAGE_KEY = "perch:language";

let current: Language = "en";

export function getLanguage(): Language {
  return current;
}

export function setLanguage(language: Language): void {
  current = language;
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Storage blocked: the choice still applies for this session.
  }
}

/** Language saved on this device, if any. */
export function storedLanguage(): Language | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "en" || v === "es" ? v : null;
  } catch {
    return null;
  }
}

/** Best guess for a first run: the browser's language. */
export function browserLanguage(): Language {
  if (typeof navigator === "undefined") return "en";
  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

/** BCP 47 locale for Intl formatting. Spanish uses Costa Rica's conventions. */
export function getLocale(): string {
  return current === "es" ? "es-CR" : "en-US";
}

type Vars = Record<string, string | number>;

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, key: string) =>
    key in vars ? String(vars[key]) : m,
  );
}

export function t(text: string, vars?: Vars): string {
  const template = current === "es" ? (es[text] ?? text) : text;
  return interpolate(template, vars);
}

/** Pick singular or plural, then translate. `{count}` is always available. */
export function tn(one: string, other: string, count: number, vars?: Vars): string {
  return t(count === 1 ? one : other, { count, ...vars });
}
