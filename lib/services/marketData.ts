import { getRate } from "@/lib/services/exchangeRates";

const BASE_URL = "https://api.twelvedata.com";

// Corporate proxies (Zscaler, etc.) intercept TLS and Node's fetch bypasses
// Windows proxy config. Honor HTTPS_PROXY / HTTP_PROXY when present so the
// same code runs on managed dev machines and vanilla environments alike.
let dispatcherReady = false;
async function ensureDispatcher(): Promise<void> {
  if (dispatcherReady) return;
  dispatcherReady = true;
  const proxy =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy;
  if (!proxy) return;
  try {
    const { ProxyAgent, setGlobalDispatcher } = await import("undici");
    setGlobalDispatcher(new ProxyAgent(proxy));
  } catch (err) {
    console.warn("[marketData] failed to configure proxy dispatcher:", err);
  }
}

export type MarketRange = "1M" | "3M" | "6M" | "1Y" | "5Y";

export interface QuoteResult {
  symbol: string;
  name: string;
  priceUSD: number;
  quoteCurrency: string;
  changePct: number | null;
  asOf: string;
}

export interface HistoryPoint {
  date: string;
  closeUSD: number;
}

export interface HistoryResult {
  symbol: string;
  quoteCurrency: string;
  points: HistoryPoint[];
}

export interface SymbolSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  instrumentType: string;
}

interface TwelveQuoteResponse {
  symbol?: string;
  name?: string;
  currency?: string;
  close?: string;
  price?: string;
  percent_change?: string;
  datetime?: string;
  status?: string;
  code?: number;
  message?: string;
}

interface TwelveTimeSeriesResponse {
  meta?: {
    symbol?: string;
    currency?: string;
  };
  values?: Array<{ datetime: string; close: string }>;
  status?: string;
  code?: number;
  message?: string;
}

interface TwelveSearchResponse {
  data?: Array<{
    symbol: string;
    instrument_name: string;
    exchange: string;
    currency: string;
    instrument_type: string;
  }>;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const quoteCache = new Map<string, CacheEntry<QuoteResult>>();
const historyCache = new Map<string, CacheEntry<HistoryResult>>();
const searchCache = new Map<string, CacheEntry<SymbolSearchResult[]>>();

const QUOTE_TTL_MS = 60 * 1000;
const HISTORY_TTL_MS = 10 * 60 * 1000;
const SEARCH_TTL_MS = 24 * 60 * 60 * 1000;

function apiKey(): string {
  const key = process.env.TWELVEDATA_API_KEY;
  if (!key) {
    throw new MarketDataUnavailableError(
      "TWELVEDATA_API_KEY is not set; market data is unavailable.",
    );
  }
  return key;
}

export class MarketDataUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarketDataUnavailableError";
  }
}

export class MarketDataRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarketDataRateLimitError";
  }
}

async function tdFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  await ensureDispatcher();
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("apikey", apiKey());

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (res.status === 429) {
    throw new MarketDataRateLimitError("Twelve Data rate limit reached.");
  }
  if (!res.ok) {
    throw new Error(`Twelve Data ${path} failed (${res.status}).`);
  }
  const data = (await res.json()) as T & {
    status?: string;
    code?: number;
    message?: string;
  };
  if (data && data.status === "error") {
    if (data.code === 429) {
      throw new MarketDataRateLimitError(data.message ?? "rate limit");
    }
    throw new Error(data.message ?? "Twelve Data returned an error.");
  }
  return data;
}

