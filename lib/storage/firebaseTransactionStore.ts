import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  listAcrossOwners,
  ownerCollection,
  ownerDoc,
} from "@/lib/firebase/firestoreHelpers";
import {
  requireWriteUid,
  findOwnerCtx,
  getAccessibleContexts,
} from "@/lib/firebase/access";
import {
  amountInUsd,
  convertUsingRateSource,
} from "@/lib/services/exchangeRates";
import { BASE_CURRENCY } from "@/lib/utils/currencies";
import type {
  NewTransaction,
  NewTransfer,
  OwnerCtx,
  Transaction,
} from "@/lib/types";
import type { TransactionStore } from "@/lib/storage/TransactionStore";

const COL = "transactions";
const ACCOUNTS_COL = "accounts";

function hydrate(
  id: string,
  data: Omit<Transaction, "id">,
  owner: OwnerCtx,
): Transaction {
  const currency = data.currency ?? BASE_CURRENCY;
  const amountUSD =
    typeof data.amountUSD === "number" ? data.amountUSD : data.amount;
  const accountAmount =
    typeof data.accountAmount === "number" ? data.accountAmount : data.amount;
  return { ...data, id, currency, amountUSD, accountAmount, _owner: owner };
}

async function fetchAccountCurrency(
  writerUid: string,
  accountId: string,
): Promise<string> {
  // Try the writer first (self-owned accounts are the common case), then any
  // accessible grantor. Shared accounts live in the owner's subtree, so the
  // writer's own path misses and would otherwise fall back to USD — corrupting
  // `accountAmount` for cross-owner writes.
  const seen = new Set<string>();
  const order = [writerUid, ...getAccessibleContexts().map((c) => c.uid)];
  for (const uid of order) {
    if (!uid || seen.has(uid)) continue;
    seen.add(uid);
    try {
      const snap = await getDoc(ownerDoc(uid, ACCOUNTS_COL, accountId));
      if (snap.exists()) {
        const data = snap.data() as { currency?: string };
        return data.currency ?? BASE_CURRENCY;
      }
    } catch {
      // Revoked grants throw permission-denied; keep searching other owners.
    }
  }
  return BASE_CURRENCY;
}

function stripUndefined<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) out[key] = value;
  }
  return out as T;
}

function ownerCtxFor(uid: string): OwnerCtx {
  return findOwnerCtx(uid) ?? { uid, nickname: "You", permission: "owner" };
}

export const firebaseTransactionStore: TransactionStore = {
  async list() {
    return listAcrossOwners<Transaction>(
      COL,
      (id, data, owner) => hydrate(id, data as Omit<Transaction, "id">, owner),
      (col) => query(col, orderBy("date", "desc")),
    );
  },
  async add(input: NewTransaction, ownerUid?: string) {
    const uid = requireWriteUid(ownerUid);
    const createdAt = new Date().toISOString();
    const accountCurrency = await fetchAccountCurrency(uid, input.accountId);
    const [amountUSD, accountAmount] = await Promise.all([
      amountInUsd(input.amount, input.currency, input.rateSource),
      convertUsingRateSource(
        input.amount,
        input.currency,
        accountCurrency,
        input.rateSource,
      ),
    ]);
    const transaction = stripUndefined({
      ...input,
      amountUSD,
      accountAmount,
      createdAt,
    });
    const ref = await addDoc(ownerCollection(uid, COL), transaction);
    return {
      id: ref.id,
      ...transaction,
      _owner: ownerCtxFor(uid),
    } as Transaction;
  },
  async addMany(inputs: NewTransaction[], ownerUid?: string) {
    if (inputs.length === 0) return;
    const uid = requireWriteUid(ownerUid);
    const createdAt = new Date().toISOString();
    const priced = await Promise.all(
      inputs.map(async (input) => {
        const accountCurrency = await fetchAccountCurrency(uid, input.accountId);
        const [amountUSD, accountAmount] = await Promise.all([
          amountInUsd(input.amount, input.currency, input.rateSource),
          convertUsingRateSource(
            input.amount,
            input.currency,
            accountCurrency,
            input.rateSource,
          ),
        ]);
        return stripUndefined({
          ...input,
          amountUSD,
          accountAmount,
          createdAt,
        });
      }),
    );
    const col = ownerCollection(uid, COL);
    const batch = writeBatch(db);
    for (const payload of priced) {
      batch.set(doc(col), payload);
    }
    await batch.commit();
  },
  async addTransfer(input: NewTransfer, ownerUid?: string) {
    const uid = requireWriteUid(ownerUid);
    const createdAt = new Date().toISOString();
    const sameCurrency = input.fromCurrency === input.toCurrency;
    const hasFee =
      sameCurrency && typeof input.fee === "number" && input.fee > 0;
    const toAmount = hasFee
      ? input.amount - (input.fee as number)
      : typeof input.toAmount === "number" && input.toAmount > 0
        ? input.toAmount
        : await convertUsingRateSource(
            input.amount,
            input.fromCurrency,
            input.toCurrency,
            input.rateSource,
          );
    const amountUSD = await amountInUsd(
      input.amount,
      input.fromCurrency,
      input.rateSource,
    );

    const col = ownerCollection(uid, COL);
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
      paidChargeIds:
        input.paidChargeIds && input.paidChargeIds.length > 0
          ? input.paidChargeIds
          : undefined,
      rateSource: input.rateSource,
      fee: hasFee ? input.fee : undefined,
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
  async remove(id, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    await deleteDoc(ownerDoc(uid, COL, id));
  },
  async update(id, input, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const accountCurrency = await fetchAccountCurrency(uid, input.accountId);
    const [amountUSD, accountAmount] = await Promise.all([
      amountInUsd(input.amount, input.currency, input.rateSource),
      convertUsingRateSource(
        input.amount,
        input.currency,
        accountCurrency,
        input.rateSource,
      ),
    ]);
    const payload = stripUndefined({ ...input, amountUSD, accountAmount });
    // `_owner` is a read-time decoration and must never be persisted.
    delete (payload as { _owner?: unknown })._owner;
    const ref = ownerDoc(uid, COL, id);
    await updateDoc(ref, payload);
    const snap = await getDoc(ref);
    return hydrate(id, snap.data() as Omit<Transaction, "id">, ownerCtxFor(uid));
  },
  async removeTransfer(transferId, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const snap = await getDocs(
      query(
        ownerCollection(uid, COL),
        where("transferId", "==", transferId),
      ),
    );
    if (snap.empty) return;
    const batch = writeBatch(db);
    for (const d of snap.docs) batch.delete(d.ref);
    await batch.commit();
  },
};
