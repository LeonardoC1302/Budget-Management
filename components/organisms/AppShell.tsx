"use client";

import type { ReactNode } from "react";
import { AccessProvider } from "@/contexts/AccessContext";
import AuthGate from "@/components/organisms/AuthGate";

/** Wraps the signed-in app: shared-budget access, sign-in gate, lock, nav. */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <AccessProvider>
      <AuthGate>{children}</AuthGate>
    </AccessProvider>
  );
}
