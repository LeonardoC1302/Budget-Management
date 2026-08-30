import { planMaterializations } from "@/lib/recurring/materialize";
import {
  recurringTransactionStore,
  transactionStore,
} from "@/lib/storage";
import { todayISODate } from "@/lib/utils/format";
import type { RecurringTransaction } from "@/lib/types";

/**
 * Materializes all missed occurrences for the given templates (or all templates
 * if none are passed) into real transactions and advances each template's
 * `lastGeneratedDate`. Returns true if anything was inserted.
 *
 * Only materializes templates the current user owns. Guest-visible templates
 * from shared connections are materialized when their owner is active — this
 * avoids duplicate materialization races and keeps write permissions honest.
 */
export async function runMaterialization(
  templates?: RecurringTransaction[],
): Promise<boolean> {
  const list = templates ?? (await recurringTransactionStore.list());
  const mine = list.filter(
    (t) => !t._owner || t._owner.permission === "owner",
  );
  const plans = planMaterializations(mine, todayISODate());
  if (plans.length === 0) return false;

  await transactionStore.addMany(plans.flatMap((p) => p.transactions));
  await recurringTransactionStore.updateLastGeneratedDates(
    plans.map((p) => ({
      id: p.templateId,
      lastGeneratedDate: p.lastGeneratedDate,
    })),
  );
  return true;
}
