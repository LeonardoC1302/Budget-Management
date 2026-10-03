import type { Metadata } from "next";
import LegalPage from "@/components/public/LegalPage";
import { termsOfService } from "@/lib/legal/terms";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms for using PerchCR: what it is, what it isn't, your account and data, and the rules that apply.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalPage doc={termsOfService} />;
}
