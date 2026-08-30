import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { OwnerPermission } from "@/lib/types";

// Codes are 6 uppercase alphanumerics from a curated alphabet without visually
// ambiguous characters (no O/0, no I/1/L). Users read these to each other, so
// legibility beats a slightly larger keyspace.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LEN = 6;
const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_COLLISION_RETRIES = 5;

export interface ConnectionCodeDoc {
  code: string;
  ownerUid: string;
  ownerNickname: string;
  permission: Exclude<OwnerPermission, "owner">;
  expiresAt: string;
  status: "pending" | "claimed";
  claimedBy?: string;
  claimedAt?: string;
  createdAt: string;
}

export interface ConnectionDoc {
  id: string;
  ownerUid: string;
  guestUid: string;
  permission: Exclude<OwnerPermission, "owner">;
  ownerNickname: string;
  guestNickname: string;
  createdAt: string;
  revokedAt?: string | null;
}

export const CONNECTIONS_COL = "connections";
export const CONNECTION_CODES_COL = "connectionCodes";

export function connectionId(ownerUid: string, guestUid: string): string {
  return `${ownerUid}_${guestUid}`;
}

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in.");
  return uid;
}

function randomCode(): string {
  const buf =
    typeof crypto !== "undefined" && "getRandomValues" in crypto
      ? crypto.getRandomValues(new Uint32Array(CODE_LEN))
      : null;
  let out = "";
  for (let i = 0; i < CODE_LEN; i++) {
    const n = buf ? buf[i] : Math.floor(Math.random() * 0xffffffff);
    out += CODE_ALPHABET[n % CODE_ALPHABET.length];
  }
  return out;
}

// Mints a code good for CODE_TTL_MS. Permission is always "write" — the
// feature is intended for people managing money together, not spectators.
// The field is kept in the schema for schema compatibility (older grants
// may carry "read") but new codes never issue read-only grants.
export async function generateConnectionCode(
  ownerNickname: string,
): Promise<ConnectionCodeDoc> {
  const permission: "write" = "write";
  const ownerUid = requireUid();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CODE_TTL_MS).toISOString();
  const createdAt = now.toISOString();

  for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
    const code = randomCode();
    const ref = doc(db, CONNECTION_CODES_COL, code);
    // A get+set-only-if-missing loop. If two owners collide on the same code
    // (astronomically unlikely with 30^6 ≈ 730M keyspace), we retry.
    try {
      await runTransaction(db, async (txn) => {
        const existing = await txn.get(ref);
        if (existing.exists()) throw new Error("CODE_COLLISION");
        txn.set(ref, {
          ownerUid,
          ownerNickname,
          permission,
          expiresAt,
          status: "pending",
          createdAt,
        });
      });
      return {
        code,
        ownerUid,
        ownerNickname,
        permission,
        expiresAt,
        status: "pending",
        createdAt,
      };
    } catch (err) {
      if (
        err instanceof Error &&
        err.message === "CODE_COLLISION" &&
        attempt < MAX_COLLISION_RETRIES - 1
      ) {
        continue;
      }
      throw err;
    }
  }
  throw new Error("Could not generate a unique code. Please try again.");
}

// Owner-initiated cancel of an unclaimed code.
export async function cancelConnectionCode(code: string): Promise<void> {
  const ref = doc(db, CONNECTION_CODES_COL, code);
  await deleteDoc(ref);
}

// Guest reads the code, snapshots both nicknames, writes BOTH direction docs
// (owner→guest and guest→owner) in one transaction so the connection is
// bidirectional: both parties see and edit each other's data. Enforces
// expiry, no-self-share, and single-use.
export async function claimConnectionCode(
  code: string,
  guestNickname: string,
): Promise<ConnectionDoc> {
  const guestUid = requireUid();
  const codeRef = doc(db, CONNECTION_CODES_COL, code);

  return runTransaction(db, async (txn) => {
    const snap = await txn.get(codeRef);
    if (!snap.exists()) throw new Error("Code not found or already used.");
    const data = snap.data() as ConnectionCodeDoc;

    if (data.status !== "pending") {
      throw new Error("This code has already been used.");
    }
    if (new Date(data.expiresAt).getTime() < Date.now()) {
      throw new Error("This code has expired. Ask for a fresh one.");
    }
    if (data.ownerUid === guestUid) {
      throw new Error("You can't accept your own connection code.");
    }

    const forwardId = connectionId(data.ownerUid, guestUid);
    const mirrorId = connectionId(guestUid, data.ownerUid);
    const forwardRef = doc(db, CONNECTIONS_COL, forwardId);
    const mirrorRef = doc(db, CONNECTIONS_COL, mirrorId);
    const createdAt = new Date().toISOString();

    const forwardDoc = {
      ownerUid: data.ownerUid,
      guestUid,
      permission: data.permission,
      ownerNickname: data.ownerNickname,
      guestNickname,
      createdAt,
      revokedAt: null,
      sourceCode: code,
    };
    // Mirror doc: same relationship viewed from the opposite side. `ownerUid`
    // is always "the person granting access" from that doc's point of view.
    const mirrorDoc = {
      ownerUid: guestUid,
      guestUid: data.ownerUid,
      permission: data.permission,
      ownerNickname: guestNickname,
      guestNickname: data.ownerNickname,
      createdAt,
      revokedAt: null,
      sourceCode: code,
      mirrored: true,
    };

    txn.set(forwardRef, forwardDoc);
    txn.set(mirrorRef, mirrorDoc);
    txn.update(codeRef, {
      status: "claimed",
      claimedBy: guestUid,
      claimedAt: createdAt,
    });

    return {
      id: forwardId,
      ownerUid: data.ownerUid,
      guestUid,
      permission: data.permission,
      ownerNickname: data.ownerNickname,
      guestNickname,
      createdAt,
      revokedAt: null,
    };
  });
}

