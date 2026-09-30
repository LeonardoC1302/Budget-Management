"use client";

import { useEffect, useState } from "react";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import RouteMasthead from "@/components/molecules/RouteMasthead";
import { useAuth } from "@/contexts/AuthContext";
import { t, tn } from "@/lib/i18n";
import {
  disableBiometric,
  enableBiometric,
  isBiometricAvailable,
  isValidPin,
  LOCK_TIMEOUTS,
  readLockSettings,
  removeLock,
  setLockTimeout,
  setPin,
  verifyPin,
  type LockSettings,
} from "@/lib/lock/appLock";

type Mode = "idle" | "set" | "change" | "remove";

export default function SecurityPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const [settings, setSettings] = useState<LockSettings | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [mode, setMode] = useState<Mode>("idle");
  const [current, setCurrent] = useState("");
  const [pin, setPinValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    const load = () => setSettings(readLockSettings(uid));
    load();
    window.addEventListener("perch:lock-changed", load);
    isBiometricAvailable().then(setBiometricAvailable);
    return () => window.removeEventListener("perch:lock-changed", load);
  }, [uid]);

  function reset(next: Mode = "idle") {
    setMode(next);
    setCurrent("");
    setPinValue("");
    setConfirm("");
    setError(null);
  }

  async function run(action: () => Promise<void>, done: string) {
    setBusy(true);
    setError(null);
    try {
      await action();
      setNotice(done);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Something went wrong."));
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (mode !== "set" && !(await verifyPin(uid, current))) {
      setError(t("Your current PIN isn't right."));
      return;
    }
    if (mode === "remove") {
      await run(async () => removeLock(uid), t("App lock is off."));
      return;
    }
    if (!isValidPin(pin)) {
      setError(t("PIN must be 4 to 6 digits."));
      return;
    }
    if (pin !== confirm) {
      setError(t("The two PINs don't match."));
      return;
    }
    // Setting a PIN needs no extra confirmation: the status line already says the lock is on.
    await run(() => setPin(uid, pin), mode === "set" ? "" : t("PIN changed."));
  }

  async function toggleBiometric() {
    if (!settings) return;
    if (settings.credentialId) {
      disableBiometric(uid);
      setNotice(t("Fingerprint unlock is off."));
      return;
    }
    await run(
      () => enableBiometric(uid, user?.email ?? user?.displayName ?? "Perch"),
      t("Fingerprint unlock is on."),
    );
  }

  const timeoutOptions = LOCK_TIMEOUTS.map((m) => ({
    value: String(m),
    label:
      m === 0
        ? t("Immediately")
        : tn("After {count} minute", "After {count} minutes", m),
  }));

  const pinField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    name: string,
  ) => (
    <Input
      label={label}
      name={name}
      type="password"
      inputMode="numeric"
      autoComplete="off"
      maxLength={6}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <RouteMasthead kicker={t("Settings")} title={t("App lock")} />

      <p className="lede text-sm">
        {t(
          "Ask for a PIN, or your fingerprint or face, when Perch opens on this device. It's set per device: locking your phone doesn't lock your laptop.",
        )}
      </p>

      {notice && <p className="text-sm text-income">{notice}</p>}

      <section className="surface p-5 flex flex-col gap-4">
        {!settings && mode === "idle" && (
          <>
            <p className="text-sm text-fg-muted">{t("App lock is off on this device.")}</p>
            <Button onClick={() => reset("set")}>{t("Set a PIN")}</Button>
          </>
        )}

        {settings && mode === "idle" && (
          <>
            <p className="text-sm text-fg">{t("App lock is on.")}</p>
            <Select
              label={t("Lock again after leaving the app")}
              value={String(settings.timeoutMinutes)}
              onChange={(v) => {
                setLockTimeout(uid, Number(v));
                setNotice(null);
              }}
              options={timeoutOptions}
            />
            {biometricAvailable ? (
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>{t("Unlock with fingerprint or face")}</span>
                <input
                  type="checkbox"
                  checked={!!settings.credentialId}
                  onChange={toggleBiometric}
                  disabled={busy}
                />
              </label>
            ) : (
              <p className="text-xs text-fg-subtle">
                {t("This device doesn't offer fingerprint or face unlock to the browser.")}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => reset("change")}>
                {t("Change PIN")}
              </Button>
              <Button variant="ghost" onClick={() => reset("remove")}>
                {t("Turn off")}
              </Button>
            </div>
          </>
        )}

        {mode !== "idle" && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
          >
            {mode !== "set" && pinField(t("Current PIN"), current, setCurrent, "current-pin")}
            {mode !== "remove" && (
              <>
                {pinField(t("New PIN (4 to 6 digits)"), pin, setPinValue, "new-pin")}
                {pinField(t("Repeat the new PIN"), confirm, setConfirm, "confirm-pin")}
              </>
            )}
            {error && <p className="text-sm text-expense">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => reset()}>
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={busy}>
                {mode === "remove" ? t("Turn off app lock") : t("Save PIN")}
              </Button>
            </div>
          </form>
        )}
      </section>

      <p className="text-xs text-fg-subtle">
        {t(
          "The lock keeps someone holding your unlocked phone out of Perch. It doesn't encrypt the data stored on this device. If you forget the PIN, sign out and sign back in with Google.",
        )}
      </p>
    </div>
  );
}
