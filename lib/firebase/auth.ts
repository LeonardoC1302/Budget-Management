import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth, googleProvider, usingEmulator } from "@/lib/firebase/client";

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

// Two local-only accounts so shared-account flows (Connections) can be tested
// between them. They exist only inside the Auth emulator.
export const TESTERS = {
  a: { email: "tester-a@perch.test", name: "Tester A" },
  b: { email: "tester-b@perch.test", name: "Tester B" },
} as const;

export type TesterId = keyof typeof TESTERS;

const TESTER_PASSWORD = "perch-emulator-only";

export async function signInAsTester(id: TesterId): Promise<User> {
  if (!usingEmulator) {
    throw new Error("Tester sign-in only works against the local emulator.");
  }
  const { email, name } = TESTERS[id];
  try {
    const result = await signInWithEmailAndPassword(auth, email, TESTER_PASSWORD);
    return result.user;
  } catch (err) {
    const code = err instanceof FirebaseError ? err.code : "";
    if (code !== "auth/user-not-found" && code !== "auth/invalid-credential") {
      throw err;
    }
  }
  // First run against a fresh emulator: create the tester on the fly.
  const result = await createUserWithEmailAndPassword(auth, email, TESTER_PASSWORD);
  await updateProfile(result.user, { displayName: name });
  return result.user;
}
