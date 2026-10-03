"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import RouteMasthead from "@/components/molecules/RouteMasthead";
import { useSyncState } from "@/hooks/useOfflineSync";
import { deleteAccountAndData, type DeleteStep } from "@/lib/firebase/deleteAccount";
import { t } from "@/lib/i18n";

const STEP_LABELS: Record<DeleteStep, string> = {
  verifying: "Confirming it's you…",
  data: "Deleting your data…",
  connections: "Removing your connections…",
  account: "Deleting your account…",
  done: "Done.",
};

export default function DeleteAccountPage() {
  const sync = useSyncState();
  const [confirmText, setConfirmText] = useState("");
  const [step, setStep] = useState<DeleteStep | null>(null);
  const [error, setError] = useState<string | null>(null);

  const word = t("DELETE");
  const confirmed = confirmText.trim().toUpperCase() === word.toUpperCase();
  const busy = step !== null && step !== "done";
  const unsynced = sync.pendingWrites > 0 || sync.queuedFromEarlier;

  async function handleDelete() {
    setError(null);
    try {
      await deleteAccountAndData(setStep);
      // Firestore was shut down; a full load gives a clean slate.
      window.location.href = "/?stay&deleted";
    } catch (err) {
      setStep(null);
      const code = (err as { code?: string; message?: string } | null)?.code;
      const message = err instanceof Error ? err.message : "";
      if (message === "offline") {
        setError(t("You're offline. Connect to the internet to delete your account."));
      } else if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setError(t("Sign-in was cancelled, so nothing was deleted."));
      } else if (code === "auth/user-mismatch") {
        setError(t("Sign in with the same Google account you want to delete."));
      } else {
        setError(t("Something went wrong and your account wasn't fully deleted. Try again; anything already removed stays removed."));
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <RouteMasthead kicker={t("Settings")} title={t("Delete account")} />

      <section className="surface p-5 flex flex-col gap-4">
        <p className="text-sm text-fg">
          {t("This permanently deletes your PerchCR account and everything in it:")}
        </p>
        <ul className="text-sm text-fg-muted flex flex-col gap-1 list-disc pl-5">
          <li>{t("Accounts, cards, transactions and categories")}</li>
          <li>{t("Budgets, goals, recurring items and investments")}</li>
          <li>{t("Recently deleted items and your connections")}</li>
        </ul>
        <p className="text-sm text-fg-muted">
          {t("It can't be undone. Entries you added to someone else's shared budget stay in their budget.")}
        </p>
        <p className="text-sm">
          <Link href="/settings/data" className="underline underline-offset-4">
            {t("Export your transactions first")}
          </Link>
        </p>
      </section>

      <section className="surface p-5 flex flex-col gap-4">
        <Input
          label={t("Type {word} to confirm", { word })}
          name="confirm-delete"
          autoComplete="off"
          autoCapitalize="characters"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={busy}
        />
        {unsynced && (
          <p className="text-sm text-fg-muted">
            {t("Some changes haven't synced yet. They'll be deleted along with everything else.")}
          </p>
        )}
        {step && (
          <p role="status" className="text-sm text-fg-muted">
            {t(STEP_LABELS[step])}
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-expense">
            {error}
          </p>
        )}
        <Button
          variant="danger"
          size="lg"
          fullWidth
          disabled={!confirmed || busy || !sync.online}
          onClick={handleDelete}
        >
          {busy ? t("Deleting…") : t("Delete my account and data")}
        </Button>
        <p className="text-xs text-fg-subtle">
          {t("You'll be asked to sign in with Google once more to confirm it's you.")}
        </p>
      </section>
    </div>
  );
}
