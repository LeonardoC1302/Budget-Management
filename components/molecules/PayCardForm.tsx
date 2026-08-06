"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/atoms/Button";
import DatePicker from "@/components/atoms/DatePicker";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import { useAccounts } from "@/hooks/useAccounts";
import { effectiveDue, type CardTotals } from "@/lib/credit/statement";
import { getRate } from "@/lib/services/exchangeRates";
import { formatCurrency, todayISODate } from "@/lib/utils/format";
import type { Account, NewTransfer } from "@/lib/types";

interface PayCardFormProps {
  card: Account;
  totals: CardTotals;
  onSubmit: (input: NewTransfer) => void | Promise<void>;
  onCancel?: () => void;
}

function fromCardCurrency(cardAmount: number, rateFromSourceToCard: number) {
  return rateFromSourceToCard === 0 ? 0 : cardAmount / rateFromSourceToCard;
}
function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function PayCardForm({
  card,
  totals,
  onSubmit,
  onCancel,
}: PayCardFormProps) {
  const { accounts, loading: accountsLoading } = useAccounts();

  const sourceCandidates = useMemo(
    () => accounts.filter((a) => a.type !== "credit" && a.id !== card.id),
    [accounts, card.id],
  );

  const [fromId, setFromId] = useState<string>("");
  const [cardAmountRaw, setCardAmountRaw] = useState("");
  const [cardTouched, setCardTouched] = useState(false);
  const [sourceAmountRaw, setSourceAmountRaw] = useState("");
  const [sourceManual, setSourceManual] = useState(false);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISODate());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateEntry, setRateEntry] = useState<{
    key: string;
    rate: number | null;
    error: string | null;
  }>({ key: "", rate: null, error: null });

  const source = sourceCandidates.find((a) => a.id === fromId) ?? sourceCandidates[0];
  const effectiveFromId = source?.id ?? "";
  const sourceCurrency = source?.currency ?? card.currency;
  const cardCurrency = card.currency;
  const differentCurrencies = sourceCurrency !== cardCurrency;
  const pairKey = `${sourceCurrency}:${cardCurrency}`;

  useEffect(() => {
    if (!differentCurrencies) return;
    let cancelled = false;
    getRate(sourceCurrency, cardCurrency)
      .then((r) => {
        if (!cancelled) setRateEntry({ key: pairKey, rate: r, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setRateEntry({
            key: pairKey,
            rate: null,
            error: err instanceof Error ? err.message : "Rate unavailable",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [sourceCurrency, cardCurrency, differentCurrencies, pairKey]);

  const rate: number | null = differentCurrencies
    ? rateEntry.key === pairKey
      ? rateEntry.rate
      : null
    : 1;
  const rateError = differentCurrencies && rateEntry.key === pairKey ? rateEntry.error : null;

  const due = effectiveDue(totals);
  const statementDueInCard = totals.statementDue;
  const fullBalanceInCard = totals.owed;
  const unbilledInCard = Math.max(0, totals.unbilledPurchases - totals.paymentsBeforeCutBacklog);

  const preferredCardAmount = statementDueInCard > 0 ? statementDueInCard : fullBalanceInCard;
  const cardAmountDisplay = cardTouched
    ? cardAmountRaw
    : preferredCardAmount > 0
      ? String(roundMoney(preferredCardAmount))
      : "";
  const parsedCardAmount = parseFloat(cardAmountDisplay);
  const hasCardAmount = Number.isFinite(parsedCardAmount) && parsedCardAmount > 0;

  const sourceAmountDisplay = sourceManual
    ? sourceAmountRaw
    : rate !== null && hasCardAmount
      ? String(roundMoney(fromCardCurrency(parsedCardAmount, rate)))
      : "";
  const parsedSourceAmount = parseFloat(sourceAmountDisplay);
  const hasSourceAmount = Number.isFinite(parsedSourceAmount) && parsedSourceAmount > 0;

  function handleCardAmountChange(next: string) {
    setCardTouched(true);
    setCardAmountRaw(next);
    setSourceManual(false);
  }

  function handleSourceAmountChange(next: string) {
    setSourceManual(true);
    setSourceAmountRaw(next);
  }

  function fillWithCardTarget(cardAmount: number) {
    if (cardAmount <= 0) return;
    setCardTouched(true);
    setCardAmountRaw(String(roundMoney(cardAmount)));
    setSourceManual(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!effectiveFromId) return;
    if (!hasCardAmount || !hasSourceAmount) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        fromAccountId: effectiveFromId,
        toAccountId: card.id,
        amount: parsedSourceAmount,
        toAmount: parsedCardAmount,
        fromCurrency: sourceCurrency,
        toCurrency: cardCurrency,
        description: description.trim() || `Payment · ${card.name}`,
        date,
        paymentForAccountId: card.id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!accountsLoading && sourceCandidates.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-fg-muted">
          Add a debit, cash, wallet, or savings account first — that&apos;s where
          the payment will come from.
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

  const canSubmit =
    !submitting &&
    !accountsLoading &&
    hasCardAmount &&
    hasSourceAmount &&
    !!effectiveFromId &&
    (differentCurrencies ? rate !== null : true);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <section
        aria-label="Statement preview"
        className="rounded-[12px] border border-border bg-surface-2 p-4 flex flex-col gap-2.5"
      >
        <PreviewRow
          label={
            due.kind === "due"
              ? "Statement due"
              : due.kind === "next"
                ? "This statement is paid"
                : "Nothing due"
          }
          value={statementDueInCard > 0 ? formatCurrency(statementDueInCard, cardCurrency) : "—"}
          strong={due.kind === "due"}
        />
        <PreviewRow
          label="Unbilled (next cycle)"
          value={
            unbilledInCard > 0 ? formatCurrency(unbilledInCard, cardCurrency) : "—"
          }
        />
        <div className="border-t border-border my-1" />
        <PreviewRow
          label="Total owed"
          value={formatCurrency(fullBalanceInCard, cardCurrency)}
          strong
        />
        {due.kind !== "none" && (
          <p className="text-[11px] text-fg-subtle">
            {due.kind === "due" ? "Due" : "Next due"} {formatCardDate(due.date)}
          </p>
        )}
      </section>

      <Select
        label="From"
        name="from"
        value={effectiveFromId}
        onChange={setFromId}
        options={sourceCandidates.map((a) => ({
          value: a.id,
          label: `${a.name} (${a.currency})`,
        }))}
        disabled={accountsLoading}
      />

      <div className="flex flex-col gap-2">
        <Input
          label={`Applied to card (${cardCurrency})`}
          name="cardAmount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          required
          value={cardAmountDisplay}
          onChange={(e) => handleCardAmountChange(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {statementDueInCard > 0 && (
            <QuickChip
              label={`Statement due · ${formatCurrency(statementDueInCard, cardCurrency)}`}
              onClick={() => fillWithCardTarget(statementDueInCard)}
            />
          )}
          {fullBalanceInCard > 0 && fullBalanceInCard !== statementDueInCard && (
            <QuickChip
              label={`Full balance · ${formatCurrency(fullBalanceInCard, cardCurrency)}`}
              onClick={() => fillWithCardTarget(fullBalanceInCard)}
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Input
          label={`Charged from source (${sourceCurrency})`}
          name="sourceAmount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          required
          value={sourceAmountDisplay}
          onChange={(e) => handleSourceAmountChange(e.target.value)}
          disabled={differentCurrencies && rate === null}
        />
        <p className="text-xs text-fg-subtle">
          {differentCurrencies ? (
            rateError ? (
              <span className="text-expense">{rateError}</span>
            ) : rate === null ? (
              "Fetching exchange rate…"
            ) : (
              <>
                Default rate: 1 {sourceCurrency} ≈ {rate.toFixed(4)} {cardCurrency}. Adjust if the bank charges a different amount — only what&apos;s here leaves the source; the card is credited by the amount above.
              </>
            )
          ) : (
            "Adjust if the bank charges a fee or different amount. The card is still credited by the amount above."
          )}
        </p>
      </div>

      <Input
        label="Note"
        name="description"
        placeholder={`Payment · ${card.name}`}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <DatePicker label="Date" name="date" required value={date} onChange={setDate} />

      {error && <p className="text-xs text-expense">{error}</p>}

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
          {submitting ? "Paying…" : "Pay card"}
        </Button>
      </div>
    </form>
  );
}

function PreviewRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-fg-subtle">{label}</span>
      <span
        className={
          strong
            ? "text-fg font-medium tabular-nums"
            : "text-fg-muted tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}

function QuickChip({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="shrink-0 h-8 px-3 rounded-full text-xs font-medium bg-surface-2 text-fg-muted border border-border hover:text-fg hover:border-border-strong disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      {label}
    </button>
  );
}

function formatCardDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}