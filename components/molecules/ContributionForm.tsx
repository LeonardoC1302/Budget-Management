"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import DatePicker from "@/components/atoms/DatePicker";
import Input from "@/components/atoms/Input";
import { todayISODate } from "@/lib/utils/format";
import type { NewGoalContribution } from "@/lib/types";

interface ContributionFormProps {
  goalId: string;
  onSubmit: (input: NewGoalContribution) => void | Promise<void>;
  onCancel?: () => void;
}

export default function ContributionForm({
  goalId,
  onSubmit,
  onCancel,
}: ContributionFormProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISODate());
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;

    setSubmitting(true);
    await onSubmit({
      goalId,
      amount: parsed,
      note: note.trim() || undefined,
      date,
    });
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Amount"
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
        <Button type="submit" size="lg" fullWidth disabled={submitting}>
          {submitting ? "Adding…" : "Add contribution"}
        </Button>
      </div>
    </form>
  );
}
