"use client";

import Link from "next/link";
import { Fragment, useEffect, type ReactNode } from "react";
import PerchMark from "@/components/atoms/PerchMark";
import ThemeToggle from "@/components/atoms/ThemeToggle";
import SignInButton from "@/components/public/SignInButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { t, type Language } from "@/lib/i18n";

/**
 * Frame for the public pages (landing, privacy, terms): the app's nameplate
 * as a header, and a footer with the legal links. Follows the browser's
 * language until the visitor picks one.
 */
export default function PublicShell({ children }: { children: ReactNode }) {
  const { language, followBrowserLanguage } = useLanguage();

  useEffect(() => {
    followBrowserLanguage();
  }, [followBrowserLanguage]);

  // Keyed on the language so every string re-renders when it changes.
  return (
    <Fragment key={language}>
      <div className="flex-1 flex flex-col">
        <PublicHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <PublicFooter />
      </div>
    </Fragment>
  );
}

function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  const next: Language = language === "es" ? "en" : "es";
  return (
    <button
      type="button"
      onClick={() => setLanguage(next)}
      className="btn btn-ghost btn-sm"
      aria-label={next === "es" ? "Ver en español" : "View in English"}
      lang={next}
    >
      {next === "es" ? "ES" : "EN"}
    </button>
  );
}

function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border backdrop-blur pt-[env(safe-area-inset-top)]"
      style={{ background: "color-mix(in oklab, var(--color-bg) 86%, transparent)" }}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 btn btn-secondary btn-sm"
      >
        {t("Skip to content")}
      </a>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center gap-3">
        <Link
          href="/?stay"
          className="nameplate-brand hover:opacity-80 transition-opacity"
          aria-label={t("PerchCR home")}
        >
          <PerchMark size={20} />
          <span>PerchCR</span>
        </Link>
        <nav aria-label={t("Sections")} className="hidden md:flex items-center gap-1 ml-6">
          <Link href="/?stay#features" className="btn btn-ghost btn-sm">
            {t("Features")}
          </Link>
          <Link href="/?stay#questions" className="btn btn-ghost btn-sm">
            {t("Questions")}
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <LanguageSwitch />
          <ThemeToggle />
          <div className="ml-2 hidden sm:block">
            <SignInButton />
          </div>
        </div>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2 max-w-sm">
          <span className="nameplate-brand">
            <PerchMark size={18} />
            <span>PerchCR</span>
          </span>
          <p className="lede text-sm">{t("A quiet place for your money to rest.")}</p>
          <p className="text-xs text-fg-subtle">{t("Made in Costa Rica.")}</p>
        </div>
        <nav aria-label={t("Legal")} className="flex flex-col gap-2 text-sm">
          <span className="label-sm">{t("Legal")}</span>
          <Link href="/privacy" className="text-fg-muted hover:text-fg">
            {t("Privacy policy")}
          </Link>
          <Link href="/terms" className="text-fg-muted hover:text-fg">
            {t("Terms of service")}
          </Link>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-8 text-xs text-fg-subtle">
        © {new Date().getFullYear()} PerchCR
      </div>
    </footer>
  );
}
