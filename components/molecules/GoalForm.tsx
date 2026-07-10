"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import DatePicker from "@/components/atoms/DatePicker";
import Input from "@/components/atoms/Input";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
import type { Goal, NewGoal } from "@/lib/types";

interface GoalFormProps {
  initial?: Goal;
  onSubmit: (input: NewGoal) => void | Promise<void>;
  onCancel?: () => void;
}

export default function GoalForm({ initial, onSubmit, onCancel }: GoalFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(
    initial ? String(initial.targetAmount) : "",
  );
  const [initialAmount, setInitialAmount] = useState(
    initial ? String(initial.initialAmount) : "0",
  );
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    const parsedInitial = parseFloat(initialAmount);
    if (!name.trim() || !Number.isFinite(parsedTarget) || parsedTarget <= 0) return;
    if (!Number.isFinite(parsedInitial) || parsedInitial < 0) return;

    setSubmitting(true);
    await onSubmit({
      name: name.trim(),
      targetAmount: parsedTarget,
      initialAmount: parsedInitial,
      currency: BASE_CURRENCY,
      targetDate: targetDate || undefined,
    });
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Name"
        name="name"
        placeholder="e.g. Trip to Japan"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Input
        label="Target amount (USD)"
        name="targetAmount"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder="0.00"
        required
        value={targetAmount}
        onChange={(e) => setTargetAmount(e.target.value)}
      />

      <Input
        label="Initial progress (USD)"
        hint="Money you already have toward this goal."
        name="initialAmount"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        value={initialAmount}
        onChange={(e) => setInitialAmount(e.target.value)}
      />

      <DatePicker
        label="Target date (optional)"
        name="targetDate"
        value={targetDate}
        onChange={setTargetDate}
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
          {submitting ? "Saving…" : initial ? "Save changes" : "Create goal"}
        </Button>
      </div>
    </form>
  );
}
