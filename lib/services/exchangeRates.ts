interface OpenErApiResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
}

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
