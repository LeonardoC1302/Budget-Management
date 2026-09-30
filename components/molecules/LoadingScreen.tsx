"use client";

import { t } from "@/lib/i18n";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="surface p-8 text-center text-sm text-fg-muted">
        {t("Loading…")}
      </div>
    </div>
  );
}
