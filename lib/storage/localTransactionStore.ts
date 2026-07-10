import type { Transaction } from "@/lib/types";
import type { TransactionStore } from "@/lib/storage/TransactionStore";
import { getRate } from "@/lib/services/exchangeRates";
import { BASE_CURRENCY } from "@/lib/utils/currencies";

// Schema v2: transactions now reference `accountId` and `categoryId`.
// Any data stored under the v1 key is ignored (pre-release breaking change).
const KEY = "budget:transactions:v2";

function read(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch {
    return [];
  }
}

function write(items: Transaction[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function hydrate(t: Transaction): Transaction {
  return {
    ...t,
    currency: t.currency ?? BASE_CURRENCY,
    amountUSD: typeof t.amountUSD === "number" ? t.amountUSD : t.amount,
  };
}

export const localTransactionStore: TransactionStore = {
  async list() {
    return read()
      .map(hydrate)
      .sort((a, b) => b.date.localeCompare(a.date));
  },
  async add(input) {
    const rate = await getRate(input.currency, BASE_CURRENCY);
    const transaction: Transaction = {
      ...input,
      amountUSD: input.amount * rate,
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    write([transaction, ...read()]);
    return transaction;
  },
  async remove(id) {
    write(read().filter((t) => t.id !== id));
  },
};
