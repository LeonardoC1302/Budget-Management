import {
  doc,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  commitWrite,
  isSoftDeleted,
  listAcrossOwners,
  ownerCollection,
  ownerDoc,
  readAfterWrite,
  readDoc,
  readDocs,
} from "@/lib/firebase/firestoreHelpers";
import { softDelete } from "@/lib/firebase/trash";
import {
  requireWriteUid,
  findOwnerCtx,
  getAccessibleContexts,
  canWriteTo,
} from "@/lib/firebase/access";
import {
  amountInAccountCurrency,
  amountInUsd,
  convertUsingRateSource,
  transferAmountInUsd,
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
      const snap = await readDoc(ownerDoc(uid, ACCOUNTS_COL, accountId));
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
    const ref = doc(ownerCollection(uid, COL));
    await commitWrite(setDoc(ref, transaction));
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
    await commitWrite(batch.commit());
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
    const amountUSD = await transferAmountInUsd(
      input.amount,
      input.fromCurrency,
      toAmount,
      input.toCurrency,
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
    await commitWrite(batch.commit());
  },
  async remove(id, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const snap = await readDoc(ownerDoc(uid, COL, id));
    const data = snap.data() as Partial<Transaction> | undefined;
    return softDelete(uid, {
      kind: "transaction",
      label: data?.description || "Transaction",
      refs: [{ col: COL, id }],
      amount: data?.amount,
      currency: data?.currency,
    });
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
    await commitWrite(updateDoc(ref, payload));
    const snap = await readAfterWrite(ref);
    return hydrate(id, snap.data() as Omit<Transaction, "id">, ownerCtxFor(uid));
  },
  async removeTransfer(transferId, ownerUid) {
    const uid = requireWriteUid(ownerUid);
    const snap = await readDocs(
      query(
        ownerCollection(uid, COL),
        where("transferId", "==", transferId),
      ),
    );
    const legs = snap.docs.filter((d) => !isSoftDeleted(d.data()));
    if (legs.length === 0) return;
    const out = (legs.find((d) => d.data().transferDirection === "out") ??
      legs[0]).data() as Partial<Transaction>;
    return softDelete(uid, {
      kind: "transfer",
      label: out.description || "Transfer",
      refs: legs.map((d) => ({ col: COL, id: d.id })),
      amount: out.amount,
      currency: out.currency,
    });
  },
  async rebaseAccountCurrency(accountId, currency) {
    // Transactions on a shared account can live in any writer's subtree, so
    // scan everything the user can see and update the copies they can write.
    const all = await firebaseTransactionStore.list();
    const legsByTransfer = new Map<string, Transaction[]>();
    for (const t of all) {
      if (!t.transferId) continue;
      const legs = legsByTransfer.get(t.transferId) ?? [];
      legs.push(t);
      legsByTransfer.set(t.transferId, legs);
    }

    const targets = all.filter(
      (t) => t.accountId === accountId && t._owner && canWriteTo(t._owner.uid),
    );
    const updates = await Promise.all(
      targets.map(async (t) => {
        const paired = t.transferId
          ? legsByTransfer.get(t.transferId)?.find((l) => l.id !== t.id)
          : undefined;
        const accountAmount = await amountInAccountCurrency(t, currency, paired);
        return { uid: t._owner!.uid, id: t.id, accountAmount };
      }),
    );

    // Firestore caps a batch at 500 writes.
    for (let i = 0; i < updates.length; i += 450) {
      const batch = writeBatch(db);
      for (const u of updates.slice(i, i + 450)) {
        batch.update(ownerDoc(u.uid, COL, u.id), {
          accountAmount: u.accountAmount,
        });
      }
      await commitWrite(batch.commit());
    }
  },
};
