"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Account } from "@/lib/types";

import { t } from "@/lib/i18n";
interface ReconcileFormProps {
  account: Account;
  // Balance PerchCR computes, in the account's currency (negative = owed).
  balance: number;
  onSubmit: (actualBalance: number) => void | Promise<void>;
}

/**
 * Compare PerchCR's balance with the bank's. Cards are entered as the amount
 * owed, since that's the number the bank app shows.
 */
export default function ReconcileForm({
  account,
  balance,
  onSubmit,
}: ReconcileFormProps) {
  const isCard = account.type === "credit";
  const shown = isCard ? Math.max(0, -balance) : balance;
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseFloat(value);
  const valid = value.trim() !== "" && Number.isFinite(parsed);
  const actual = valid ? (isCard ? -parsed : parsed) : null;
  const diff = actual === null ? null : Math.round((actual - balance) * 100) / 100;
  const matches = diff !== null && Math.abs(diff) < 0.005;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (actual === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(actual);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Couldn't save."));
    } finally {
      setSubmitting(false);
    }
  }

  // For a card, a higher amount owed means the balance went down.
  const diffCopy =
    diff === null || matches
      ? null
      : isCard
        ? diff < 0
          ? t("The bank shows {0} more owed than PerchCR.", { "0": formatCurrency(-diff, account.currency) })
          : t("The bank shows {0} less owed than PerchCR.", { "0": formatCurrency(diff, account.currency) })
        : diff > 0
          ? t("The bank shows {0} more than PerchCR.", { "0": formatCurrency(diff, account.currency) })
          : t("The bank shows {0} less than PerchCR.", { "0": formatCurrency(-diff, account.currency) });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="surface-2 px-4 py-3 flex items-center justify-between gap-3 text-sm">
        <span className="text-fg-subtle">
          {isCard ? t("PerchCR says you owe") : t("PerchCR balance")}
        </span>
        <span className="text-fg font-medium tabular-nums">
          {formatCurrency(shown, account.currency)}
        </span>
      </div>

      <Input
        label={isCard ? t("Amount owed per the bank ({currency})", { currency: account.currency }) : t("Balance per the bank ({currency})", { currency: account.currency })}
        name="actual-balance"
        type="number"
        inputMode="decimal"
        step="0.01"
        placeholder={shown.toFixed(2)}
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        hint={
          account.reconciledAt
            ? t("Last reconciled {0}.", { "0": formatDate(account.reconciledAt) })
            : undefined
        }
      />

      {matches && (
        <p className="text-sm text-income">{t("They match. Nothing to adjust.")}</p>
      )}
      {diffCopy && (
        <p className="text-sm text-fg-muted">
          {diffCopy}{" "}
          {t("Saving adds a balance adjustment for the difference. It won't count as income or spending. If you find the missing transaction later, delete the adjustment and add it instead.")}
        </p>
      )}

      {error && <p className="text-sm text-expense">{error}</p>}

      <Button type="submit" size="lg" fullWidth disabled={!valid || submitting}>
        {submitting
          ? t("Saving…")
          : matches || !valid
            ? t("Mark as reconciled")
            : t("Adjust by {0}{1}", { "0": diff! > 0 ? "+" : "−", "1": formatCurrency(Math.abs(diff!), account.currency) })}
      </Button>
    </form>
  );
}
