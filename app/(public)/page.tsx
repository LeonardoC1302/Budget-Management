import type { Metadata } from "next";
import Landing from "@/components/public/Landing";
import SignedInRedirect from "@/components/public/SignedInRedirect";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PerchCR",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web, Android, iOS",
  inLanguage: ["en", "es"],
  description:
    "Track accounts, spending, budgets and savings goals in colones and dollars. Log purchases in seconds, even offline.",
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // Structured data for search engines; static and authored here.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SignedInRedirect />
      <Landing />
    </>
  );
}
