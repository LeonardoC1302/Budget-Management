import type { NewTransaction, Transaction } from "@/lib/types";

export const MAX_INSTALLMENTS = 48;

function addMonthsISO(iso: string, months: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const target = new Date(y, m - 1 + months, 1);
  // Clamp: a purchase on the 31st lands on the last day of shorter months.
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const day = Math.min(d, lastDay);
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function newPlanId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Split one purchase into `count` monthly charges, the first on the purchase
 * date. Cents are rounded per slice and the last slice absorbs the remainder,
 * so the slices always add up to the purchase exactly.
 */
export function expandInstallments(
  input: NewTransaction,
  count: number,
): NewTransaction[] {
  const planId = newPlanId();
  const total = Math.round(input.amount * 100) / 100;
  const slice = Math.floor((total / count) * 100) / 100;
  return Array.from({ length: count }, (_, i) => {
    const isLast = i === count - 1;
    const amount = isLast
      ? Math.round((total - slice * (count - 1)) * 100) / 100
      : slice;
    return {
      ...input,
      amount,
      date: addMonthsISO(input.date, i),
      installment: { planId, index: i + 1, count, total },
    };
  });
}

/** Future slices of installment plans, hidden from the ledger until due. */
export function isUpcomingInstallment(
  t: Pick<Transaction, "installment" | "date">,
  todayISO: string,
): boolean {
  return !!t.installment && t.date.slice(0, 10) > todayISO;
}
