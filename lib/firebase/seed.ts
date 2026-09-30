import { doc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase/client";
import { commitWrite, readDoc } from "@/lib/firebase/firestoreHelpers";
import { defaultCategories } from "@/lib/storage/seeds";

// Idempotent profile upsert. Runs on every sign-in so users created before the
// shared-accounts feature also get a profile doc on their next visit. The
// nickname field is preserved once written — only email/photoURL are refreshed
// from Firebase Auth on each call. `preferences` is seeded on first create and
// never overwritten on subsequent merges so user choices persist.
export async function upsertUserProfile(user: User): Promise<void> {
  const profileRef = doc(db, "users", user.uid);
  const existing = await readDoc(profileRef);
  const displayFallback = user.displayName || user.email || "You";
  if (!existing.exists()) {
    // A cache miss (e.g. a new device opened offline) says nothing about the
    // server. Creating the profile then would overwrite the real nickname and
    // preferences, so only create it when the server confirms it's missing.
    if (existing.metadata.fromCache) return;
    await commitWrite(setDoc(profileRef, {
      uid: user.uid,
      nickname: displayFallback,
      email: user.email ?? null,
      photoURL: user.photoURL ?? null,
      preferences: { displayCurrency: "USD" },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    return;
  }
  await commitWrite(setDoc(
    profileRef,
    {
      email: user.email ?? existing.data().email ?? null,
      photoURL: user.photoURL ?? existing.data().photoURL ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  ));
}

export async function updateDisplayCurrency(
  uid: string,
  currency: string,
): Promise<void> {
  await commitWrite(setDoc(
    doc(db, "users", uid),
    {
      preferences: { displayCurrency: currency },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  ));
}

export type OnboardingState = "pending" | "done";

// Seeds default categories on first sign-in only, and marks the user as
// needing onboarding (where they create their own accounts; there's no
// default cash account any more). Gated by the `meta/seed` marker so re-runs
// are cheap and idempotent. Users seeded before onboarding existed have a
// marker without `onboarding`, which reads as "done": they never see it.
export async function ensureUserSeed(uid: string): Promise<OnboardingState> {
  const marker = doc(db, "users", uid, "meta", "seed");
  const existing = await readDoc(marker);
  if (existing.exists()) {
    return existing.data().onboarding === "pending" ? "pending" : "done";
  }
  // Same guard as the profile: never seed on a cache miss, or an existing
  // user on a fresh offline device would be treated as brand new.
  if (existing.metadata.fromCache) return "done";

  const batch = writeBatch(db);

  for (const category of defaultCategories()) {
    const { id: categoryId, ...categoryData } = category;
    batch.set(doc(db, "users", uid, "categories", categoryId), categoryData);
  }

  batch.set(marker, { seededAt: serverTimestamp(), onboarding: "pending" });

  await commitWrite(batch.commit());
  return "pending";
}

export async function completeOnboarding(uid: string): Promise<void> {
  await commitWrite(
    setDoc(
      doc(db, "users", uid, "meta", "seed"),
      { onboarding: "done", onboardedAt: serverTimestamp() },
      { merge: true },
    ),
  );
}

export async function updateLanguage(uid: string, language: string): Promise<void> {
  await commitWrite(
    setDoc(
      doc(db, "users", uid),
      { preferences: { language }, updatedAt: serverTimestamp() },
      { merge: true },
    ),
  );
}
