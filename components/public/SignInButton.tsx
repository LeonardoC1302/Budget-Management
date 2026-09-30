"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TESTERS, type TesterId } from "@/lib/firebase/auth";
import { usingEmulator } from "@/lib/firebase/client";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

interface SignInButtonProps {
  size?: "md" | "lg";
  className?: string;
  // Show the local-emulator tester buttons under the main action (dev only).
  withTesters?: boolean;
}

/**
 * The public pages' one action. Signed out: Google sign-in, then into the
 * app. Signed in: a plain link to the app.
 */
export default function SignInButton({
  size = "md",
  className,
  withTesters = false,
}: SignInButtonProps) {
  const { user, loading, signIn, signInTester } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sizeClass = size === "lg" ? "btn-lg" : "";

  async function handle(tester?: TesterId) {
    setError(null);
    setBusy(true);
    try {
      if (tester) await signInTester(tester);
      else await signIn();
      router.push("/home");
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      // Closing the Google popup isn't an error worth showing.
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError(t("Could not sign in. Try again."));
      }
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    return (
      <Link href="/home" className={cn("btn btn-primary", sizeClass, className)}>
        {t("Open Perch")}
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => handle()}
        disabled={busy || loading}
        className={cn("btn btn-primary", sizeClass, className)}
      >
        <GoogleMark />
        {busy ? t("Signing in…") : t("Continue with Google")}
      </button>
      {error && (
        <p role="alert" className="text-xs text-fg-muted">
          {error}
        </p>
      )}
      {withTesters && usingEmulator && (
        <div className="flex gap-2">
          {(Object.keys(TESTERS) as TesterId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => handle(id)}
              disabled={busy}
              className="btn btn-secondary btn-sm"
            >
              {TESTERS[id].name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Google's "G", drawn in one color so it sits on the button's own ink.
function GoogleMark() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.35 11.1H12v2.98h5.36c-.23 1.4-1.66 4.1-5.36 4.1-3.23 0-5.86-2.67-5.86-5.96s2.63-5.96 5.86-5.96c1.84 0 3.07.78 3.78 1.46l2.58-2.49C16.73 3.7 14.6 2.7 12 2.7 6.87 2.7 2.7 6.87 2.7 12s4.17 9.3 9.3 9.3c5.37 0 8.93-3.78 8.93-9.1 0-.61-.07-1.08-.16-1.55z" />
    </svg>
  );
}
