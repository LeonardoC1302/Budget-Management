"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import DatePicker from "@/components/atoms/DatePicker";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import { useAccounts } from "@/hooks/useAccounts";
import { todayISODate } from "@/lib/utils/format";
import {
  RECURRENCE_FREQUENCY_LABELS,
  type Holding,
  type NewRecurringTransaction,
  type RecurrenceFrequency,
  type RecurringTransaction,
} from "@/lib/types";

import { t } from "@/lib/i18n";
interface RecurringContributionFormProps {
  holdings: Holding[];
  initial?: RecurringTransaction;
  // Lock the holding (when opened from a holding's own panel).
  holdingId?: string;
  onSubmit: (input: NewRecurringTransaction) => void | Promise<void>;
  onCancel?: () => void;
}

// Semi-monthly needs two day pickers; contributions rarely use it, so the
// simpler cadences are offered here.
const FREQUENCIES: RecurrenceFrequency[] = ["monthly", "biweekly", "weekly", "yearly"];

/**
 * A standing buy into a holding: the amount leaves the chosen account on each
 * date and is priced at that day's close when it's recorded.
 */
export default function RecurringContributionForm({
  holdings,
  initial,
  holdingId: lockedHoldingId,
  onSubmit,
  onCancel,
}: RecurringContributionFormProps) {
  const { accounts } = useAccounts();
  const fundingAccounts = accounts.filter((a) => a.type !== "credit");

  const [holdingId, setHoldingId] = useState(
    lockedHoldingId ?? initial?.holdingId ?? holdings[0]?.id ?? "",
  );
  const [accountId, setAccountId] = useState(
    initial?.accountId ?? fundingAccounts[0]?.id ?? "",
  );
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    initial?.frequency ?? "monthly",
  );
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayISODate());
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveAccountId =
    fundingAccounts.find((a) => a.id === accountId)?.id ?? fundingAccounts[0]?.id ?? "";
  const account = fundingAccounts.find((a) => a.id === effectiveAccountId);
  const holding = holdings.find((h) => h.id === holdingId);
  const parsed = parseFloat(amount);
  const valid =
    !!holding && !!account && Number.isFinite(parsed) && parsed > 0 &&
    (!endDate || endDate >= startDate);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || !holding || !account) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        type: "investment",
        amount: parsed,
        currency: account.currency,
        accountId: account.id,
        categoryId: "",
        description: initial?.description || `Contribution · ${holding.name}`,
        frequency,
        startDate,
        ...(endDate ? { endDate } : {}),
        active: initial?.active ?? true,
        holdingId: holding.id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Couldn't save."));
    } finally {
      setSubmitting(false);
    }
  }

  if (fundingAccounts.length === 0) {
    return (
      <p className="text-sm text-fg-muted">
        {t("Add a debit, savings or cash account first; contributions are paid from one.")}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!lockedHoldingId && (
        <Select
          label={t("Holding")}
          value={holdingId}
          onChange={setHoldingId}
          options={holdings.map((h) => ({
            value: h.id,
            label: h.symbol ? `${h.name} (${h.symbol})` : h.name,
          }))}
        />
      )}

      <Select
        label={t("Paid from")}
        value={effectiveAccountId}
        onChange={setAccountId}
        options={fundingAccounts.map((a) => ({
          value: a.id,
          label: `${a.name} (${a.currency})`,
        }))}
      />

      <Input
        label={t("Amount each time ({currency})", { currency: account?.currency ?? "" })}
        name="recurring-amount"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        required
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <Select
        label={t("How often")}
        value={frequency}
        onChange={(v) => setFrequency(v as RecurrenceFrequency)}
        options={FREQUENCIES.map((f) => ({
          value: f,
          label: t(RECURRENCE_FREQUENCY_LABELS[f]),
        }))}
      />

      <div className="grid grid-cols-2 gap-3">
        <DatePicker label={t("Starts")} name="recurring-start" required value={startDate} onChange={setStartDate} />
        <DatePicker label={t("Ends (optional)")} name="recurring-end" value={endDate} onChange={setEndDate} />
      </div>

      {holding?.kind === "market" && (
        <p className="text-xs text-fg-subtle">
          {t("Each buy is priced at that day's close. If no price is available it's saved unpriced and counts toward cost basis only.")}
        </p>
      )}

      {error && <p className="text-sm text-expense">{error}</p>}

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" size="lg" fullWidth onClick={onCancel}>
            {t("Cancel")}
          </Button>
        )}
        <Button type="submit" size="lg" fullWidth disabled={!valid || submitting}>
          {submitting ? t("Saving…") : initial ? t("Save") : t("Start contributions")}
        </Button>
      </div>
    </form>
  );
}
