"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import {
  signInAsTester,
  signInWithGoogle,
  signOutUser,
  type TesterId,
} from "@/lib/firebase/auth";
import { ensureUserSeed, upsertUserProfile } from "@/lib/firebase/seed";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  // Dev-only. Throws unless the app is running against the local emulator.
  signInTester: (id: TesterId) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      ensureUserSeed(nextUser.uid)
        .then(() => upsertUserProfile(nextUser))
        .catch((err) => {
          console.error("Failed to seed user data", err);
        })
        .finally(() => {
          setUser(nextUser);
          setLoading(false);
        });
    });
    return () => unsub();
  }, []);

  const signIn = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const signInTester = useCallback(async (id: TesterId) => {
    await signInAsTester(id);
  }, []);

  const signOut = useCallback(async () => {
    await signOutUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInTester, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
