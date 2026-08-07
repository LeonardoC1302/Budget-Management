"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/atoms/Button";
import DatePicker from "@/components/atoms/DatePicker";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import { useAccounts } from "@/hooks/useAccounts";
import { getRate } from "@/lib/services/exchangeRates";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
import { formatCurrency, todayISODate } from "@/lib/utils/format";
import type { Holding, NewTransaction } from "@/lib/types";

interface HoldingContributionFormProps {
  holding: Holding;
  onSubmit: (input: NewTransaction) => void | Promise<void>;
  onCancel?: () => void;
}

interface PriceOnDateResponse {
  closeUSD?: number;
  quoteCurrency?: string;
  date?: string;
  error?: string;
}

type PriceState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; closeUSD: number; date: string }
  | { status: "unavailable" }
  | { status: "no-data" };

export default function HoldingContributionForm({
  holding,
  onSubmit,
  onCancel,
}: HoldingContributionFormProps) {
  const { accounts, loading: accountsLoading } = useAccounts();
  const [amount, setAmount] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [date, setDate] = useState(todayISODate());
  const [description, setDescription] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualShares, setManualShares] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [price, setPrice] = useState<PriceState>({ status: "idle" });

  const isMarket = holding.kind === "market";
  const isManualHolding = holding.kind === "manual";

  const accountId = accounts.some((a) => a.id === selectedAccountId)
    ? selectedAccountId
    : accounts[0]?.id ?? "";
  const account = accounts.find((a) => a.id === accountId);
  const accountCurrency = account?.currency ?? BASE_CURRENCY;

  useEffect(() => {
    if (!isMarket || !holding.symbol || manualMode) return;
    let cancelled = false;
    fetch(
      `/api/market/priceOnDate?symbol=${encodeURIComponent(holding.symbol)}&date=${date}`,
    )
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 503) {
          setPrice({ status: "unavailable" });
          return;
        }
        const data = (await res.json()) as PriceOnDateResponse;
        if (res.status === 404 || !data.closeUSD || !data.date) {
          setPrice({ status: "no-data" });
          return;
        }
        setPrice({
          status: "ok",
          closeUSD: data.closeUSD,
          date: data.date,
        });
      })
      .catch(() => {
        if (!cancelled) setPrice({ status: "unavailable" });
      });
    return () => {
      cancelled = true;
    };
  }, [date, holding.symbol, isMarket, manualMode]);

  const effectivePrice: PriceState =
    !isMarket || !holding.symbol || manualMode ? { status: "idle" } : price;

  const parsedAmount = parseFloat(amount);

  const preview = useMemo(() => {
    if (!isMarket) return null;
    if (manualMode) {
      const s = parseFloat(manualShares);
      const p = parseFloat(manualPrice);
      if (!Number.isFinite(s) || !Number.isFinite(p) || s <= 0 || p <= 0) {
        return null;
      }
      const usd = s * p;
      return { shares: s, unitPriceUSD: p, amountUSD: usd };
    }
    if (effectivePrice.status !== "ok") return null;
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return null;
    // parsedAmount is in account currency — we need to know USD for shares math.
    // We show the preview in USD terms; final USD is recomputed on submit.
    if (accountCurrency === BASE_CURRENCY) {
      const shares = parsedAmount / effectivePrice.closeUSD;
      return {
        shares,
        unitPriceUSD: effectivePrice.closeUSD,
        amountUSD: parsedAmount,
      };
    }
    return {
      shares: NaN,
      unitPriceUSD: effectivePrice.closeUSD,
      amountUSD: NaN,
    };
  }, [
    isMarket,
    manualMode,
    manualShares,
    manualPrice,
    parsedAmount,
    effectivePrice,
    accountCurrency,
  ]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!accountId) return;

    let amountValue: number;
    let currency: string;
    let sharesDelta: number | undefined;
    let unitPriceUSD: number | undefined;

    if (isMarket && manualMode) {
      const s = parseFloat(manualShares);
      const p = parseFloat(manualPrice);
      if (!Number.isFinite(s) || !Number.isFinite(p) || s <= 0 || p <= 0) return;
      sharesDelta = s;
      unitPriceUSD = p;
      // USD amount equals shares × price; account outflow converted from USD.
      currency = accountCurrency;
      const rate =
        accountCurrency === BASE_CURRENCY
          ? 1
          : await getRate(BASE_CURRENCY, accountCurrency);
      amountValue = s * p * rate;
    } else {
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
      amountValue = parsedAmount;
      currency = accountCurrency;
      if (isMarket && effectivePrice.status === "ok") {
        unitPriceUSD = effectivePrice.closeUSD;
        const usdRate =
          accountCurrency === BASE_CURRENCY
            ? 1
            : await getRate(accountCurrency, BASE_CURRENCY);
        const usdAmount = parsedAmount * usdRate;
        sharesDelta = usdAmount / effectivePrice.closeUSD;
      }
    }

    setSubmitting(true);
    try {
      const payload: NewTransaction = {
        type: "investment",
        amount: amountValue,
        currency,
        accountId,
        categoryId: "",
        description: description.trim(),
        date,
        holdingId: holding.id,
        ...(typeof sharesDelta === "number" ? { sharesDelta } : {}),
        ...(typeof unitPriceUSD === "number" ? { unitPriceUSD } : {}),
        ...(isMarket && sharesDelta === undefined ? { unpriced: true } : {}),
      };
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  }

  const priceLine = (() => {
    if (!isMarket) return null;
    if (manualMode) return null;
    if (effectivePrice.status === "loading") return "Fetching price…";
    if (effectivePrice.status === "unavailable")
      return "Market data unavailable — the contribution will save without pricing.";
    if (effectivePrice.status === "no-data")
      return "No price data for that date — the contribution will save without pricing.";
    if (effectivePrice.status === "ok" && preview && Number.isFinite(preview.shares)) {
      return `≈ ${preview.shares.toFixed(4)} shares at ${formatCurrency(effectivePrice.closeUSD, "USD")} (close ${effectivePrice.date}).`;
    }
    if (effectivePrice.status === "ok" && preview) {
      return `Latest close ${formatCurrency(effectivePrice.closeUSD, "USD")} on ${effectivePrice.date}. Shares calculated in USD equivalent at save.`;
    }
    return null;
  })();

  const submitDisabled = (() => {
    if (submitting || !accountId) return true;
    if (isMarket && manualMode) {
      const s = parseFloat(manualShares);
      const p = parseFloat(manualPrice);
      return !Number.isFinite(s) || !Number.isFinite(p) || s <= 0 || p <= 0;
    }
    return !Number.isFinite(parsedAmount) || parsedAmount <= 0;
  })();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="rounded-[10px] bg-surface-2 border border-border px-4 py-3">
        <p className="text-xs text-fg-subtle">Contributing to</p>
        <p className="text-sm font-medium text-fg">
          {isMarket && holding.symbol ? `${holding.symbol} · ` : ""}
          {holding.name}
        </p>
      </div>

      {isMarket && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-fg-muted">
            {manualMode
              ? "Enter shares and price directly."
              : "Auto-priced from today's close."}
          </span>
          <button
            type="button"
            onClick={() => setManualMode((v) => !v)}
            className="text-xs text-fg-muted hover:text-fg underline underline-offset-2"
          >
            {manualMode ? "Use amount instead" : "Enter shares instead"}
          </button>
        </div>
      )}

      {isMarket && manualMode ? (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Shares"
            name="shares"
            type="number"
            inputMode="decimal"
            step="0.0001"
            min="0"
            value={manualShares}
            onChange={(e) => setManualShares(e.target.value)}
          />
          <Input
            label="Price USD"
            name="price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={manualPrice}
            onChange={(e) => setManualPrice(e.target.value)}
          />
        </div>
      ) : (
        <Input
          label={`Amount (${accountCurrency})`}
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
      )}

      {priceLine && (
        <p className="text-xs text-fg-subtle">{priceLine}</p>
      )}

      <Select
        label="From account"
        name="account"
        value={accountId}
        onChange={setSelectedAccountId}
        options={accounts.map((a) => ({ value: a.id, label: a.name }))}
        disabled={accountsLoading || accounts.length === 0}
      />

      <DatePicker
        label="Date"
        name="date"
        required
        value={date}
        onChange={setDate}
      />

      <Input
        label="Description"
        name="description"
        placeholder="Optional"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {isManualHolding && (
        <p className="text-xs text-fg-subtle">
          This holding tracks value from balance entries — record the current
          statement value under &quot;Update balance&quot; once your contribution
          is reflected.
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
        <Button type="submit" size="lg" fullWidth disabled={submitDisabled}>
          {submitting ? "Adding…" : "Add contribution"}
        </Button>
      </div>
    </form>
  );
}
