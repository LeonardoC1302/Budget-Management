"use client";

import { useEffect, useState } from "react";
import Button from "@/components/atoms/Button";
import DatePicker from "@/components/atoms/DatePicker";
import Input from "@/components/atoms/Input";
import Select from "@/components/atoms/Select";
import { useAccounts } from "@/hooks/useAccounts";
import { getRate } from "@/lib/services/exchangeRates";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
import { formatCurrency, todayISODate } from "@/lib/utils/format";
import type { Holding, NewTransaction } from "@/lib/types";

import { t } from "@/lib/i18n";
import { apiFetch } from "@/lib/api/apiFetch";
interface HoldingContributionFormProps {
  holding: Holding;
  // Commission used on the last contribution to this holding, to prefill.
  lastFee?: number;
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
  lastFee,
  onSubmit,
  onCancel,
}: HoldingContributionFormProps) {
  const { accounts, loading: accountsLoading } = useAccounts();
  const [amount, setAmount] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [date, setDate] = useState(todayISODate());
  const [description, setDescription] = useState("");
  const [fee, setFee] = useState(lastFee ? String(lastFee) : "");
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
    apiFetch(
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
  const parsedFeeInput = parseFloat(fee);
  const feeInput = Number.isFinite(parsedFeeInput) && parsedFeeInput > 0 ? parsedFeeInput : 0;
  // The commission comes out of the amount; the rest buys shares.
  const investedAmount = parsedAmount - feeInput;

  // Cheap enough to recompute each render; the React Compiler memoizes it.
  const preview = (() => {
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
    if (!Number.isFinite(investedAmount) || investedAmount <= 0) return null;
    // investedAmount is in account currency — we need to know USD for shares math.
    // We show the preview in USD terms; final USD is recomputed on submit.
    if (accountCurrency === BASE_CURRENCY) {
      const shares = investedAmount / effectivePrice.closeUSD;
      return {
        shares,
        unitPriceUSD: effectivePrice.closeUSD,
        amountUSD: investedAmount,
      };
    }
    return {
      shares: NaN,
      unitPriceUSD: effectivePrice.closeUSD,
      amountUSD: NaN,
    };
  })();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!accountId) return;

    // What leaves the account.
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
      // The shares and price are what was bought; the commission is on top.
      amountValue = s * p * rate + feeInput;
    } else {
      if (!Number.isFinite(investedAmount) || investedAmount <= 0) return;
      // The amount is what leaves the account; the commission comes out of it.
      amountValue = parsedAmount;
      currency = accountCurrency;
      if (isMarket && effectivePrice.status === "ok") {
        unitPriceUSD = effectivePrice.closeUSD;
        const usdRate =
          accountCurrency === BASE_CURRENCY
            ? 1
            : await getRate(accountCurrency, BASE_CURRENCY);
        const usdAmount = investedAmount * usdRate;
        sharesDelta = usdAmount / effectivePrice.closeUSD;
      }
    }

    const feeValue = feeInput;

    setSubmitting(true);
    try {
      const payload: NewTransaction = {
        type: "investment",
        // `amount` is the total that left the account; shares were bought
        // with `amount - fee` (see Transaction.fee).
        amount: amountValue,
        ...(feeValue > 0 ? { fee: feeValue } : {}),
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
    if (effectivePrice.status === "loading") return t("Fetching price…");
    if (effectivePrice.status === "unavailable")
      return t("Market data unavailable — the contribution will save without pricing.");
    if (effectivePrice.status === "no-data")
      return t("No price data for that date — the contribution will save without pricing.");
    if (effectivePrice.status === "ok" && preview && Number.isFinite(preview.shares)) {
      return t("≈ {0} shares at {1} (close {date}).", { "0": preview.shares.toFixed(4), "1": formatCurrency(effectivePrice.closeUSD, "USD"), date: effectivePrice.date });
    }
    if (effectivePrice.status === "ok" && preview) {
      return t("Latest close {0} on {date}. Shares calculated in USD equivalent at save.", { "0": formatCurrency(effectivePrice.closeUSD, "USD"), date: effectivePrice.date });
    }
    return null;
  })();

  const feeTooHigh =
    !(isMarket && manualMode) &&
    feeInput > 0 &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    investedAmount <= 0;
  const totalLine = (() => {
    if (feeInput <= 0) return null;
    if (isMarket && manualMode) {
      const s = parseFloat(manualShares);
      const p = parseFloat(manualPrice);
      if (!Number.isFinite(s) || !Number.isFinite(p) || s <= 0 || p <= 0) return null;
      return t("The commission is paid on top of the shares bought.");
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || investedAmount <= 0) {
      return null;
    }
    return t("{invested} will be invested: {amount} leaves {account}, minus {fee} commission.", {
      invested: formatCurrency(investedAmount, accountCurrency),
      amount: formatCurrency(parsedAmount, accountCurrency),
      account: account?.name ?? t("the account"),
      fee: formatCurrency(feeInput, accountCurrency),
    });
  })();

  const submitDisabled = (() => {
    if (submitting || !accountId) return true;
    if (isMarket && manualMode) {
      const s = parseFloat(manualShares);
      const p = parseFloat(manualPrice);
      return !Number.isFinite(s) || !Number.isFinite(p) || s <= 0 || p <= 0;
    }
    return !Number.isFinite(investedAmount) || investedAmount <= 0;
  })();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="rounded-[10px] bg-surface-2 border border-border px-4 py-3">
        <p className="text-xs text-fg-subtle">{t("Contributing to")}</p>
        <p className="text-sm font-medium text-fg">
          {isMarket && holding.symbol ? `${holding.symbol} · ` : ""}
          {holding.name}
        </p>
      </div>

      {isMarket && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-fg-muted">
            {manualMode
              ? t("Enter shares and price directly.")
              : t("Auto-priced from today's close.")}
          </span>
          <button
            type="button"
            onClick={() => setManualMode((v) => !v)}
            className="text-xs text-fg-muted hover:text-fg underline underline-offset-2"
          >
            {manualMode ? t("Use amount instead") : t("Enter shares instead")}
          </button>
        </div>
      )}

      {isMarket && manualMode ? (
        <div className="grid grid-cols-2 gap-3 items-end">
          <Input
            label={t("Shares")}
            name="shares"
            type="number"
            inputMode="decimal"
            step="0.0001"
            min="0"
            value={manualShares}
            onChange={(e) => setManualShares(e.target.value)}
          />
          <Input
            label={t("Price USD")}
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
          label={t("Amount from account ({currency})", { currency: accountCurrency })}
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

      <div className="flex flex-col gap-1">
        <Input
          label={t("Commission ({currency}, optional)", { currency: accountCurrency })}
          name="fee"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          hint={t("What the broker charges for this buy. It comes out of the amount above and counts toward cost basis.")}
        />
        {feeTooHigh ? (
          <p className="text-xs text-expense">
            {t("The commission has to be less than the amount.")}
          </p>
        ) : (
          totalLine && <p className="text-xs text-fg-muted">{totalLine}</p>
        )}
      </div>

      <Select
        label={t("From account")}
        name="account"
        value={accountId}
        onChange={setSelectedAccountId}
        options={accounts.map((a) => ({ value: a.id, label: a.name }))}
        disabled={accountsLoading || accounts.length === 0}
      />

      <DatePicker
        label={t("Date")}
        name="date"
        required
        value={date}
        onChange={setDate}
      />

      <Input
        label={t("Description")}
        name="description"
        placeholder={t("Optional")}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {isManualHolding && (
        <p className="text-xs text-fg-subtle">
          {t("This holding tracks value from balance entries — record the current statement value under \"Update balance\" once your contribution is reflected.")}
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
        <Button type="submit" size="lg" fullWidth disabled={submitDisabled}>
          {submitting ? t("Adding…") : t("Add contribution")}
        </Button>
      </div>
    </form>
  );
}
