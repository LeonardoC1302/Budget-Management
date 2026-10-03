"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import CurrencySelect from "@/components/atoms/CurrencySelect";
import Input from "@/components/atoms/Input";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
import { convertAmountInput } from "@/lib/utils/currencySwitch";
import { formatCurrency } from "@/lib/utils/format";
import type { Account, NewAccount } from "@/lib/types";

import { t } from "@/lib/i18n";
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
  const [limitNote, setLimitNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Editing a card's currency converts its limit so the numbers keep their
  // value. New cards are left alone: the limit is typed in the new currency.
  async function handleCurrencyChange(next: string) {
    const prev = currency;
    setCurrency(next);
    if (!initial || next === prev) return;
    if (next === initial.currency) {
      setCreditLimit(
        typeof initial.creditLimit === "number" ? String(initial.creditLimit) : "",
      );
      setLimitNote(null);
      return;
    }
    const converted = await convertAmountInput(creditLimit, prev, next);
    if (!converted) return;
    setCreditLimit(converted.value);
    setLimitNote(
      t("Converted from {amount} at today's rate. Change it if your bank uses a different figure.", {
        amount: formatCurrency(converted.original, prev),
      }),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    const cut = parseDay(cutDay);
    const pay = parseDay(paymentDay);

    if (cut === undefined || pay === undefined) {
      setError(t("Add both a cut day and a payment day so PerchCR can track your cycle."));
      return;
    }
    if (cut < 1 || cut > 31 || pay < 1 || pay > 31) {
      setError(t("Cut and payment days need to be between 1 and 31."));
      return;
    }

    setSubmitting(true);
    setError(null);
    // The opening balance has no field here; carry it into the new currency
    // so it keeps its value instead of changing symbol.
    let initialBalance = initial?.initialBalance ?? 0;
    if (initial && currency !== initial.currency) {
      const converted = await convertAmountInput(
        String(initialBalance),
        initial.currency,
        currency,
      );
      if (converted) initialBalance = parseFloat(converted.value);
    }
    const payload: NewAccount = {
      name: name.trim(),
      type: "credit",
      initialBalance,
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
        label={t("Card name")}
        name="name"
        placeholder={t("e.g. BAC Credomatic Visa")}
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <CurrencySelect
        label={t("Currency")}
        name="currency"
        value={currency}
        onChange={(next) => void handleCurrencyChange(next)}
      />

      <div className="grid grid-cols-2 gap-3 items-end">
        <Input
          label={t("Cut day")}
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
          label={t("Payment day")}
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
        {t("Two dates from your card statement. Cut is when billing closes; payment is when it's due.")}
      </p>

      <Input
        label={t("Credit limit ({0})", { "0": currency || BASE_CURRENCY })}
        name="creditLimit"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder={t("Optional")}
        value={creditLimit}
        onChange={(e) => {
          setCreditLimit(e.target.value);
          setLimitNote(null);
        }}
      />
      {limitNote && <p className="text-xs text-fg-subtle -mt-2">{limitNote}</p>}

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
            {t("Cancel")}
          </Button>
        )}
        <Button type="submit" size="lg" fullWidth disabled={submitting}>
          {submitting ? t("Saving…") : initial ? t("Save changes") : t("Add card")}
        </Button>
      </div>
    </form>
  );
}
