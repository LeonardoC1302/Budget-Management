import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  type User,
} from "firebase/auth";
import {
  clearIndexedDbPersistence,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  terminate,
  where,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";
import { TESTER_PASSWORD } from "@/lib/firebase/auth";
import { auth, db, googleProvider, usingEmulator } from "@/lib/firebase/client";
import { CONNECTION_CODES_COL, CONNECTIONS_COL } from "@/lib/firebase/connections";
import { removeLock } from "@/lib/lock/appLock";

// Every collection PerchCR writes under users/{uid}. Keep in sync with the
// stores in lib/storage and lib/firebase (seed marker lives in "meta").
const USER_COLLECTIONS = [
  "accounts",
  "transactions",
  "budgets",
  "categories",
  "goals",
  "goalContributions",
  "holdings",
  "holdingValuations",
  "recurringTransactions",
  "trash",
  "meta",
];

const BATCH_LIMIT = 450;

export type DeleteStep = "verifying" | "data" | "connections" | "account" | "done";

async function deleteRefs(refs: DocumentReference[]): Promise<void> {
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const ref of refs.slice(i, i + BATCH_LIMIT)) batch.delete(ref);
    // Awaited on purpose: deletion must reach the server, not just the cache.
    await batch.commit();
  }
}

/** Firebase requires a recent sign-in before deleting an account. */
async function reauthenticate(user: User): Promise<void> {
  const password = user.providerData.some((p) => p.providerId === "password");
  if (usingEmulator && password && user.email) {
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, TESTER_PASSWORD),
    );
    return;
  }
  await reauthenticateWithPopup(user, googleProvider);
}

/**
 * Permanently deletes the signed-in user's data and account:
 * everything under users/{uid}, their connection records and pending codes,
 * the profile doc, this device's lock and offline cache, then the Firebase
 * Auth user. Entries they added to someone else's shared budget stay there;
 * they belong to that budget.
 *
 * Must run online: offline deletes would only hit the local cache.
 */
export async function deleteAccountAndData(
  onStep: (step: DeleteStep) => void = () => {},
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("offline");
  }
  const uid = user.uid;

  onStep("verifying");
  await reauthenticate(user);

  onStep("data");
  for (const name of USER_COLLECTIONS) {
    const snap = await getDocs(collection(db, "users", uid, name));
    await deleteRefs(snap.docs.map((d) => d.ref));
  }

  onStep("connections");
  const [asOwner, asGuest, codes] = await Promise.all([
    getDocs(query(collection(db, CONNECTIONS_COL), where("ownerUid", "==", uid))),
    getDocs(query(collection(db, CONNECTIONS_COL), where("guestUid", "==", uid))),
    getDocs(query(collection(db, CONNECTION_CODES_COL), where("ownerUid", "==", uid))),
  ]);
  await deleteRefs([...asOwner.docs, ...asGuest.docs, ...codes.docs].map((d) => d.ref));
  await deleteDoc(doc(db, "users", uid));

  onStep("account");
  removeLock(uid);
  await user.delete();

  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
  } catch {
    // Other tabs may hold the cache open; it's cleared on their next sign-out.
  }
  onStep("done");
}
