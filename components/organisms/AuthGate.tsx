"use client";

import type { ReactNode } from "react";
import BottomNav from "@/components/organisms/BottomNav";
import LoadingScreen from "@/components/molecules/LoadingScreen";
import LoginScreen from "@/components/molecules/LoginScreen";
import { useAuth } from "@/contexts/AuthContext";
import { CategoriesProvider } from "@/contexts/CategoriesContext";
import { useRecurringMaterializer } from "@/hooks/useRecurringMaterializer";

function AuthenticatedShell({ children }: { children: ReactNode }) {
  useRecurringMaterializer();
  return (
    <CategoriesProvider>
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-28 sm:px-6">
        {children}
      </main>
      <BottomNav />
    </CategoriesProvider>
  );
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <LoginScreen />;

  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}