// Deletes both direction docs so revoke is symmetric — either party can end
// the connection and both sides lose access at once.
export async function revokeConnection(
  ownerUid: string,
  guestUid: string,
): Promise<void> {
  const forwardRef = doc(db, CONNECTIONS_COL, connectionId(ownerUid, guestUid));
  const mirrorRef = doc(db, CONNECTIONS_COL, connectionId(guestUid, ownerUid));
  await Promise.all([
    deleteDoc(forwardRef).catch(() => {}),
    deleteDoc(mirrorRef).catch(() => {}),
  ]);
}

// Either party can rename how the other appears in their UI. Owner writes
// `guestNickname`, guest writes `ownerNickname`.
export async function renameConnection(
  ownerUid: string,
  guestUid: string,
  side: "owner" | "guest",
  nextName: string,
): Promise<void> {
  const ref = doc(db, CONNECTIONS_COL, connectionId(ownerUid, guestUid));
  const patch =
    side === "owner"
      ? { ownerNickname: nextName }
      : { guestNickname: nextName };
  await updateDoc(ref, patch);
}

// Live-subscribe to all connections where I am the guest. Used by
// `AccessContext` to keep the module cache in sync. Errors (typically
// permission-denied when `firestore.rules` hasn't been deployed yet) are
// swallowed with a warning so the rest of the app still works for a user
// who has zero connections.
export function subscribeMyGrants(
  guestUid: string,
  onChange: (docs: ConnectionDoc[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, CONNECTIONS_COL),
    where("guestUid", "==", guestUid),
  );
  return onSnapshot(
    q,
    (snap) => {
      const docs: ConnectionDoc[] = [];
      for (const d of snap.docs) {
        const data = d.data() as ConnectionDoc;
        if (data.revokedAt) continue;
        docs.push({ ...data, id: d.id });
      }
      onChange(docs);
    },
    (err) => {
      console.warn("subscribeMyGrants: listener error", err);
      onChange([]);
    },
  );
}

export function subscribeMyGrantsGiven(
  ownerUid: string,
  onChange: (docs: ConnectionDoc[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, CONNECTIONS_COL),
    where("ownerUid", "==", ownerUid),
  );
  return onSnapshot(
    q,
    (snap) => {
      const docs: ConnectionDoc[] = [];
      for (const d of snap.docs) {
        const data = d.data() as ConnectionDoc;
        if (data.revokedAt) continue;
        docs.push({ ...data, id: d.id });
      }
      onChange(docs);
    },
    (err) => {
      console.warn("subscribeMyGrantsGiven: listener error", err);
      onChange([]);
    },
  );
}

export function subscribeMyPendingCodes(
  ownerUid: string,
  onChange: (codes: ConnectionCodeDoc[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, CONNECTION_CODES_COL),
    where("ownerUid", "==", ownerUid),
    where("status", "==", "pending"),
  );
  return onSnapshot(
    q,
    (snap) => {
      const codes: ConnectionCodeDoc[] = [];
      for (const d of snap.docs) {
        codes.push({ ...(d.data() as ConnectionCodeDoc), code: d.id });
      }
      onChange(codes);
    },
    (err) => {
      console.warn("subscribeMyPendingCodes: listener error", err);
      onChange([]);
    },
  );
}

// Reads the owner profile doc for a given uid. Falls back to a placeholder if
// missing (should be rare — every user gets one on sign-in).
export async function readNickname(uid: string): Promise<string> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return "Someone";
  const data = snap.data() as { nickname?: string };
  return data.nickname || "Someone";
}
