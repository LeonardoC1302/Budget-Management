import type { RateSource, Transaction } from "@/lib/types";

type UsdRatesCache = { rates: Record<string, number>; fetchedAt: number };

let usdRatesCache: UsdRatesCache | null = null;
let usdRatesInflight: Promise<Record<string, number>> | null = null;
const USD_RATES_TTL_MS = 60 * 60 * 1000;
// The last good table also lives in localStorage so conversions keep working
// offline. A stale rate beats blocking a transaction; the online refresh
// replaces it as soon as the connection is back.
const STORAGE_KEY = "perch:usdRates";

function readStoredRates(): UsdRatesCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UsdRatesCache;
    return parsed && parsed.rates && typeof parsed.fetchedAt === "number"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function storeRates(cache: UsdRatesCache) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full or blocked: the in-memory cache still works.
  }
}

// Rates come from the BCCR (lib/services/bccrUsdRates.ts). Server code reads
// them directly; the browser goes through /api/rates/usd so the BCCR token
// stays on the server. Both imports are dynamic so neither side bundles the
// other's code path.
async function fetchUsdRates(): Promise<Record<string, number>> {
  if (typeof window === "undefined") {
    const { getBccrUsdRates } = await import("@/lib/services/bccrUsdRates");
    return (await getBccrUsdRates()).rates;
  }
  const { apiFetch } = await import("@/lib/api/apiFetch");
  const res = await apiFetch("/api/rates/usd");
  if (!res.ok) {
    throw new Error(`Failed to fetch latest rates (${res.status}).`);
  }
  const data = (await res.json()) as { rates?: Record<string, number> };
  if (!data.rates || typeof data.rates.CRC !== "number") {
    throw new Error("Malformed rates response.");
  }
  return data.rates;
}

async function getUsdRates(): Promise<Record<string, number>> {
  usdRatesCache ??= readStoredRates();
  if (
    usdRatesCache &&
    Date.now() - usdRatesCache.fetchedAt < USD_RATES_TTL_MS
  ) {
    return usdRatesCache.rates;
  }
  // Screens that load together share one request.
  usdRatesInflight ??= fetchUsdRates().finally(() => {
    usdRatesInflight = null;
  });
  try {
    const rates = await usdRatesInflight;
    usdRatesCache = { rates, fetchedAt: Date.now() };
    storeRates(usdRatesCache);
    return rates;
  } catch (err) {
    if (usdRatesCache) return usdRatesCache.rates;
    throw err;
  }
}

/** When the rates in use were fetched, or null if none are loaded yet. */
export function usdRatesFetchedAt(): number | null {
  usdRatesCache ??= readStoredRates();
  return usdRatesCache?.fetchedAt ?? null;
}

/**
 * Fetch the current exchange rate from `from` to `to`. Rates come from the
 * BCCR's daily table (dollar↔colón at the midpoint of the reference buy and
 * sell rates, plus about 45 other currencies). The table is cached for an
 * hour in memory and in localStorage, so conversions are cheap and keep
 * working offline.
 */
export async function getRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const rates = await getUsdRates();
  const fromRate = from === "USD" ? 1 : rates[from];
  const toRate = to === "USD" ? 1 : rates[to];
  if (typeof fromRate !== "number" || typeof toRate !== "number") {
    throw new Error(`No rate available for ${from}→${to}.`);
  }
  return toRate / fromRate;
}

/**
 * Return the amount converted from `from` to `to` using the provided
 * `RateSource`. Falls back to `getRate` when the source isn't enough to
 * resolve the pair (e.g. a BCCR rate for a non-USD/CRC transfer).
 * BCCR rates are always CRC per 1 USD, so the direction has to be applied
 * explicitly. Fallback and manual rates are already stored in the
 * `from → to` direction and can be used directly.
 */
export async function convertUsingRateSource(
  amount: number,
  from: string,
  to: string,
  source: RateSource | undefined,
): Promise<number> {
  if (from === to) return amount;
  if (!source) return amount * (await getRate(from, to));
  if (source.provider === "fallback" || source.provider === "manual") {
    return amount * source.rate;
  }
  if (from === "USD" && to === "CRC") return amount * source.rate;
  if (from === "CRC" && to === "USD") return amount / source.rate;
  return amount * (await getRate(from, to));
}

/**
 * Convert an amount to its USD equivalent using the provided rate source.
 * For BCCR rates the CRC↔USD leg is derived directly from the entity's rate;
 * anything else falls through to `getRate`.
 */
export async function amountInUsd(
  amount: number,
  currency: string,
  source: RateSource | undefined,
): Promise<number> {
  if (currency === "USD") return amount;
  if (source) {
    if (source.provider === "bccr") {
      if (currency === "CRC") return amount / source.rate;
    } else {
      // Fallback and manual rates are directional; we can't safely reuse them
      // for the USD leg unless we know the "to" currency was USD. The caller
      // supplies the rate for tx→account only, so fall through.
    }
  }
  return amount * (await getRate(currency, "USD"));
}

/**
 * USD value of a transfer. When either side is already USD that side is used
 * as-is, so a transfer priced with a custom or bank rate records the USD
 * figure that actually moved instead of a mid-market estimate.
 */
export async function transferAmountInUsd(
  amount: number,
  fromCurrency: string,
  toAmount: number,
  toCurrency: string,
  source: RateSource | undefined,
): Promise<number> {
  if (fromCurrency === "USD") return amount;
  if (toCurrency === "USD") return toAmount;
  return amountInUsd(amount, fromCurrency, source);
}

/**
 * Re-price a transaction into `accountCurrency` after its account changed
 * currency. Works from the transaction's own `amount`/`currency`, never from
 * the stale `accountAmount`:
 * - same currency → the original amount, exactly;
 * - a transfer leg whose paired leg is already in `accountCurrency` → that
 *   leg's amount, so a USD payment into a card now in USD matches what left
 *   the source account;
 * - a USD account → the USD value recorded when the transaction was saved,
 *   so switching a card back to USD restores its original figures instead
 *   of re-pricing old purchases at today's rate;
 * - a BCCR rate on a USD↔CRC pair → that same bank rate;
 * - anything else → today's rate (fallback/manual rates were quoted for the
 *   old account currency and don't apply to the new pair).
 */
export async function amountInAccountCurrency(
  tx: Pick<Transaction, "amount" | "currency" | "rateSource" | "amountUSD">,
  accountCurrency: string,
  pairedLeg?: Pick<Transaction, "amount" | "currency">,
): Promise<number> {
  if (tx.currency === accountCurrency) return tx.amount;
  if (pairedLeg && pairedLeg.currency === accountCurrency) {
    return pairedLeg.amount;
  }
  if (accountCurrency === "USD" && typeof tx.amountUSD === "number") {
    return tx.amountUSD;
  }
  const source = tx.rateSource?.provider === "bccr" ? tx.rateSource : undefined;
  return convertUsingRateSource(tx.amount, tx.currency, accountCurrency, source);
}
