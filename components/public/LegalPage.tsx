"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";
import type { LegalDocument } from "@/lib/legal/types";

/** Renders a legal document in the current language, in the app's room. */
export default function LegalPage({
  doc,
}: {
  doc: { en: LegalDocument; es: LegalDocument };
}) {
  const { language } = useLanguage();
  const d = doc[language];
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 pt-14 sm:pt-20">
      <p className="kicker">{t("Legal")}</p>
      <h1 className="landing-h2 mt-3">{d.title}</h1>
      <p className="text-xs text-fg-subtle mt-3">{d.updated}</p>
      <div className="legal mt-8">
        <p className="!text-fg text-base">{d.intro}</p>
        {d.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.blocks.map((block, i) =>
              "p" in block ? (
                <p key={i}>{block.p}</p>
              ) : (
                <ul key={i}>
                  {block.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ),
            )}
          </section>
        ))}
      </div>
      <p className="mt-12 text-sm">
        <Link href="/?stay" className="text-fg-muted hover:text-fg underline underline-offset-4">
          {t("Back to Perch")}
        </Link>
      </p>
    </article>
  );
}