function keyify(input: Record<string, string>): string {
  return Object.entries(input)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

async function toUsd(amount: number, from: string): Promise<number> {
  if (!from || from === "USD") return amount;
  const rate = await getRate(from, "USD");
  return amount * rate;
}

/** Batched quote for one or more symbols. Returns results keyed by input symbol. */
export async function getQuotes(symbols: string[]): Promise<QuoteResult[]> {
  if (symbols.length === 0) return [];
  const uniq = Array.from(new Set(symbols.map((s) => s.trim()).filter(Boolean)));
  const results: QuoteResult[] = [];
  const misses: string[] = [];
  const now = Date.now();

  for (const s of uniq) {
    const hit = quoteCache.get(s);
    if (hit && hit.expiresAt > now) results.push(hit.value);
    else misses.push(s);
  }

  if (misses.length > 0) {
    const data = await tdFetch<Record<string, TwelveQuoteResponse> | TwelveQuoteResponse>(
      "/quote",
      { symbol: misses.join(",") },
    );

    const map: Record<string, TwelveQuoteResponse> =
      misses.length === 1
        ? { [misses[0]]: data as TwelveQuoteResponse }
        : (data as Record<string, TwelveQuoteResponse>);

    for (const s of misses) {
      const raw = map[s];
      if (!raw || !raw.close) continue;
      const nativePrice = parseFloat(raw.close);
      const currency = raw.currency ?? "USD";
      const priceUSD = await toUsd(nativePrice, currency);
      const changePctRaw = raw.percent_change ? parseFloat(raw.percent_change) : NaN;
      const quote: QuoteResult = {
        symbol: raw.symbol ?? s,
        name: raw.name ?? s,
        priceUSD,
        quoteCurrency: currency,
        changePct: Number.isFinite(changePctRaw) ? changePctRaw : null,
        asOf: raw.datetime ?? new Date().toISOString().slice(0, 10),
      };
      quoteCache.set(s, { value: quote, expiresAt: now + QUOTE_TTL_MS });
      results.push(quote);
    }
  }

  return results;
}

export async function getQuote(symbol: string): Promise<QuoteResult | null> {
  const [q] = await getQuotes([symbol]);
  return q ?? null;
}

const RANGE_OUTPUTSIZE: Record<MarketRange, number> = {
  "1M": 22,
  "3M": 66,
  "6M": 132,
  "1Y": 260,
  "5Y": 1300,
};

const RANGE_INTERVAL: Record<MarketRange, string> = {
  "1M": "1day",
  "3M": "1day",
  "6M": "1day",
  "1Y": "1day",
  "5Y": "1week",
};

export async function getHistory(
  symbol: string,
  range: MarketRange,
): Promise<HistoryResult> {
  const cacheKey = keyify({ symbol, range });
  const now = Date.now();
  const hit = historyCache.get(cacheKey);
  if (hit && hit.expiresAt > now) return hit.value;

  const data = await tdFetch<TwelveTimeSeriesResponse>("/time_series", {
    symbol,
    interval: RANGE_INTERVAL[range],
    outputsize: String(RANGE_OUTPUTSIZE[range]),
    order: "asc",
  });

  const currency = data.meta?.currency ?? "USD";
  const values = data.values ?? [];
  const rate = currency === "USD" ? 1 : await getRate(currency, "USD");
  const points: HistoryPoint[] = values
    .map((v) => {
      const close = parseFloat(v.close);
      if (!Number.isFinite(close)) return null;
      return { date: v.datetime, closeUSD: close * rate };
    })
    .filter((p): p is HistoryPoint => p !== null);

  const result: HistoryResult = {
    symbol: data.meta?.symbol ?? symbol,
    quoteCurrency: currency,
    points,
  };
  historyCache.set(cacheKey, { value: result, expiresAt: now + HISTORY_TTL_MS });
  return result;
}

/** Fetches the close price on a specific date. Falls back to the nearest prior close. */
export async function getPriceOnDate(
  symbol: string,
  isoDate: string,
): Promise<{ closeUSD: number; quoteCurrency: string; date: string } | null> {
  const cacheKey = keyify({ symbol, date: isoDate });
  const now = Date.now();
  const hit = historyCache.get(cacheKey);
  if (hit && hit.expiresAt > now && hit.value.points.length > 0) {
    const last = hit.value.points[hit.value.points.length - 1];
    return {
      closeUSD: last.closeUSD,
      quoteCurrency: hit.value.quoteCurrency,
      date: last.date,
    };
  }

  const start = new Date(isoDate);
  start.setDate(start.getDate() - 7);
  const startIso = start.toISOString().slice(0, 10);

  const data = await tdFetch<TwelveTimeSeriesResponse>("/time_series", {
    symbol,
    interval: "1day",
    start_date: startIso,
    end_date: isoDate,
    order: "asc",
  });

  const values = data.values ?? [];
  if (values.length === 0) return null;
  const last = values[values.length - 1];
  const nativeClose = parseFloat(last.close);
  if (!Number.isFinite(nativeClose)) return null;
  const currency = data.meta?.currency ?? "USD";
  const rate = currency === "USD" ? 1 : await getRate(currency, "USD");
  const closeUSD = nativeClose * rate;

  historyCache.set(cacheKey, {
    value: {
      symbol,
      quoteCurrency: currency,
      points: [{ date: last.datetime, closeUSD }],
    },
    expiresAt: now + 24 * 60 * 60 * 1000,
  });

  return { closeUSD, quoteCurrency: currency, date: last.datetime };
}

export async function searchSymbols(query: string): Promise<SymbolSearchResult[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  const now = Date.now();
  const hit = searchCache.get(q.toLowerCase());
  if (hit && hit.expiresAt > now) return hit.value;

  const data = await tdFetch<TwelveSearchResponse>("/symbol_search", {
    symbol: q,
    outputsize: "20",
  });
  const results: SymbolSearchResult[] = (data.data ?? []).map((r) => ({
    symbol: r.symbol,
    name: r.instrument_name,
    exchange: r.exchange,
    currency: r.currency,
    instrumentType: r.instrument_type,
  }));
  searchCache.set(q.toLowerCase(), {
    value: results,
    expiresAt: now + SEARCH_TTL_MS,
  });
  return results;
}
