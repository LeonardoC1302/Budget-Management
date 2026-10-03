// General exchange rates for every conversion that doesn't use a specific
// bank's window rate, from BCCR table 520 ("Tipos de cambio"): the dollar's
// reference buy/sell rate in colones plus about 45 other currencies against
// the dollar. Server-only (see lib/services/bccrApi.ts); the browser gets
// these through /api/rates/usd.

import { fetchSddeTable, latestPoint } from "@/lib/services/bccrApi";

const RATES_TABLE = 520;
const REFERENCE_BUY = "317";
const REFERENCE_SELL = "318";
const TTL_MS = 60 * 60 * 1000;
// Serve the last good table while the API is down, up to this age.
const STALE_LIMIT_MS = 24 * 60 * 60 * 1000;

// The BCCR quotes these as dollars per unit; every other currency in the
// table is units per dollar.
const DOLLARS_PER_UNIT = new Set(["EUR", "GBP", "AUD", "NZD"]);
// Special drawing rights: not a currency anyone holds an account in.
const SKIP = new Set(["DEG", "XDR"]);

export interface UsdRates {
  // Units of each currency per 1 USD (USD itself is 1).
  rates: Record<string, number>;
  // Date of the most recent BCCR posting (YYYY-MM-DD).
  asOf?: string;
  fetchedAt: string;
}

let cache: { value: UsdRates; storedAt: number } | null = null;

/** ISO code from names like "Euro (EUR)" or "Renmimbi China (Yuan) (CNY))". */
function isoCode(name: string): string | null {
  const codes = [...name.matchAll(/\(([A-Z]{3})\)/g)].map((m) => m[1]);
  return codes.length > 0 ? codes[codes.length - 1] : null;
}

async function load(): Promise<UsdRates> {
  const indicators = await fetchSddeTable(RATES_TABLE);
  const rates: Record<string, number> = { USD: 1 };
  let buy: number | null = null;
  let sell: number | null = null;
  let asOf: string | undefined;

  for (const indicator of indicators) {
    const point = latestPoint(indicator.series ?? []);
    if (!point) continue;
    if (!asOf || point.date > asOf) asOf = point.date;

    if (indicator.codigoIndicador === REFERENCE_BUY) buy = point.value;
    else if (indicator.codigoIndicador === REFERENCE_SELL) sell = point.value;
    else {
      const code = isoCode(indicator.nombreIndicador);
      if (!code || SKIP.has(code)) continue;
      rates[code] = DOLLARS_PER_UNIT.has(code) ? 1 / point.value : point.value;
    }
  }

  // Colones per dollar: the midpoint of the BCCR reference buy and sell
  // rates, a neutral rate for totals and conversions. Picking a bank in a
  // form still uses that bank's own window rate.
  if (buy === null || sell === null) {
    throw new Error("BCCR returned no dollar reference rate.");
  }
  rates.CRC = (buy + sell) / 2;
  return { rates, asOf, fetchedAt: new Date().toISOString() };
}

export async function getBccrUsdRates(): Promise<UsdRates> {
  if (cache && Date.now() - cache.storedAt < TTL_MS) return cache.value;
  try {
    const value = await load();
    cache = { value, storedAt: Date.now() };
    return value;
  } catch (err) {
    if (cache && Date.now() - cache.storedAt < STALE_LIMIT_MS) {
      console.warn("[bccr] using cached exchange rates:", err);
      return cache.value;
    }
    throw err;
  }
}
