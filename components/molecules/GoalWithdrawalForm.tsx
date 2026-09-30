"use client";

import { useMemo, useState } from "react";
import Button from "@/components/atoms/Button";
import DatePicker from "@/components/atoms/DatePicker";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import { formatCurrency, todayISODate } from "@/lib/utils/format";
import type {
  Account,
  Goal,
  GoalContribution,
  NewGoalContribution,
} from "@/lib/types";

import { t } from "@/lib/i18n";
interface GoalWithdrawalFormProps {
  goal: Goal;
  contributions: GoalContribution[];
  accountsById: Record<string, Account | undefined>;
  onSubmit: (input: NewGoalContribution) => void | Promise<void>;
  onCancel?: () => void;
}

const UNASSIGNED = "__unassigned__";

/**
 * Takes money back out of a goal: the reservation on that account shrinks, so
 * the money is free to use again. Contributions only earmark money, so
 * nothing moves between accounts. Record the spending itself as a normal
 * transaction.
 */
export default function GoalWithdrawalForm({
  goal,
  contributions,
  accountsById,
  onSubmit,
  onCancel,
}: GoalWithdrawalFormProps) {
  // How much of the goal sits on each account. Money saved before tracking
  // (the initial amount) or through legacy contributions has no account.
  const sources = useMemo(() => {
    const byAccount = new Map<string, number>();
    let unassigned = goal.initialAmount;
    for (const c of contributions) {
      if (c.accountId) {
        byAccount.set(c.accountId, (byAccount.get(c.accountId) ?? 0) + c.amount);
      } else {
        unassigned += c.amount;
      }
    }
    const list = [...byAccount.entries()]
      .filter(([, amount]) => amount > 0.005)
      .map(([id, amount]) => ({
        value: id,
        label: accountsById[id]?.name ?? t("Deleted account"),
        amount,
      }));
    if (unassigned > 0.005) {
      list.push({ value: UNASSIGNED, label: t("Not tied to an account"), amount: unassigned });
    }
    return list;
  }, [goal.initialAmount, contributions, accountsById]);

  const [source, setSource] = useState(sources[0]?.value ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISODate());
  const [submitting, setSubmitting] = useState(false);

  const selected = sources.find((s) => s.value === source) ?? sources[0];
  const parsed = parseFloat(amount);
  const tooMuch = !!selected && Number.isFinite(parsed) && parsed > selected.amount + 0.005;
  const valid = !!selected && Number.isFinite(parsed) && parsed > 0 && !tooMuch;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || !selected) return;
    setSubmitting(true);
    try {
      await onSubmit({
        goalId: goal.id,
        amount: -parsed,
        withdrawal: true,
        note: note.trim() || undefined,
        date,
        ...(selected.value !== UNASSIGNED ? { accountId: selected.value } : {}),
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (sources.length === 0) {
    return <p className="text-sm text-fg-muted">{t("There's nothing saved in this goal yet.")}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select
        label={t("Take it from")}
        value={selected?.value ?? ""}
        onChange={setSource}
        options={sources.map((s) => ({
          value: s.value,
          label: `${s.label} · ${formatCurrency(s.amount, goal.currency)}`,
        }))}
      />

      <Input
        label={t("Amount ({currency})", { currency: goal.currency })}
        name="withdraw-amount"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        required
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        error={
          tooMuch && selected
            ? t("Only {0} of this goal is there.", { "0": formatCurrency(selected.amount, goal.currency) })
            : undefined
        }
      />

      <Input
        label={t("Note")}
        name="withdraw-note"
        placeholder={t("Optional, e.g. car repair")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <DatePicker label={t("Date")} name="withdraw-date" required value={date} onChange={setDate} />

      <p className="text-xs text-fg-subtle">
        {t("This frees the money on the account for other use; it doesn't move it. If you spent it, add that expense as usual.")}
      </p>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" size="lg" fullWidth onClick={onCancel}>
            {t("Cancel")}
          </Button>
        )}
        <Button type="submit" size="lg" fullWidth disabled={!valid || submitting}>
          {submitting ? t("Saving…") : t("Withdraw")}
        </Button>
      </div>
    </form>
  );
}
