import { getRate } from "@/lib/services/exchangeRates";

/**
 * Convert an amount field when an existing account or card changes currency,
 * so a $15,000 limit becomes about ₡7.5M instead of ₡15,000. Uses today's
 * rate, rounded to cents. Returns null when there's nothing to convert or no
 * rate is available (offline with no cached rates); callers keep the typed
 * value in that case.
 */
export async function convertAmountInput(
  raw: string,
  from: string,
  to: string,
): Promise<{ value: string; original: number } | null> {
  const original = parseFloat(raw);
  if (!Number.isFinite(original) || original === 0 || from === to) return null;
  try {
    const rate = await getRate(from, to);
    return { value: String(Math.round(original * rate * 100) / 100), original };
  } catch {
    return null;
  }
}
