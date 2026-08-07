import type { Account, NewTransaction, NewTransfer, Transaction } from "@/lib/types";
import type { TransactionStore } from "@/lib/storage/TransactionStore";
import { getRate } from "@/lib/services/exchangeRates";
import { BASE_CURRENCY } from "@/lib/utils/currencies";

// Schema v2: transactions now reference `accountId` and `categoryId`.
// Any data stored under the v1 key is ignored (pre-release breaking change).
const KEY = "budget:transactions:v2";
const ACCOUNTS_KEY = "budget:accounts:v1";

function readAccountCurrency(accountId: string): string {
  if (typeof window === "undefined") return BASE_CURRENCY;
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return BASE_CURRENCY;
    const list = JSON.parse(raw) as Account[];
    return list.find((a) => a.id === accountId)?.currency ?? BASE_CURRENCY;
  } catch {
    return BASE_CURRENCY;
  }
}

async function convertToAccountCurrency(
  amount: number,
  txCurrency: string,
  accountCurrency: string,
): Promise<number> {
  if (txCurrency === accountCurrency) return amount;
  const rate = await getRate(txCurrency, accountCurrency);
  return amount * rate;
}

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
    accountAmount:
      typeof t.accountAmount === "number" ? t.accountAmount : t.amount,
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
    const accountCurrency = readAccountCurrency(input.accountId);
    const accountAmount = await convertToAccountCurrency(
      input.amount,
      input.currency,
      accountCurrency,
    );
    const transaction: Transaction = {
      ...input,
      amountUSD: input.amount * rate,
      accountAmount,
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
        const accountCurrency = readAccountCurrency(input.accountId);
        const accountAmount = await convertToAccountCurrency(
          input.amount,
          input.currency,
          accountCurrency,
        );
        return {
          ...input,
          amountUSD: input.amount * rate,
          accountAmount,
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
    const toAmount =
      typeof input.toAmount === "number" && input.toAmount > 0
        ? input.toAmount
        : input.amount * conversionRate;
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
      ...(input.paymentForAccountId
        ? { paymentForAccountId: input.paymentForAccountId }
        : {}),
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
      ...(input.paymentForAccountId
        ? { paymentForAccountId: input.paymentForAccountId }
        : {}),
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
    const accountCurrency = readAccountCurrency(input.accountId);
    const accountAmount = await convertToAccountCurrency(
      input.amount,
      input.currency,
      accountCurrency,
    );
    const updated: Transaction = {
      ...existing,
      ...input,
      amountUSD,
      accountAmount,
    };
    write(items.map((t) => (t.id === id ? updated : t)));
    return updated;
  },
  async removeTransfer(transferId) {
    write(read().filter((t) => t.transferId !== transferId));
  },
};
