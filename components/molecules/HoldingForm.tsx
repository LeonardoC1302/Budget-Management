"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import { cn } from "@/lib/utils/cn";
import type { Holding, HoldingKind, NewHolding } from "@/lib/types";

interface HoldingFormProps {
  initial?: Holding;
  onSubmit: (input: NewHolding) => void | Promise<void>;
  onCancel?: () => void;
}

interface SearchHit {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  instrumentType: string;
}

interface SearchResponse {
  results?: SearchHit[];
  error?: string;
}

export default function HoldingForm({
  initial,
  onSubmit,
  onCancel,
}: HoldingFormProps) {
  const isEditing = !!initial;
  const [kind, setKind] = useState<HoldingKind>(initial?.kind ?? "market");
  const [name, setName] = useState(initial?.name ?? "");
  const [symbol, setSymbol] = useState(initial?.symbol ?? "");
  const [quoteCurrency, setQuoteCurrency] = useState(initial?.quoteCurrency ?? "USD");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const canEditSymbol = !isEditing;

  useEffect(() => {
    if (kind !== "market") return;
    const q = query.trim();
    if (q.length < 1) return;
    const t = window.setTimeout(() => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setSearching(true);
      setSearchError(null);
      fetch(`/api/market/search?q=${encodeURIComponent(q)}`, {
        signal: ctrl.signal,
      })
        .then(async (res) => {
          const data = (await res.json()) as SearchResponse;
          if (!res.ok) {
            setSearchError(data.error ?? "Search unavailable.");
            setHits([]);
          } else {
            setHits(data.results ?? []);
          }
        })
        .catch((err) => {
          if ((err as Error).name === "AbortError") return;
          setSearchError("Search unavailable.");
        })
        .finally(() => setSearching(false));
    }, 250);
    return () => window.clearTimeout(t);
  }, [query, kind]);

  const visibleHits =
    kind === "market" && query.trim().length > 0 ? hits : [];

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (kind === "market" && !symbol.trim()) return false;
    return true;
  }, [name, kind, symbol]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload: NewHolding =
        kind === "market"
          ? {
              kind: "market",
              name: name.trim(),
              symbol: symbol.trim().toUpperCase(),
              quoteCurrency: quoteCurrency.trim().toUpperCase() || "USD",
              provider: "twelvedata",
            }
          : {
              kind: "manual",
              name: name.trim(),
              ...(symbol.trim()
                ? { symbol: symbol.trim().toUpperCase() }
                : {}),
            };
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  }

  function pickHit(hit: SearchHit) {
    setSymbol(hit.symbol);
    setName((prev) => prev.trim() || hit.name);
    setQuoteCurrency(hit.currency || "USD");
    setQuery("");
    setHits([]);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {!isEditing && (
        <div
          role="tablist"
          aria-label="Holding kind"
          className="grid grid-cols-2 p-1 bg-surface-2 border border-border rounded-[12px]"
        >
          {(["market", "manual"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className={cn(
                "h-9 text-sm font-medium rounded-[8px] transition-colors capitalize",
                kind === k
                  ? "bg-invest-soft text-invest"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              {k}
            </button>
          ))}
        </div>
      )}

      {kind === "market" && (
        <>
          <div className="flex flex-col gap-1.5">
            <Input
              label="Search a ticker"
              name="symbol-search"
              placeholder="e.g. SPY, QQQ, AAPL, BTC/USD"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={!canEditSymbol}
            />
            {searching && (
              <p className="text-xs text-fg-subtle">Searching…</p>
            )}
            {searchError && (
              <p role="status" className="text-xs text-expense">
                {searchError}
              </p>
            )}
            {visibleHits.length > 0 && (
              <ul className="surface divide-y divide-border max-h-56 overflow-y-auto">
                {visibleHits.map((hit, i) => (
                  <li key={`${hit.symbol}-${hit.exchange}-${i}`}>
                    <button
                      type="button"
                      onClick={() => pickHit(hit)}
                      className="w-full text-left px-3 py-2 hover:bg-surface-2 transition-colors flex items-center justify-between gap-3"
                    >
                      <span className="min-w-0">
                        <span className="text-sm font-medium text-fg">
                          {hit.symbol}
                        </span>
                        <span className="block text-xs text-fg-subtle truncate">
                          {hit.name}
                        </span>
                      </span>
                      <span className="text-[10px] text-fg-subtle shrink-0">
                        {hit.exchange} · {hit.currency}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Input
            label="Symbol"
            name="symbol"
            required
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            disabled={!canEditSymbol}
          />
          {!canEditSymbol && (
            <p className="text-xs text-fg-subtle">
              Symbol is fixed once created — create a new position to switch tickers.
            </p>
          )}
          <Input
            label="Quote currency"
            name="quoteCurrency"
            value={quoteCurrency}
            onChange={(e) => setQuoteCurrency(e.target.value.toUpperCase())}
          />
        </>
      )}

      <Input
        label="Name"
        name="name"
        required
        placeholder={
          kind === "manual" ? "e.g. Complementary pension" : "e.g. S&P 500 ETF"
        }
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {kind === "manual" && (
        <div className="flex flex-col gap-1">
          <Input
            label="Symbol (optional)"
            name="manual-symbol"
            placeholder="e.g. PENS, GOLD, RE"
            maxLength={6}
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          />
          <p className="text-xs text-fg-subtle">
            Up to 6 characters. Shown on the position tile instead of “MANUAL”.
          </p>
        </div>
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
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={!canSubmit || submitting}
        >
          {submitting
            ? isEditing ? "Saving…" : "Adding…"
            : isEditing ? "Save changes" : "Add position"}
        </Button>
      </div>
    </form>
  );
}
