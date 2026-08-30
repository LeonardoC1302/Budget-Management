import { planMaterializations } from "@/lib/recurring/materialize";
import { pickBccrRate, type BccrSnapshot } from "@/lib/services/bccrRates";
import { getRate } from "@/lib/services/exchangeRates";
import {
  accountStore,
  recurringTransactionStore,
  transactionStore,
} from "@/lib/storage";
import { todayISODate } from "@/lib/utils/format";
import type {
  Account,
  NewTransaction,
  RateSource,
  RecurringTransaction,
} from "@/lib/types";

type FxDirection = "USD_TO_CRC" | "CRC_TO_USD";

function directionFor(from: string, to: string): FxDirection | null {
  if (from === "USD" && to === "CRC") return "USD_TO_CRC";
  if (from === "CRC" && to === "USD") return "CRC_TO_USD";
  return null;
}

async function fetchBccrSnapshotOrNull(): Promise<BccrSnapshot | null> {
  try {
    const res = await fetch("/api/rates/bccr");
    if (!res.ok) return null;
    const data = (await res.json()) as BccrSnapshot & { error?: string };
    if (data.error || !Array.isArray(data.entities) || !data.fetchedAt) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

async function resolveFallbackRate(
  from: string,
  to: string,
): Promise<number | null> {
  try {
    return await getRate(from, to);
  } catch {
    return null;
  }
}

/**
 * Materializes all missed occurrences for the given templates (or all templates
 * if none are passed) into real transactions and advances each template's
 * `lastGeneratedDate`. Returns true if anything was inserted.
 *
 * Only materializes templates the current user owns. Guest-visible templates
 * from shared connections are materialized when their owner is active — this
 * avoids duplicate materialization races and keeps write permissions honest.
 *
 * For templates whose currency differs from their account's currency, the FX
 * rate is fetched right before insert — a BCCR bank rate when the template
 * carries `rateBccrEntity` and the pair is USD↔CRC, otherwise the generic
 * open.er-api.com fallback. The resolved `rateSource` is attached to each
 * generated transaction so `firebaseTransactionStore.addMany` computes
 * `accountAmount`/`amountUSD` from the intended source.
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

  const accounts = await accountStore.list();
  const accountsByKey = new Map<string, Account>();
  for (const account of accounts) {
    const uid = account._owner?.uid ?? "";
    accountsByKey.set(`${uid}:${account.id}`, account);
    accountsByKey.set(`:${account.id}`, account);
  }

  const needsBccr = plans.some((plan) => {
    const uid = plan.ownerUid ?? "";
    const account =
      accountsByKey.get(`${uid}:${plan.accountId}`) ??
      accountsByKey.get(`:${plan.accountId}`);
    if (!account) return false;
    if (plan.currency === account.currency) return false;
    if (!plan.rateBccrEntity) return false;
    return directionFor(plan.currency, account.currency) !== null;
  });
  const bccrSnapshot = needsBccr ? await fetchBccrSnapshotOrNull() : null;

  const toInsert: NewTransaction[] = [];
  for (const plan of plans) {
    const uid = plan.ownerUid ?? "";
    const account =
      accountsByKey.get(`${uid}:${plan.accountId}`) ??
      accountsByKey.get(`:${plan.accountId}`);
    const accountCurrency = account?.currency ?? plan.currency;

    let rateSource: RateSource | undefined;
    if (plan.currency !== accountCurrency) {
      const direction = directionFor(plan.currency, accountCurrency);
      if (direction && plan.rateBccrEntity && bccrSnapshot) {
        const entity = bccrSnapshot.entities.find(
          (e) => e.id === plan.rateBccrEntity!.id,
        );
        const picked = entity ? pickBccrRate(entity, direction) : null;
        if (entity && picked) {
          rateSource = {
            provider: "bccr",
            entityId: entity.id,
            entityName: entity.name,
            rate: picked.rate,
            side: picked.side,
            snapshotAt: bccrSnapshot.fetchedAt,
          };
        }
      }
      if (!rateSource) {
        const fallback = await resolveFallbackRate(
          plan.currency,
          accountCurrency,
        );
        if (fallback !== null) {
          rateSource = { provider: "fallback", rate: fallback };
        }
      }
    }

    for (const tx of plan.transactions) {
      toInsert.push(rateSource ? { ...tx, rateSource } : tx);
    }
  }

  await transactionStore.addMany(toInsert);
  await recurringTransactionStore.updateLastGeneratedDates(
    plans.map((p) => ({
      id: p.templateId,
      lastGeneratedDate: p.lastGeneratedDate,
    })),
  );
  return true;
}
