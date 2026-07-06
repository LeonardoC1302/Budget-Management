"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn() {
    setError(null);
    setSubmitting(true);
    try {
      await signIn();
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
          onClick={handleSignIn}
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Continue with Google"}
        </Button>
      </div>
    </div>
  );
}
