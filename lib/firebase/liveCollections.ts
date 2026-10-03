import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { emitDataChanged } from "@/lib/events/dataChanged";

// ---------------------------------------------------------------------------
// One live listener per (owner, collection), shared by every list() call.
//
// Before this, each hook re-ran getDocs on mount and on every data-change
// tick, so a page view read a user's whole history several times over, and
// every read was billed. A listener is billed for the full collection once,
// then only for documents that change. With the persistent cache, reopening
// the app within 30 minutes resumes the listener and is billed only for
// changes since.
//
// Reads keep the same contract as readDocs: wait for the server while online
// (so a cold cache never looks like "no data"), fall back to the cache when
// offline or when the server is slow.
// ---------------------------------------------------------------------------

const SERVER_WAIT_MS = 4000;
// After a write, how long a read waits for the listener to show it. Local
// writes reach listeners within a few milliseconds; collections the write
// didn't touch just wait this out once.
const WRITE_ECHO_WAIT_MS = 120;
const CHANGE_DEBOUNCE_MS = 60;

interface Entry {
  docs: QueryDocumentSnapshot[];
  ready: Promise<void>;
  unsubscribe: () => void;
  // Value of `writeSeq` when this entry last received a snapshot.
  seenWriteSeq: number;
  // Resolvers waiting for the next snapshot.
  waiters: (() => void)[];
}

const entries = new Map<string, Entry>();
let writeSeq = 0;
let currentUid: string | null | undefined;
let changeTimer: ReturnType<typeof setTimeout> | null = null;

const isOffline = () =>
  typeof navigator !== "undefined" && navigator.onLine === false;

/** Called by commitWrite so the next read waits for the write to show up. */
export function noteLocalWrite(): void {
  writeSeq += 1;
}

function notifyChanged(): void {
  if (changeTimer) clearTimeout(changeTimer);
  changeTimer = setTimeout(() => {
    changeTimer = null;
    emitDataChanged();
  }, CHANGE_DEBOUNCE_MS);
}

function detach(key: string): void {
  const entry = entries.get(key);
  if (!entry) return;
  entry.unsubscribe();
  for (const wake of entry.waiters) wake();
  entries.delete(key);
}

/** Stop every listener (sign-out, account switch). */
export function detachAllLiveCollections(): void {
  for (const key of [...entries.keys()]) detach(key);
}

/** Drop listeners for owners the user can no longer read (revoked connections). */
export function retainLiveOwners(ownerUids: string[]): void {
  const keep = new Set(ownerUids);
  for (const key of [...entries.keys()]) {
    if (!keep.has(key.split("/")[0])) detach(key);
  }
}

if (typeof window !== "undefined") {
  onAuthStateChanged(auth, (user) => {
    const uid = user?.uid ?? null;
    if (currentUid !== undefined && uid !== currentUid) detachAllLiveCollections();
    currentUid = uid;
  });
}

function start(ownerUid: string, name: string): Entry {
  const key = `${ownerUid}/${name}`;
  let settled = false;
  let resolveReady!: () => void;
  let rejectReady!: (err: unknown) => void;
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });
  // Avoid unhandled-rejection noise; callers await `ready` and see the error.
  ready.catch(() => {});

  const entry: Entry = {
    docs: [],
    ready,
    unsubscribe: () => {},
    seenWriteSeq: writeSeq,
    waiters: [],
  };
  const settle = () => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    resolveReady();
  };
  // Server slow or unreachable: answer from whatever the cache had.
  const timer = setTimeout(settle, SERVER_WAIT_MS);

  entry.unsubscribe = onSnapshot(
    collection(db, "users", ownerUid, name),
    { includeMetadataChanges: true },
    (snap) => {
      entry.docs = snap.docs;
      entry.seenWriteSeq = writeSeq;
      const waiters = entry.waiters;
      entry.waiters = [];
      for (const wake of waiters) wake();

      if (!settled) {
        if (!snap.metadata.fromCache || isOffline()) settle();
        return;
      }
      // Metadata-only events (synced, pending writes acked) change nothing.
      if (snap.docChanges().length > 0) notifyChanged();
    },
    (err) => {
      entries.delete(key);
      for (const wake of entry.waiters) wake();
      entry.waiters = [];
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        rejectReady(err);
      }
    },
  );
  entries.set(key, entry);
  return entry;
}

/**
 * Every document in users/{ownerUid}/{name}, kept current by a shared live
 * listener. Includes soft-deleted docs; callers filter.
 */
export async function getLiveDocs(
  ownerUid: string,
  name: string,
): Promise<QueryDocumentSnapshot[]> {
  const key = `${ownerUid}/${name}`;
  const entry = entries.get(key) ?? start(ownerUid, name);
  await entry.ready;

  if (entry.seenWriteSeq < writeSeq && entries.get(key) === entry) {
    // A write happened since the last snapshot. If it touched this
    // collection, the listener reports it in a moment; wait for that so
    // callers that write then list see their own change.
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, WRITE_ECHO_WAIT_MS);
      entry.waiters.push(() => {
        clearTimeout(timer);
        resolve();
      });
    });
    entry.seenWriteSeq = Math.max(entry.seenWriteSeq, writeSeq);
  }
  return entry.docs;
}
