"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import DatePicker from "@/components/atoms/DatePicker";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import { useAccounts } from "@/hooks/useAccounts";
import { formatCurrency, todayISODate } from "@/lib/utils/format";
import type { NewTransaction, Transaction } from "@/lib/types";

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
      (original.description ? `Refund · ${original.description}` : "Refund"),
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
      setError(err instanceof Error ? err.message : "Couldn't save the refund.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-fg-muted">
        Refund for{" "}
        <span className="text-fg font-medium">
          {original.description || "this expense"}
        </span>{" "}
        ({formatCurrency(original.amount, original.currency)}
        {alreadyRefunded > 0 && !initial
          ? `, ${formatCurrency(alreadyRefunded, original.currency)} already refunded`
          : ""}
        ). It lowers spending in the same category instead of counting as
        income.
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
            ? `That's more than the ${formatCurrency(ceiling, original.currency)} left to refund.`
            : undefined
        }
      />

      <Select
        label="Refunded to"
        value={accountId}
        onChange={setAccountId}
        options={accounts.map((a) => ({ value: a.id, label: a.name }))}
      />

      <Input
        label="Description"
        name="refund-description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <DatePicker label="Date" name="refund-date" required value={date} onChange={setDate} />

      {error && <p className="text-sm text-expense">{error}</p>}

      <Button
        type="submit"
        size="lg"
        fullWidth
        disabled={submitting || !Number.isFinite(parsed) || parsed <= 0 || tooMuch}
      >
        {submitting ? "Saving…" : initial ? "Save refund" : "Record refund"}
      </Button>
    </form>
  );
}
