import type { Metadata } from "next";
import LegalPage from "@/components/public/LegalPage";
import { privacyPolicy } from "@/lib/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What PerchCR collects, why, who processes it, how long it's kept, and how to export or delete your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalPage doc={privacyPolicy} />;
}
