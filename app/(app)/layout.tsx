import type { Metadata } from "next";
import AppShell from "@/components/organisms/AppShell";

// App screens sit behind sign-in; search engines would only ever see the
// sign-in card, so keep them out of results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
