import {
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
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

function hydrate(id: string, data: Omit<Transaction, "id">): Transaction {
  const currency = data.currency ?? BASE_CURRENCY;
  const amountUSD =
    typeof data.amountUSD === "number" ? data.amountUSD : data.amount;
  return { ...data, id, currency, amountUSD };
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
    const rate = await getRate(input.currency, BASE_CURRENCY);
    const amountUSD = input.amount * rate;
    const transaction = { ...input, amountUSD, createdAt };
    const ref = await addDoc(userCollection(COL), transaction);
    return { id: ref.id, ...transaction };
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

    const col = userCollection(COL);
    const outRef = doc(col);
    const inRef = doc(col);
    const transferId = outRef.id;

    const shared = {
      type: "transfer" as const,
      categoryId: "",
      description: input.description,
      date: input.date,
      createdAt,
      amountUSD,
      transferId,
    };

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
