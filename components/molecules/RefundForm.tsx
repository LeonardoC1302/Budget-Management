"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import DatePicker from "@/components/atoms/DatePicker";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import { useAccounts } from "@/hooks/useAccounts";
import { formatCurrency, todayISODate } from "@/lib/utils/format";
import type { NewTransaction, Transaction } from "@/lib/types";

import { t } from "@/lib/i18n";
interface RefundFormProps {
  // The expense being refunded.
  original: Transaction;
  // How much of it has already come back, in the original's currency.
  alreadyRefunded: number;
  // Present when editing an existing refund.
  initial?: Transaction;
  onSubmit: (input: NewTransaction) => void | Promise<void>;
}

/**
 * Records money coming back from an expense. The refund keeps the expense's
 * currency, category and tags so it offsets the same budget and tag totals.
 */
export default function RefundForm({
  original,
  alreadyRefunded,
  initial,
  onSubmit,
}: RefundFormProps) {
  const { accounts } = useAccounts();
  const remaining = Math.max(0, original.amount - alreadyRefunded);
  const [amount, setAmount] = useState(
    initial ? String(initial.amount) : remaining > 0 ? String(remaining) : "",
  );
  const [accountId, setAccountId] = useState(
    initial?.accountId ?? original.accountId,
  );
  const [date, setDate] = useState(initial?.date ?? todayISODate());
  const [description, setDescription] = useState(
    initial?.description ??
      (original.description ? `Refund · ${original.description}` : t("Refund")),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseFloat(amount);
  // When editing, this refund's own amount is part of `alreadyRefunded`.
  const ceiling = remaining + (initial?.amount ?? 0);
  const tooMuch = Number.isFinite(parsed) && parsed > ceiling + 0.005;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!Number.isFinite(parsed) || parsed <= 0 || tooMuch) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        type: "income",
        amount: parsed,
        currency: original.currency,
        accountId,
        categoryId: original.categoryId,
        description: description.trim(),
        date,
        refundOf: original.id,
        // The bank usually returns at the purchase's rate. Reuse it when the
        // money goes back to the same account.
        ...(original.rateSource && accountId === original.accountId
          ? { rateSource: original.rateSource }
          : {}),
        ...(original.tags?.length ? { tags: original.tags } : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Couldn't save the refund."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-fg-muted">
        {t("Refund for")}{" "}
        <span className="text-fg font-medium">
          {original.description || t("this expense")}
        </span>{" "}
        ({formatCurrency(original.amount, original.currency)}
        {alreadyRefunded > 0 && !initial
          ? t(", {0} already refunded", { "0": formatCurrency(alreadyRefunded, original.currency) })
          : ""}
        {t("). It lowers spending in the same category instead of counting as income.")}
      </p>

      <Input
        label={`Amount (${original.currency})`}
        name="refund-amount"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        required
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={
          tooMuch
            ? t("That's more than the {0} left to refund.", { "0": formatCurrency(ceiling, original.currency) })
            : undefined
        }
      />

      <Select
        label={t("Refunded to")}
        value={accountId}
        onChange={setAccountId}
        options={accounts.map((a) => ({ value: a.id, label: a.name }))}
      />

      <Input
        label={t("Description")}
        name="refund-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <DatePicker label={t("Date")} name="refund-date" required value={date} onChange={setDate} />

      {error && <p className="text-sm text-expense">{error}</p>}

      <Button
        type="submit"
        size="lg"
        fullWidth
        disabled={submitting || !Number.isFinite(parsed) || parsed <= 0 || tooMuch}
      >
        {submitting ? t("Saving…") : initial ? t("Save refund") : t("Record refund")}
      </Button>
    </form>
  );
}
