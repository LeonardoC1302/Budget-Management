import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { userCollection, userDoc } from "@/lib/firebase/firestoreHelpers";
import { getRate } from "@/lib/services/exchangeRates";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
import type { Account, NewAccount } from "@/lib/types";
import type { AccountStore } from "@/lib/storage/AccountStore";

const COL = "accounts";

function hydrate(id: string, data: Omit<Account, "id">): Account {
  const currency = data.currency ?? BASE_CURRENCY;
  const initialBalanceUSD =
    typeof data.initialBalanceUSD === "number"
      ? data.initialBalanceUSD
      : data.initialBalance;
  return { ...data, id, currency, initialBalanceUSD };
}

export const firebaseAccountStore: AccountStore = {
  async list() {
    const snap = await getDocs(query(userCollection(COL), orderBy("createdAt")));
    return snap.docs.map((d) => hydrate(d.id, d.data() as Omit<Account, "id">));
  },
  async add(input: NewAccount) {
    const createdAt = new Date().toISOString();
    const rate = await getRate(input.currency, BASE_CURRENCY);
    const initialBalanceUSD = input.initialBalance * rate;
    const account = { ...input, initialBalanceUSD, createdAt };
    const ref = await addDoc(userCollection(COL), account);
    return { id: ref.id, ...account };
  },
  async update(id, patch) {
    const ref = userDoc(COL, id);
    const nextPatch: Partial<Account> = { ...patch };

    if (patch.currency !== undefined || patch.initialBalance !== undefined) {
      const existing = await getDoc(ref);
      if (!existing.exists()) throw new Error(`Account ${id} not found`);
      const current = existing.data() as Omit<Account, "id">;
      const currency = patch.currency ?? current.currency ?? BASE_CURRENCY;
      const initialBalance =
        patch.initialBalance ?? current.initialBalance ?? 0;
      const rate = await getRate(currency, BASE_CURRENCY);
      nextPatch.initialBalanceUSD = initialBalance * rate;
    }

    await updateDoc(ref, nextPatch);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error(`Account ${id} not found`);
    return hydrate(snap.id, snap.data() as Omit<Account, "id">);
  },
  async remove(id) {
    await deleteDoc(userDoc(COL, id));
  },
};
