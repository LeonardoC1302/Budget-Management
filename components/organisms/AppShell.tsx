"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { AccessProvider } from "@/contexts/AccessContext";
import AuthGate from "@/components/organisms/AuthGate";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AccessProvider>
        <AuthGate>{children}</AuthGate>
      </AccessProvider>
    </AuthProvider>
  );
}
