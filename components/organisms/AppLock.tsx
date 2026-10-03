"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Button from "@/components/atoms/Button";
import PerchMark from "@/components/atoms/PerchMark";
import { useAuth } from "@/contexts/AuthContext";
import { t } from "@/lib/i18n";
import {
  readLockSettings,
  removeLock,
  verifyBiometric,
  verifyPin,
  type LockSettings,
} from "@/lib/lock/appLock";
import { hasUnsyncedChanges } from "@/lib/offline/syncStatus";

const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30_000;

// Survives remounts (the tree remounts when the language changes) but not a
// reload, so a fresh launch still starts locked.
let unlockedThisSession = false;

/**
 * Covers the app until the user unlocks with their PIN or fingerprint.
 * Children stay mounted (so a half-filled form survives) but are hidden and
 * inert while locked. Locks on launch, and again when the app returns from
 * the background after the chosen delay.
 */
export default function AppLock({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  // AppLock only renders for a signed-in user on the client, so the device
  // settings can be read up front. A fresh launch starts locked.
  const [settings, setSettings] = useState<LockSettings | null>(() =>
    uid ? readLockSettings(uid) : null,
  );
  const [locked, setLocked] = useState(() => !!settings && !unlockedThisSession);
  const hiddenAt = useRef<number | null>(null);

  useEffect(() => {
    if (!uid) return;
    const onChange = () => setSettings(readLockSettings(uid));
    window.addEventListener("perch:lock-changed", onChange);
    return () => window.removeEventListener("perch:lock-changed", onChange);
  }, [uid]);

  useEffect(() => {
    if (!settings) return;
    function lock() {
      unlockedThisSession = false;
      setLocked(true);
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        hiddenAt.current = Date.now();
        // "Immediately" also hides the app from the app-switcher preview.
        if (settings!.timeoutMinutes === 0) lock();
        return;
      }
      const away = hiddenAt.current ? Date.now() - hiddenAt.current : 0;
      if (away >= settings!.timeoutMinutes * 60_000) lock();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [settings]);

  const showLock = !!settings && locked && !!uid;

  // The hidden app underneath still has its full size; without this the lock
  // screen could be scrolled (or panned sideways on a phone) over it.
  useEffect(() => {
    if (!showLock) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [showLock]);

  return (
    <>
      <div
        aria-hidden={showLock || undefined}
        inert={showLock || undefined}
        style={showLock ? { visibility: "hidden" } : undefined}
        className="contents"
      >
        {children}
      </div>
      {showLock && (
        <LockScreen
          uid={uid!}
          settings={settings!}
          onUnlock={() => {
            unlockedThisSession = true;
            setLocked(false);
          }}
        />
      )}
    </>
  );
}

function LockScreen({
  uid,
  settings,
  onUnlock,
}: {
  uid: string;
  settings: LockSettings;
  onUnlock: () => void;
}) {
  const { signOut } = useAuth();
  const [pin, setPin] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldownUntil <= now) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil, now]);
  const coolingDown = cooldownUntil > now;

  const check = useCallback(
    async (value: string) => {
      setChecking(true);
      const ok = await verifyPin(uid, value);
      setChecking(false);
      if (ok) {
        onUnlock();
        return;
      }
      const next = attempts + 1;
      setAttempts(next);
      setPin("");
      if (next >= MAX_ATTEMPTS) {
        setCooldownUntil(Date.now() + COOLDOWN_MS);
        setNow(Date.now());
        setAttempts(0);
        setError(t("Too many tries. Wait 30 seconds."));
      } else {
        setError(t("That PIN isn't right."));
      }
      inputRef.current?.focus();
    },
    [uid, attempts, onUnlock],
  );

  async function handleBiometric() {
    setError(null);
    if (await verifyBiometric(uid)) onUnlock();
    else setError(t("Fingerprint didn't work. Use your PIN."));
  }

  async function handleForgot() {
    if (hasUnsyncedChanges()) {
      setError(
        t("Some changes haven't synced yet. Connect to the internet first, or they'll be lost."),
      );
      return;
    }
    removeLock(uid);
    await signOut();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      style={{ background: "var(--color-bg)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-title"
    >
      <div className="w-full max-w-xs flex flex-col items-center gap-6 text-center">
        <PerchMark size={32} />
        <div className="flex flex-col gap-1">
          <h1 id="lock-title" className="heading-lg">
            {t("PerchCR is locked")}
          </h1>
          <p className="text-sm text-fg-muted">
            {settings.credentialId
              ? t("Use your fingerprint or enter your PIN.")
              : t("Enter your PIN.")}
          </p>
        </div>

        <form
          className="w-full flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (pin.length >= 4 && !coolingDown) void check(pin);
          }}
        >
          <label htmlFor="lock-pin" className="sr-only">
            {t("PIN")}
          </label>
          <input
            id="lock-pin"
            ref={inputRef}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            maxLength={settings.pinLength}
            value={pin}
            disabled={checking || coolingDown}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setPin(value);
              setError(null);
              if (value.length === settings.pinLength) void check(value);
            }}
            className="input text-center text-2xl tracking-[0.6em]"
          />
          {error && (
            <p role="alert" className="text-sm text-expense">
              {coolingDown
                ? t("Too many tries. Try again in {seconds}s.", {
                    seconds: Math.ceil((cooldownUntil - now) / 1000),
                  })
                : error}
            </p>
          )}
        </form>

        {settings.credentialId && (
          <Button variant="secondary" fullWidth onClick={handleBiometric}>
            {t("Use fingerprint or face")}
          </Button>
        )}

        <button
          type="button"
          onClick={handleForgot}
          className="text-xs text-fg-subtle underline underline-offset-2 hover:text-fg"
        >
          {t("Forgot your PIN? Sign out and sign back in with Google.")}
        </button>
      </div>
    </div>
  );
}
