import { doc, getDoc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase/client";
import { defaultAccount, defaultCategories } from "@/lib/storage/seeds";

// Idempotent profile upsert. Runs on every sign-in so users created before the
// shared-accounts feature also get a profile doc on their next visit. The
// nickname field is preserved once written — only email/photoURL are refreshed
// from Firebase Auth on each call.
export async function upsertUserProfile(user: User): Promise<void> {
  const profileRef = doc(db, "users", user.uid);
  const existing = await getDoc(profileRef);
  const displayFallback = user.displayName || user.email || "You";
  if (!existing.exists()) {
    await setDoc(profileRef, {
      uid: user.uid,
      nickname: displayFallback,
      email: user.email ?? null,
      photoURL: user.photoURL ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }
  await setDoc(
    profileRef,
    {
      email: user.email ?? existing.data().email ?? null,
      photoURL: user.photoURL ?? existing.data().photoURL ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

// Seeds default accounts + categories on first sign-in only. Gated by the
// `meta/seed` marker so re-runs are cheap and idempotent. Kept separate from
// profile upsert so pre-existing users still get their profile created.
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
