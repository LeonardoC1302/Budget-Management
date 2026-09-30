"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  disableNetwork,
  enableNetwork,
  waitForPendingWrites,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { purgeExpiredTrash } from "@/lib/firebase/trash";
import {
  getSyncState,
  setOnline,
  subscribeSyncState,
  watchQueuedWrites,
} from "@/lib/offline/syncStatus";

let purgedThisSession = false;
// Whether we switched Firestore's network off. Module-level because the tree
// remounts (e.g. on a language change) and Firestore must only be toggled on
// a real transition: enableNetwork() on an already-running client restarts
// its write stream mid-flight and trips an internal assertion (da08), after
// which queued writes never get acknowledged.
let networkDisabled = false;
let queueChecked = false;

/**
 * Mount once inside the signed-in shell. Mirrors the browser's online state
 * into Firestore (so offline reads answer from the cache straight away instead
 * of waiting on a dead connection), surfaces writes queued by an earlier
 * session, and runs the 30-day trash purge once per session.
 */
export function useOfflineSyncDriver() {
  useEffect(() => {
    function goOnline() {
      setOnline(true);
      if (networkDisabled) {
        networkDisabled = false;
        void enableNetwork(db).catch(() => {});
      }
      watchQueuedWrites(waitForPendingWrites(db));
    }
    function goOffline() {
      setOnline(false);
      if (!networkDisabled) {
        networkDisabled = true;
        void disableNetwork(db).catch(() => {});
      }
    }
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    if (!navigator.onLine) goOffline();
    else if (!queueChecked) {
      // Once per page load: surface writes an earlier session left queued.
      queueChecked = true;
      setOnline(true);
      watchQueuedWrites(waitForPendingWrites(db));
    }

    if (!purgedThisSession && navigator.onLine) {
      purgedThisSession = true;
      purgeExpiredTrash().catch((err) => {
        console.error("Trash purge failed", err);
      });
    }

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
}

export function useSyncState() {
  return useSyncExternalStore(subscribeSyncState, getSyncState, getSyncState);
}
