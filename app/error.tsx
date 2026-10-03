"use client";

import Link from "next/link";
import { useEffect } from "react";
import StatusPage from "@/components/public/StatusPage";
import { t } from "@/lib/i18n";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      code={t("Error")}
      title={t("Something went wrong.")}
      body={t("An unexpected error stopped this page. Your data is safe. Try again, or head back home.")}
      actions={
        <>
          <button type="button" onClick={reset} className="btn btn-primary btn-lg">
            {t("Try again")}
          </button>
          <Link href="/home" className="btn btn-secondary btn-lg">
            {t("Open PerchCR")}
          </Link>
        </>
      }
    />
  );
}
