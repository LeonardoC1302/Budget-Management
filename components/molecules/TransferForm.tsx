"use client";

import { useCallback, useEffect, useState } from "react";
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

import { t } from "@/lib/i18n";
interface TransferFormProps {
  onSubmit: (input: NewTransfer) => void | Promise<void>;
  onCancel?: () => void;
}

// USD↔CRC transfers should go through the user-selected BCCR entity so the
// stored rate matches the bank window that actually cleared the funds. Any
// other pair (which the app doesn't currently produce, but existing data may)
// falls through to the general BCCR rate table.
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
  const [fee, setFee] = useState("");
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

  const parsedFee = parseFloat(fee);
  const hasFee = Number.isFinite(parsedFee) && parsedFee > 0;
  const feeValid =
    !hasFee || (!differentCurrencies && hasAmount && parsedFee < parsedAmount);

  useEffect(() => {
    if (differentCurrencies && fee !== "") setFee("");
  }, [differentCurrencies, fee]);

  const direction = bccrDirection(fromCurrency, toCurrency);

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

  // A rate the user typed in, tied to the currency pair it was entered for so
  // switching accounts to a different pair drops it.
  const [customRate, setCustomRate] = useState<{
    key: string;
    value: string;
  } | null>(null);
  const customActive = differentCurrencies && customRate?.key === pairKey;

  // Quote rates the way banks post them: units of the other currency per
  // 1 USD, so CRC→USD reads "505" instead of "0.0020". The stored rate is
  // always from → to.
  const quoteInverted = fromCurrency !== "USD" && toCurrency === "USD";
  const quoteBase = quoteInverted ? toCurrency : fromCurrency;
  const quoteTarget = quoteInverted ? fromCurrency : toCurrency;
  const toQuote = (r: number) => (quoteInverted ? 1 / r : r);

  const parsedCustom = customActive ? parseFloat(customRate?.value ?? "") : NaN;
  const customRateValue =
    Number.isFinite(parsedCustom) && parsedCustom > 0
      ? quoteInverted
        ? 1 / parsedCustom
        : parsedCustom
      : null;

  const needsFallback =
    differentCurrencies && !customActive && (!direction || bccrFallback);

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
            error: err instanceof Error ? err.message : t("Rate unavailable"),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [needsFallback, fromCurrency, toCurrency, pairKey]);

  const autoRate: number | null = !differentCurrencies
    ? 1
    : direction && bccrResolved && !bccrFallback
      ? direction === "USD_TO_CRC"
        ? bccrResolved.rate
        : bccrResolved.rate === 0
          ? null
          : 1 / bccrResolved.rate
      : fallbackRate.key === pairKey
        ? fallbackRate.rate
        : null;

  const rate = customActive ? customRateValue : autoRate;

  const rateError = needsFallback && fallbackRate.key === pairKey
    ? fallbackRate.error
    : null;

  function startCustomRate() {
    // Start from the rate on screen so small corrections are one keystroke.
    const prefill =
      autoRate !== null ? String(Number(toQuote(autoRate).toFixed(4))) : "";
    setCustomRate({ key: pairKey, value: prefill });
  }

  const convertedAmount =
    hasAmount && rate !== null ? parsedAmount * rate : null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!effectiveFromId || !effectiveToId) return;
    if (effectiveFromId === effectiveToId) return;
    if (!hasAmount) return;
    if (differentCurrencies && rate === null) return;
    if (!feeValid) return;

    let rateSource: RateSource | undefined;
    if (differentCurrencies) {
      if (customActive && rate !== null) {
        rateSource = { provider: "manual", rate };
      } else if (direction && bccrResolved && !bccrFallback) {
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
        ...(hasFee && !differentCurrencies ? { fee: parsedFee } : {}),
      });
      setAmount("");
      setFee("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Transfer failed"));
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
    (!differentCurrencies || rate !== null) &&
    feeValid;

  if (!accountsLoading && accounts.length < 2) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-fg-muted">
          {t("You need at least two accounts to transfer money.")}
        </p>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onCancel}
          >
            {t("Close")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select
        label={t("From")}
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
        label={t("To")}
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
        label={t("Amount ({currency})", { currency: fromCurrency })}
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

      {!differentCurrencies && (
        <div className="flex flex-col gap-1">
          <Input
            label={t("Fee ({currency})", { currency: fromCurrency })}
            name="fee"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          />
          {hasFee && hasAmount && parsedFee >= parsedAmount && (
            <p className="text-xs text-expense">
              {t("Fee must be less than the amount.")}
            </p>
          )}
          {hasFee && hasAmount && parsedFee < parsedAmount && (
            <p className="text-xs text-fg-subtle">
              {t("{name} receives {amount}.", {
                name: toAccount?.name ?? t("Destination"),
                amount: formatCurrency(parsedAmount - parsedFee, toCurrency),
              })}
            </p>
          )}
        </div>
      )}

      {differentCurrencies && customActive && (
        <Input
          label={t("Exchange rate ({quoteTarget} per 1 {quoteBase})", { quoteTarget, quoteBase })}
          name="customRate"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          placeholder="0.00"
          required
          autoFocus
          value={customRate?.value ?? ""}
          onChange={(e) =>
            setCustomRate({ key: pairKey, value: e.target.value })
          }
        />
      )}

      {differentCurrencies && !customActive && direction && (
        <EntityRatePicker
          direction={direction}
          value={entityId}
          onChange={setEntityId}
          onResolved={onResolved}
        />
      )}

      {differentCurrencies && (
        <div className="flex flex-col gap-1 text-xs text-fg-subtle">
          {customActive && rate === null ? (
            <span>{t("Enter a rate above 0.")}</span>
          ) : rateError ? (
            <span className="text-expense">{rateError}</span>
          ) : rate === null ? (
            <span>{t("Fetching exchange rate…")}</span>
          ) : convertedAmount !== null ? (
            <span>
              {customActive ? "=" : "≈"}{" "}
              {t("{amount} at {rate} {pair}", {
                amount: formatCurrency(convertedAmount, toCurrency),
                rate: toQuote(rate).toFixed(4),
                pair: `${quoteTarget}/${quoteBase}`,
              })}
            </span>
          ) : (
            <span>
              1 {quoteBase} {customActive ? "=" : "≈"}{" "}
              {toQuote(rate).toFixed(4)} {quoteTarget}
            </span>
          )}
          <button
            type="button"
            onClick={() =>
              customActive ? setCustomRate(null) : startCustomRate()
            }
            className="self-start underline decoration-dotted underline-offset-4"
          >
            {customActive
              ? direction
                ? t("Use a bank rate instead")
                : t("Use the market rate instead")
              : t("Enter my own rate")}
          </button>
        </div>
      )}

      <Input
        label={t("Description")}
        name="description"
        placeholder={t("Optional")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <DatePicker
        label={t("Date")}
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
            {t("Cancel")}
          </Button>
        )}
        <Button type="submit" size="lg" fullWidth disabled={!canSubmit}>
          {submitting ? t("Transferring…") : t("Transfer")}
        </Button>
      </div>
    </form>
  );
}
