"use client";

import { Fragment, type ReactNode } from "react";
import AppLock from "@/components/organisms/AppLock";
import BottomNav from "@/components/organisms/BottomNav";
import Onboarding from "@/components/organisms/Onboarding";
import StatusToasts from "@/components/organisms/StatusToasts";
import LoadingScreen from "@/components/molecules/LoadingScreen";
import LoginScreen from "@/components/molecules/LoginScreen";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { CategoriesProvider } from "@/contexts/CategoriesContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { useRecurringMaterializer } from "@/hooks/useRecurringMaterializer";

function AuthenticatedShell({ children }: { children: ReactNode }) {
  useRecurringMaterializer();
  return (
    <PreferencesProvider>
      <CategoriesProvider>
        <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-28 sm:px-6">
          {children}
        </main>
        <StatusToasts />
        <BottomNav />
      </CategoriesProvider>
    </PreferencesProvider>
  );
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, needsOnboarding } = useAuth();
  const { language } = useLanguage();

  // Keyed on the language so every screen re-renders its text when it
  // changes (translations are read at render time).
  let content: ReactNode;
  if (loading) content = <LoadingScreen />;
  else if (!user) content = <LoginScreen />;
  else if (needsOnboarding) content = <Onboarding />;
  else {
    content = (
      <AppLock>
        <AuthenticatedShell>{children}</AuthenticatedShell>
      </AppLock>
    );
  }
  return <Fragment key={language}>{content}</Fragment>;
}
