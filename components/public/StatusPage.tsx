"use client";

import Link from "next/link";
import { Fragment, useEffect, type ReactNode } from "react";
import PerchMark from "@/components/atoms/PerchMark";
import { useLanguage } from "@/contexts/LanguageContext";

interface StatusPageProps {
  code: string;
  title: string;
  body: string;
  actions: ReactNode;
}

/**
 * Shared frame for 404 and error screens: the nameplate, a large serif line
 * in a lit courtyard, and a way back. Lives outside the public layout, so it
 * follows the browser's language itself.
 */
export default function StatusPage({ code, title, body, actions }: StatusPageProps) {
  const { language, followBrowserLanguage } = useLanguage();
  useEffect(() => {
    followBrowserLanguage();
  }, [followBrowserLanguage]);

  return (
    <Fragment key={language}>
      <div className="flex-1 flex flex-col">
        <header className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center">
            <Link href="/?stay" className="nameplate-brand hover:opacity-80 transition-opacity">
              <PerchMark size={20} />
              <span>PerchCR</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-16">
            <div className="courtyard surface px-6 py-12 sm:px-12 sm:py-16 flex flex-col gap-5">
              <p className="kicker">{code}</p>
              <h1 className="landing-h1 max-w-xl">{title}</h1>
              <p className="text-base text-fg-muted max-w-md leading-relaxed">{body}</p>
              <div className="flex flex-wrap gap-3 pt-2">{actions}</div>
            </div>
          </div>
        </main>
      </div>
    </Fragment>
  );
}
