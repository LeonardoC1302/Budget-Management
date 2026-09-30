"use client";

import Link from "next/link";
import StatusPage from "@/components/public/StatusPage";
import { t } from "@/lib/i18n";

export default function NotFoundContent() {
  return (
    <StatusPage
      code="404"
      title={t("Nothing is perched here.")}
      body={t("The page you're looking for doesn't exist or has moved.")}
      actions={
        <>
          <Link href="/home" className="btn btn-primary btn-lg">
            {t("Open Perch")}
          </Link>
          <Link href="/?stay" className="btn btn-secondary btn-lg">
            {t("Go to the home page")}
          </Link>
        </>
      }
    />
  );
}
