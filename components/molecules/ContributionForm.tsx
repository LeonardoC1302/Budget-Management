"use client";

import { useMemo, useState } from "react";
import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import DatePicker from "@/components/atoms/DatePicker";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import type { GoalReservation } from "@/hooks/useAccounts";
import { todayISODate } from "@/lib/utils/format";
import type { Account, NewGoalContribution } from "@/lib/types";

interface ContributionFormProps {
  goalId: string;
  goalCurrency: string;
  accounts: Account[];
  balances: Record<string, number>;
  reservationsByAccount: Record<string, GoalReservation[]>;
  onSubmit: (input: NewGoalContribution) => void | Promise<void>;
  onCancel?: () => void;
}

function freeOnAccount(
  accountId: string,
  balances: Record<string, number>,
  reservationsByAccount: Record<string, GoalReservation[]>,
): number {
  const balance = balances[accountId] ?? 0;
  const reserved = (reservationsByAccount[accountId] ?? []).reduce(
    (s, r) => s + r.amount,
    0,
  );
  return balance - reserved;
}

export default function ContributionForm({
  goalId,
  goalCurrency,
  accounts,
  balances,
  reservationsByAccount,
  onSubmit,
  onCancel,
}: ContributionFormProps) {
  const eligibleAccounts = useMemo(
    () =>
      accounts.filter(
        (a) => a.type !== "credit" && a.currency === goalCurrency,
      ),
    [accounts, goalCurrency],
  );

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISODate());
  const [accountId, setAccountId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const effectiveAccountId =
    eligibleAccounts.find((a) => a.id === accountId)?.id ??
    eligibleAccounts[0]?.id ??
    "";

  const available = effectiveAccountId
    ? freeOnAccount(effectiveAccountId, balances, reservationsByAccount)
    : 0;

  const parsed = parseFloat(amount);
  const hasAmount = Number.isFinite(parsed) && parsed > 0;
  const exceedsAvailable = hasAmount && parsed > available;

  if (eligibleAccounts.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-fg-muted">
          You need an account in {goalCurrency} to reserve money for this goal.
          Add one first.
        </p>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onCancel}
          >
            Close
          </Button>
        )}
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!hasAmount || !effectiveAccountId) return;
    if (exceedsAvailable) return;

    setSubmitting(true);
    await onSubmit({
      goalId,
      amount: parsed,
      note: note.trim() || undefined,
      date,
      accountId: effectiveAccountId,
    });
    setSubmitting(false);
  }

  const canSubmit = !submitting && hasAmount && !exceedsAvailable;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select
        label="Account"
        name="account"
        value={effectiveAccountId}
        onChange={setAccountId}
        options={eligibleAccounts.map((a) => ({
          value: a.id,
          label: `${a.name} (${a.currency})`,
        }))}
      />

      <div className="flex flex-col gap-1">
        <Input
          label={`Amount (${goalCurrency})`}
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div className="flex items-center gap-1 text-xs text-fg-subtle">
          <span>Available:</span>
          <Amount
            value={available}
            tone={available > 0 ? "neutral" : "expense"}
            size="sm"
            currency={goalCurrency}
          />
        </div>
        {exceedsAvailable && (
          <p className="text-xs text-expense">
            Amount exceeds what&apos;s free on this account.
          </p>
        )}
        {!exceedsAvailable && available <= 0 && (
          <p className="text-xs text-expense">
            This account has nothing free to reserve. Pick another or free up
            some balance.
          </p>
        )}
      </div>

      <Input
        label="Note"
        name="note"
        placeholder="Optional"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <DatePicker
        label="Date"
        name="date"
        required
        value={date}
        onChange={setDate}
      />

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" size="lg" fullWidth disabled={!canSubmit}>
          {submitting ? "Adding…" : "Add contribution"}
        </Button>
      </div>
    </form>
  );
}
