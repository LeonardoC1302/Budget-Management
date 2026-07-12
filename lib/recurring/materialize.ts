import { computeOccurrencesBetween, toRule } from "@/lib/recurring/engine";
import type { NewTransaction, RecurringTransaction } from "@/lib/types";

export interface PlannedMaterialization {
  templateId: string;
  lastGeneratedDate: string;
  transactions: NewTransaction[];
}

/**
 * Given active templates and today's date, compute which occurrences need to
 * be materialized as real transactions. Callers are expected to:
 *   1. Insert `transactions` via TransactionStore.addMany.
 *   2. Update `lastGeneratedDate` on each template so this call is idempotent.
 */
export function planMaterializations(
  templates: RecurringTransaction[],
  today: string,
): PlannedMaterialization[] {
  const plans: PlannedMaterialization[] = [];
  for (const template of templates) {
    if (!template.active) continue;
    const dates = computeOccurrencesBetween(
      toRule(template),
      template.lastGeneratedDate,
      today,
    );
    if (dates.length === 0) continue;

    const transactions: NewTransaction[] = dates.map((date) => ({
      type: template.type,
      amount: template.amount,
      currency: template.currency,
      accountId: template.accountId,
      categoryId: template.categoryId,
      description: template.description,
      date,
      recurringId: template.id,
    }));

    plans.push({
      templateId: template.id,
      lastGeneratedDate: dates[dates.length - 1],
      transactions,
    });
  }
  return plans;
}
