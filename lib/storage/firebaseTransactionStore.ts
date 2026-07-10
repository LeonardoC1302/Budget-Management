import { addDoc, deleteDoc, getDocs, orderBy, query } from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firebase/firestoreHelpers";
import { getRate } from "@/lib/services/exchangeRates";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
import type { NewTransaction, Transaction } from "@/lib/types";
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
  async remove(id) {
    await deleteDoc(userDoc(COL, id));
  },
};
