"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

/** Shared by public pages and the app: language and sign-in state. */
export default function RootProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>{children}</AuthProvider>
    </LanguageProvider>
  );
}
