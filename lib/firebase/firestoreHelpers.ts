import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

export function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error("Not signed in. Firestore operations require an authenticated user.");
  }
  return uid;
}

export function userCollection(name: string): CollectionReference {
  return collection(db, "users", requireUid(), name);
}

export function userDoc(name: string, id: string): DocumentReference {
  return doc(db, "users", requireUid(), name, id);
}
