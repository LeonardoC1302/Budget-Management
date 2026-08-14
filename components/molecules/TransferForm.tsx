"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "@/components/atoms/Button";
import DatePicker from "@/components/atoms/DatePicker";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import EntityRatePicker, {
  type FxDirection,
  type ResolvedRate,
} from "@/components/molecules/EntityRatePicker";
import { useAccounts } from "@/hooks/useAccounts";
import { getRate } from "@/lib/services/exchangeRates";
import { formatCurrency, todayISODate } from "@/lib/utils/format";
import type { NewTransfer, RateSource } from "@/lib/types";

interface TransferFormProps {
  onSubmit: (input: NewTransfer) => void | Promise<void>;
  onCancel?: () => void;
}

// USD↔CRC transfers should go through the user-selected BCCR entity so the
// stored rate matches the bank window that actually cleared the funds. Any
// other pair (which the app doesn't currently produce, but existing data may)
// falls through to open.er-api.com the way it always did.
function bccrDirection(
  from: string,
  to: string,
): FxDirection | null {
  if (from === "USD" && to === "CRC") return "USD_TO_CRC";
  if (from === "CRC" && to === "USD") return "CRC_TO_USD";
  return null;
}

export default function TransferForm({ onSubmit, onCancel }: TransferFormProps) {
  const { accounts, loading: accountsLoading } = useAccounts();

  const [fromId, setFromId] = useState<string>("");
  const [toId, setToId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISODate());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromAccount =
    accounts.find((a) => a.id === fromId) ?? accounts[0];
  const effectiveFromId = fromAccount?.id ?? "";

  const toCandidates = accounts.filter((a) => a.id !== effectiveFromId);
  const toAccount =
    toCandidates.find((a) => a.id === toId) ?? toCandidates[0];
  const effectiveToId = toAccount?.id ?? "";

  const fromCurrency = fromAccount?.currency ?? "USD";
  const toCurrency = toAccount?.currency ?? "USD";
  const parsedAmount = parseFloat(amount);
  const hasAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const differentCurrencies = fromCurrency !== toCurrency;

  const direction = useMemo(
    () => bccrDirection(fromCurrency, toCurrency),
    [fromCurrency, toCurrency],
  );

  const [entityId, setEntityId] = useState<string | null>(null);
  const [bccrResolved, setBccrResolved] = useState<ResolvedRate | null>(null);
  const [bccrFallback, setBccrFallback] = useState(false);
  const onResolved = useCallback(
    (result: { resolved: ResolvedRate | null; fallback: boolean }) => {
      setBccrResolved(result.resolved);
      setBccrFallback(result.fallback);
    },
    [],
  );

  // Fallback / non-BCCR pair rate lookup.
  const pairKey = `${fromCurrency}:${toCurrency}`;
  const [fallbackRate, setFallbackRate] = useState<{
    key: string;
    rate: number | null;
    error: string | null;
  }>({ key: "", rate: null, error: null });

  const needsFallback = differentCurrencies && (!direction || bccrFallback);

  useEffect(() => {
    if (!needsFallback) return;
    let cancelled = false;
    getRate(fromCurrency, toCurrency)
      .then((r) => {
        if (!cancelled) setFallbackRate({ key: pairKey, rate: r, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setFallbackRate({
            key: pairKey,
            rate: null,
            error: err instanceof Error ? err.message : "Rate unavailable",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [needsFallback, fromCurrency, toCurrency, pairKey]);

  const rate: number | null = !differentCurrencies
    ? 1
    : direction && bccrResolved
      ? bccrResolved.rate
      : fallbackRate.key === pairKey
        ? fallbackRate.rate
        : null;

  const rateError = needsFallback && fallbackRate.key === pairKey
    ? fallbackRate.error
    : null;

  const convertedAmount =
    hasAmount && rate !== null ? parsedAmount * rate : null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!effectiveFromId || !effectiveToId) return;
    if (effectiveFromId === effectiveToId) return;
    if (!hasAmount) return;
    if (differentCurrencies && rate === null) return;

    let rateSource: RateSource | undefined;
    if (differentCurrencies) {
      if (direction && bccrResolved && !bccrFallback) {
        rateSource = {
          provider: "bccr",
          entityId: bccrResolved.entity.id,
          entityName: bccrResolved.entity.name,
          rate: bccrResolved.rate,
          side: bccrResolved.side,
          snapshotAt: bccrResolved.snapshotAt,
        };
      } else if (rate !== null) {
        rateSource = { provider: "fallback", rate };
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        fromAccountId: effectiveFromId,
        toAccountId: effectiveToId,
        amount: parsedAmount,
        fromCurrency,
        toCurrency,
        description: description.trim(),
        date,
        ...(rateSource ? { rateSource } : {}),
      });
      setAmount("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    !submitting &&
    !accountsLoading &&
    hasAmount &&
    !!effectiveFromId &&
    !!effectiveToId &&
    effectiveFromId !== effectiveToId &&
    (!differentCurrencies || rate !== null);

  if (!accountsLoading && accounts.length < 2) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-fg-muted">
          You need at least two accounts to transfer money.
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select
        label="From"
        name="from"
        value={effectiveFromId}
        onChange={setFromId}
        options={accounts.map((a) => ({
          value: a.id,
          label: `${a.name} (${a.currency})`,
        }))}
        disabled={accountsLoading}
      />

      <Select
        label="To"
        name="to"
        value={effectiveToId}
        onChange={setToId}
        options={toCandidates.map((a) => ({
          value: a.id,
          label: `${a.name} (${a.currency})`,
        }))}
        disabled={accountsLoading || toCandidates.length === 0}
      />

      <Input
        label={`Amount (${fromCurrency})`}
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

      {differentCurrencies && direction && (
        <EntityRatePicker
          direction={direction}
          value={entityId}
          onChange={setEntityId}
          onResolved={onResolved}
        />
      )}

      {differentCurrencies && (
        <div className="text-xs text-fg-subtle">
          {rateError ? (
            <span className="text-expense">{rateError}</span>
          ) : rate === null ? (
            <span>Fetching exchange rate…</span>
          ) : convertedAmount !== null ? (
            <span>
              ≈ {formatCurrency(convertedAmount, toCurrency)} at{" "}
              {rate.toFixed(4)} {toCurrency}/{fromCurrency}
            </span>
          ) : (
            <span>
              1 {fromCurrency} ≈ {rate.toFixed(4)} {toCurrency}
            </span>
          )}
        </div>
      )}

      <Input
        label="Description"
        name="description"
        placeholder="Optional"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <DatePicker
        label="Date"
        name="date"
        required
        value={date}
        onChange={setDate}
      />

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
          {submitting ? "Transferring…" : "Transfer"}
        </Button>
      </div>
    </form>
  );
}
