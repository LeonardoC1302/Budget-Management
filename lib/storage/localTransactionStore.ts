import type { NewTransaction, NewTransfer, Transaction } from "@/lib/types";
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
  async addMany(inputs: NewTransaction[]) {
    if (inputs.length === 0) return;
    const createdAt = new Date().toISOString();
    const priced: Transaction[] = await Promise.all(
      inputs.map(async (input) => {
        const rate = await getRate(input.currency, BASE_CURRENCY);
        return {
          ...input,
          amountUSD: input.amount * rate,
          id: makeId(),
          createdAt,
        };
      }),
    );
    write([...priced, ...read()]);
  },
  async addTransfer(input: NewTransfer) {
    const createdAt = new Date().toISOString();
    const conversionRate =
      input.fromCurrency === input.toCurrency
        ? 1
        : await getRate(input.fromCurrency, input.toCurrency);
    const toAmount = input.amount * conversionRate;
    const usdRate = await getRate(input.fromCurrency, BASE_CURRENCY);
    const amountUSD = input.amount * usdRate;

    const outId = makeId();
    const inId = makeId();
    const transferId = outId;

    const outDoc: Transaction = {
      id: outId,
      type: "transfer",
      amount: input.amount,
      amountUSD,
      currency: input.fromCurrency,
      accountId: input.fromAccountId,
      categoryId: "",
      description: input.description,
      date: input.date,
      createdAt,
      transferId,
      transferDirection: "out",
      linkedAccountId: input.toAccountId,
    };
    const inDoc: Transaction = {
      id: inId,
      type: "transfer",
      amount: toAmount,
      amountUSD,
      currency: input.toCurrency,
      accountId: input.toAccountId,
      categoryId: "",
      description: input.description,
      date: input.date,
      createdAt,
      transferId,
      transferDirection: "in",
      linkedAccountId: input.fromAccountId,
    };
    write([outDoc, inDoc, ...read()]);
  },
  async remove(id) {
    write(read().filter((t) => t.id !== id));
  },
  async update(id, input) {
    const rate = await getRate(input.currency, BASE_CURRENCY);
    const amountUSD = input.amount * rate;
    const items = read();
    const existing = items.find((t) => t.id === id);
    if (!existing) throw new Error(`Transaction ${id} not found`);
    const updated: Transaction = {
      ...existing,
      ...input,
      amountUSD,
    };
    write(items.map((t) => (t.id === id ? updated : t)));
    return updated;
  },
  async removeTransfer(transferId) {
    write(read().filter((t) => t.transferId !== transferId));
  },
};
