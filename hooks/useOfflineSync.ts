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

/**
 * Mount once inside the signed-in shell. Mirrors the browser's online state
 * into Firestore (so offline reads answer from the cache straight away instead
 * of waiting on a dead connection), surfaces writes queued by an earlier
 * session, and runs the 30-day trash purge once per session.
 */
export function useOfflineSyncDriver() {
  useEffect(() => {
    function apply(online: boolean) {
      setOnline(online);
      void (online ? enableNetwork(db) : disableNetwork(db)).catch(() => {});
      if (online) watchQueuedWrites(waitForPendingWrites(db));
    }
    const onOnline = () => apply(true);
    const onOffline = () => apply(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    apply(navigator.onLine);

    if (!purgedThisSession && navigator.onLine) {
      purgedThisSession = true;
      purgeExpiredTrash().catch((err) => {
        console.error("Trash purge failed", err);
      });
    }

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);
}

export function useSyncState() {
  return useSyncExternalStore(subscribeSyncState, getSyncState, getSyncState);
}
