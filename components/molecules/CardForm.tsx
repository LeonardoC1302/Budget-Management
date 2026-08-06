"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import CurrencyCombobox from "@/components/atoms/CurrencyCombobox";
import Input from "@/components/atoms/Input";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
import type { Account, NewAccount } from "@/lib/types";

interface CardFormProps {
  initial?: Account;
  onSubmit: (input: NewAccount) => void | Promise<void>;
  onCancel?: () => void;
}

function parseDay(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.floor(n) : undefined;
}

function parseLimit(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = parseFloat(raw);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export default function CardForm({ initial, onSubmit, onCancel }: CardFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? BASE_CURRENCY);
  const [cutDay, setCutDay] = useState(
    typeof initial?.cutDay === "number" ? String(initial.cutDay) : "",
  );
  const [paymentDay, setPaymentDay] = useState(
    typeof initial?.paymentDay === "number" ? String(initial.paymentDay) : "",
  );
  const [creditLimit, setCreditLimit] = useState(
    typeof initial?.creditLimit === "number" ? String(initial.creditLimit) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    const cut = parseDay(cutDay);
    const pay = parseDay(paymentDay);

    if (cut === undefined || pay === undefined) {
      setError("Add both a cut day and a payment day so Perch can track your cycle.");
      return;
    }
    if (cut < 1 || cut > 31 || pay < 1 || pay > 31) {
      setError("Cut and payment days need to be between 1 and 31.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const payload: NewAccount = {
      name: name.trim(),
      type: "credit",
      initialBalance: initial?.initialBalance ?? 0,
      currency: currency || BASE_CURRENCY,
      cutDay: cut,
      paymentDay: pay,
    };
    const limit = parseLimit(creditLimit);
    if (limit !== undefined) payload.creditLimit = limit;
    await onSubmit(payload);
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Card name"
        name="name"
        placeholder="e.g. BAC Credomatic Visa"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <CurrencyCombobox
        label="Currency"
        name="currency"
        value={currency}
        onChange={setCurrency}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Cut day"
          name="cutDay"
          type="number"
          inputMode="numeric"
          min="1"
          max="31"
          placeholder="e.g. 27"
          required
          value={cutDay}
          onChange={(e) => setCutDay(e.target.value)}
        />
        <Input
          label="Payment day"
          name="paymentDay"
          type="number"
          inputMode="numeric"
          min="1"
          max="31"
          placeholder="e.g. 11"
          required
          value={paymentDay}
          onChange={(e) => setPaymentDay(e.target.value)}
        />
      </div>
      <p className="text-xs text-fg-subtle -mt-2">
        Two dates from your card statement. Cut is when billing closes; payment
        is when it&apos;s due.
      </p>

      <Input
        label={`Credit limit (${currency || BASE_CURRENCY})`}
        name="creditLimit"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder="Optional"
        value={creditLimit}
        onChange={(e) => setCreditLimit(e.target.value)}
      />

      {error && (
        <p role="status" className="text-xs text-expense">
          {error}
        </p>
      )}

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
          {submitting ? "Saving…" : initial ? "Save changes" : "Add card"}
        </Button>
      </div>
    </form>
  );
}
