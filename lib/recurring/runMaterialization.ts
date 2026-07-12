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
 */
export async function runMaterialization(
  templates?: RecurringTransaction[],
): Promise<boolean> {
  const list = templates ?? (await recurringTransactionStore.list());
  const plans = planMaterializations(list, todayISODate());
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
