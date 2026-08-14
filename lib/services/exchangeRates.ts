interface OpenErApiResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
}

import type { RateSource } from "@/lib/types";

import type { RateSource } from "@/lib/types";

let usdRatesCache: { rates: Record<string, number>; fetchedAt: number } | null =
  null;
const USD_RATES_TTL_MS = 60 * 60 * 1000;

async function getUsdRates(): Promise<Record<string, number>> {
  if (
    usdRatesCache &&
    Date.now() - usdRatesCache.fetchedAt < USD_RATES_TTL_MS
  ) {
    return usdRatesCache.rates;
  }
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) {
    throw new Error(`Failed to fetch latest rates (${res.status}).`);
  }
  const data = (await res.json()) as OpenErApiResponse;
  if (data.result !== "success" || !data.rates) {
    throw new Error("Malformed rates response from open.er-api.com.");
  }
  usdRatesCache = { rates: data.rates, fetchedAt: Date.now() };
  return data.rates;
}

/**
 * Fetch the current exchange rate from `from` to `to`. Rates come from
 * open.er-api.com (~160 currencies, refreshed hourly upstream). The USD
 * rate table is cached in-memory for one hour, so back-to-back conversions
 * are cheap and rates advance as the upstream data does.
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
 * explicitly. Fallback rates from the picker are already stored in the
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
  if (source.provider === "fallback") return amount * source.rate;
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
    } else if (source.provider === "fallback") {
      // A fallback rate is directional; we can't safely reuse it for the USD
      // leg unless we know the "to" currency was USD. The caller supplies the
      // rate for tx→account only, so fall through.
    }
  }
  return amount * (await getRate(currency, "USD"));
}
