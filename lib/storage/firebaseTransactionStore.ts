import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { userCollection, userDoc } from "@/lib/firebase/firestoreHelpers";
import { getRate } from "@/lib/services/exchangeRates";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
import type { NewTransaction, NewTransfer, Transaction } from "@/lib/types";
import type { TransactionStore } from "@/lib/storage/TransactionStore";

const COL = "transactions";
const ACCOUNTS_COL = "accounts";

function hydrate(id: string, data: Omit<Transaction, "id">): Transaction {
  const currency = data.currency ?? BASE_CURRENCY;
  const amountUSD =
    typeof data.amountUSD === "number" ? data.amountUSD : data.amount;
  const accountAmount =
    typeof data.accountAmount === "number" ? data.accountAmount : data.amount;
  return { ...data, id, currency, amountUSD, accountAmount };
}

async function fetchAccountCurrency(accountId: string): Promise<string> {
  const snap = await getDoc(userDoc(ACCOUNTS_COL, accountId));
  const data = snap.exists() ? (snap.data() as { currency?: string }) : null;
  return data?.currency ?? BASE_CURRENCY;
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

function stripUndefined<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) out[key] = value;
  }
  return out as T;
}

export const firebaseTransactionStore: TransactionStore = {
  async list() {
    const snap = await getDocs(query(userCollection(COL), orderBy("date", "desc")));
    return snap.docs.map((d) =>
      hydrate(d.id, d.data() as Omit<Transaction, "id">),
    );
  },
  async add(input: NewTransaction) {
    const createdAt = new Date().toISOString();
    const [rate, accountCurrency] = await Promise.all([
      getRate(input.currency, BASE_CURRENCY),
      fetchAccountCurrency(input.accountId),
    ]);
    const amountUSD = input.amount * rate;
    const accountAmount = await convertToAccountCurrency(
      input.amount,
      input.currency,
      accountCurrency,
    );
    const transaction = stripUndefined({
      ...input,
      amountUSD,
      accountAmount,
      createdAt,
    });
    const ref = await addDoc(userCollection(COL), transaction);
    return { id: ref.id, ...transaction } as Transaction;
  },
  async addMany(inputs: NewTransaction[]) {
    if (inputs.length === 0) return;
    const createdAt = new Date().toISOString();
    const priced = await Promise.all(
      inputs.map(async (input) => {
        const [rate, accountCurrency] = await Promise.all([
          getRate(input.currency, BASE_CURRENCY),
          fetchAccountCurrency(input.accountId),
        ]);
        const accountAmount = await convertToAccountCurrency(
          input.amount,
          input.currency,
          accountCurrency,
        );
        return stripUndefined({
          ...input,
          amountUSD: input.amount * rate,
          accountAmount,
          createdAt,
        });
      }),
    );
    const col = userCollection(COL);
    const batch = writeBatch(db);
    for (const payload of priced) {
      batch.set(doc(col), payload);
    }
    await batch.commit();
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

    const col = userCollection(COL);
    const outRef = doc(col);
    const inRef = doc(col);
    const transferId = outRef.id;

    const shared = stripUndefined({
      type: "transfer" as const,
      categoryId: "",
      description: input.description,
      date: input.date,
      createdAt,
      amountUSD,
      transferId,
      paymentForAccountId: input.paymentForAccountId,
    });

    const outDoc = {
      ...shared,
      amount: input.amount,
      currency: input.fromCurrency,
      accountId: input.fromAccountId,
      linkedAccountId: input.toAccountId,
      transferDirection: "out" as const,
    };
    const inDoc = {
      ...shared,
      amount: toAmount,
      currency: input.toCurrency,
      accountId: input.toAccountId,
      linkedAccountId: input.fromAccountId,
      transferDirection: "in" as const,
    };

    const batch = writeBatch(db);
    batch.set(outRef, outDoc);
    batch.set(inRef, inDoc);
    await batch.commit();
  },
  async remove(id) {
    await deleteDoc(userDoc(COL, id));
  },
  async update(id, input) {
    const [rate, accountCurrency] = await Promise.all([
      getRate(input.currency, BASE_CURRENCY),
      fetchAccountCurrency(input.accountId),
    ]);
    const amountUSD = input.amount * rate;
    const accountAmount = await convertToAccountCurrency(
      input.amount,
      input.currency,
      accountCurrency,
    );
    const payload = stripUndefined({ ...input, amountUSD, accountAmount });
    const ref = userDoc(COL, id);
    await updateDoc(ref, payload);
    const snap = await getDoc(ref);
    return hydrate(id, snap.data() as Omit<Transaction, "id">);
  },
  async removeTransfer(transferId) {
    const snap = await getDocs(
      query(userCollection(COL), where("transferId", "==", transferId)),
    );
    if (snap.empty) return;
    const batch = writeBatch(db);
    for (const d of snap.docs) batch.delete(d.ref);
    await batch.commit();
  },
};
