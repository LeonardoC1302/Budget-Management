"use client";

import type { ReactNode } from "react";
import BottomNav from "@/components/organisms/BottomNav";
import LoadingScreen from "@/components/molecules/LoadingScreen";
import LoginScreen from "@/components/molecules/LoginScreen";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <LoginScreen />;

  return (
    <>
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-6 pb-28 sm:px-6">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
