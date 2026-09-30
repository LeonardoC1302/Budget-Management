import { amountInAccountCurrency } from "@/lib/services/exchangeRates";
import type { Transaction } from "@/lib/types";

const EPSILON = 0.005;

const round2 = (n: number) => Math.round(n * 100) / 100;

// Same-day ordering: charges before payments, so a payment made the day of a
// purchase can cover it.
function kindRank(t: Transaction): number {
  return t.type === "transfer" && t.transferDirection === "in" ? 1 : 0;
}

/**
 * New `accountAmount` for every transaction on an account that is switching
 * to `currency`.
 *
 * Each transaction is first re-priced on its own terms (see
 * amountInAccountCurrency). On a credit card, payments then get a second
 * pass: a payment converts at the same effective rate as the charges it paid
 * off, matched oldest-first in the old currency. A $647.19 payment that
 * cleared a statement of ₡357,045 in purchases becomes ₡357,045 on the CRC
 * card, instead of whatever $647.19 is worth at today's rate, which would
 * leave a phantom credit or debt. Any part of a payment beyond the charges
 * before it (e.g. paying down an opening balance) keeps the direct
 * conversion.
 */
export async function rebaseAccountAmounts(
  txs: Transaction[],
  currency: string,
  pairedLegOf: (t: Transaction) => Transaction | undefined,
  isCard: boolean,
): Promise<Map<string, number>> {
  const next = new Map<string, number>();
  await Promise.all(
    txs.map(async (t) => {
      next.set(t.id, await amountInAccountCurrency(t, currency, pairedLegOf(t)));
    }),
  );
  if (!isCard) return next;

  const ordered = [...txs].sort((a, b) =>
    a.date === b.date ? kindRank(a) - kindRank(b) : a.date < b.date ? -1 : 1,
  );
  // Unpaid charges, oldest first: what's left in the old currency and the
  // matching amount in the new one.
  const unpaid: { old: number; now: number }[] = [];

  for (const t of ordered) {
    const oldAmount = t.accountAmount ?? t.amount;
    if (t.type === "expense" || t.type === "investment") {
      if (oldAmount > EPSILON) unpaid.push({ old: oldAmount, now: next.get(t.id)! });
      continue;
    }
    if (t.type !== "transfer" || t.transferDirection !== "in") continue;

    let remaining = oldAmount;
    let covered = 0;
    while (remaining > EPSILON && unpaid.length > 0) {
      const head = unpaid[0];
      const take = Math.min(remaining, head.old);
      const share = head.now * (take / head.old);
      covered += share;
      head.old -= take;
      head.now -= share;
      remaining -= take;
      if (head.old <= EPSILON) unpaid.shift();
    }

    // A payment already in the new currency (or whose source leg is) is an
    // exact figure; it still settles charges above but keeps its amount.
    const exact =
      t.currency === currency || pairedLegOf(t)?.currency === currency;
    if (exact || oldAmount <= EPSILON) continue;
    const direct = next.get(t.id)!;
    next.set(t.id, round2(covered + direct * (Math.max(0, remaining) / oldAmount)));
  }
  return next;
}
