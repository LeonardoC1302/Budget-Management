"use client";

import Link from "next/link";
import RouteMasthead from "@/components/molecules/RouteMasthead";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { updateLanguage } from "@/lib/firebase/seed";

import { LANGUAGES, t, type Language } from "@/lib/i18n";
interface SettingsLink {
  href: string;
  title: string;
  description: string;
}

const SECTIONS: { heading: string; links: SettingsLink[] }[] = [
  {
    heading: "Sharing",
    links: [
      {
        href: "/settings/connections",
        title: "Connections",
        description: "Manage the people you share your money with.",
      },
    ],
  },
  {
    heading: "Privacy",
    links: [
      {
        href: "/settings/security",
        title: "App lock",
        description: "Ask for a PIN or fingerprint when PerchCR opens on this device.",
      },
    ],
  },
  {
    heading: "Your data",
    links: [
      {
        href: "/settings/data",
        title: "Import & export",
        description: "Download your transactions as CSV, or bring them in from a spreadsheet.",
      },
      {
        href: "/settings/trash",
        title: "Recently deleted",
        description: "Restore anything deleted in the last 30 days.",
      },
      {
        href: "/settings/delete-account",
        title: "Delete account",
        description: "Permanently delete your account and all its data.",
      },
    ],
  },
  {
    heading: "About",
    links: [
      {
        href: "/?stay",
        title: "PerchCR website",
        description: "The public home page.",
      },
      {
        href: "/privacy",
        title: "Privacy policy",
        description: "What PerchCR collects and how it's used.",
      },
      {
        href: "/terms",
        title: "Terms of service",
        description: "The rules for using PerchCR.",
      },
    ],
  },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();

  function chooseLanguage(next: Language) {
    setLanguage(next);
    if (user) updateLanguage(user.uid, next).catch(() => {});
  }

  return (
    <div className="flex flex-col gap-8">
      <RouteMasthead kicker={t("PerchCR")} title={t("Settings")} />

      <section className="flex flex-col gap-3">
        <h2 className="label-sm">{t("Language")}</h2>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.value}
              type="button"
              aria-pressed={language === l.value}
              onClick={() => chooseLanguage(l.value)}
              className={language === l.value ? "btn btn-primary" : "btn btn-secondary"}
            >
              {l.label}
            </button>
          ))}
        </div>
      </section>

      {SECTIONS.map((section) => (
        <section key={section.heading} className="flex flex-col gap-3">
          <h2 className="label-sm">{t(section.heading)}</h2>
          <ul className="rooms">
            {section.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-surface-2 transition-colors"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <span className="text-sm text-fg">{t(link.title)}</span>
                    <span className="text-xs text-fg-subtle">
                      {t(link.description)}
                    </span>
                  </div>
                  <span aria-hidden className="text-fg-subtle">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
