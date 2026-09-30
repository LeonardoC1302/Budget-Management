"use client";

import { useState } from "react";
import Button from "@/components/atoms/Button";
import DatePicker from "@/components/atoms/DatePicker";
import Input from "@/components/atoms/Input";
import { todayISODate } from "@/lib/utils/format";
import type {
  HoldingValuation,
  NewHoldingValuation,
} from "@/lib/types";

import { t } from "@/lib/i18n";
interface ValuationFormProps {
  holdingId: string;
  initial?: HoldingValuation;
  onSubmit: (input: NewHoldingValuation) => void | Promise<void>;
  onCancel?: () => void;
}

export default function ValuationForm({
  holdingId,
  initial,
  onSubmit,
  onCancel,
}: ValuationFormProps) {
  const isEditing = !!initial;
  const [valueUSD, setValueUSD] = useState(
    initial ? String(initial.valueUSD) : "",
  );
  const [asOfDate, setAsOfDate] = useState(initial?.asOfDate ?? todayISODate());
  const [note, setNote] = useState(initial?.note ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseFloat(valueUSD);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        holdingId,
        valueUSD: parsed,
        asOfDate,
        note: note.trim() || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label={t("Balance (USD)")}
        name="valueUSD"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder="0.00"
        required
        value={valueUSD}
        onChange={(e) => setValueUSD(e.target.value)}
      />

      <DatePicker
        label={t("As of")}
        name="asOfDate"
        required
        value={asOfDate}
        onChange={setAsOfDate}
      />

      <Input
        label={t("Note")}
        name="note"
        placeholder={t("e.g. Q3 statement")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
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
            {t("Cancel")}
          </Button>
        )}
        <Button type="submit" size="lg" fullWidth disabled={submitting}>
          {submitting
            ? isEditing ? t("Saving…") : t("Recording…")
            : isEditing ? t("Save valuation") : t("Record valuation")}
        </Button>
      </div>
    </form>
  );
}
