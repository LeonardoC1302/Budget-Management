import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { defaultAccount, defaultCategories } from "@/lib/storage/seeds";

export async function ensureUserSeed(uid: string): Promise<void> {
  const marker = doc(db, "users", uid, "meta", "seed");
  const existing = await getDoc(marker);
  if (existing.exists()) return;

  const batch = writeBatch(db);

  const account = defaultAccount();
  const { id: accountId, ...accountData } = account;
  batch.set(doc(db, "users", uid, "accounts", accountId), accountData);

  for (const category of defaultCategories()) {
    const { id: categoryId, ...categoryData } = category;
    batch.set(doc(db, "users", uid, "categories", categoryId), categoryData);
  }

  batch.set(marker, { seededAt: serverTimestamp() });

  await batch.commit();
}
