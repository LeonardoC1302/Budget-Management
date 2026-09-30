"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import { useAuth } from "@/contexts/AuthContext";
import { TESTERS, type TesterId } from "@/lib/firebase/auth";
import { usingEmulator } from "@/lib/firebase/client";

export default function LoginScreen() {
  const { signIn, signInTester } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn(tester?: TesterId) {
    setError(null);
    setSubmitting(true);
    try {
      if (tester) await signInTester(tester);
      else await signIn();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not sign in. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="surface p-8 flex flex-col gap-6 w-full max-w-sm">
        <div className="flex flex-col gap-2 text-center">
          <span className="label-sm">Welcome</span>
          <h1 className="heading-xl">Budget</h1>
          <p className="text-sm text-fg-muted">
            Track your income, expenses, budgets, and savings goals across
            devices.
          </p>
        </div>

        {error && (
          <div className="text-sm text-expense text-center">{error}</div>
        )}

        <Button
          size="lg"
          fullWidth
          onClick={() => handleSignIn()}
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Continue with Google"}
        </Button>

        {usingEmulator && (
          <div className="flex flex-col gap-2 border-t border-border pt-5">
            <span className="label-sm text-center">
              Local emulator · test data only
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TESTERS) as TesterId[]).map((id) => (
                <Button
                  key={id}
                  variant="secondary"
                  onClick={() => handleSignIn(id)}
                  disabled={submitting}
                >
                  {TESTERS[id].name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
