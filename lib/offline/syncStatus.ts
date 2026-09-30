// Tracks whether this device has changes the server hasn't acknowledged yet.
// `trackPendingWrite` counts writes made in this session; `watchQueuedWrites`
// covers writes queued in IndexedDB by an earlier session that closed offline.

export interface SyncState {
  online: boolean;
  pendingWrites: number;
  // Writes from a previous session still waiting in the local queue.
  queuedFromEarlier: boolean;
}

let state: SyncState = {
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  pendingWrites: 0,
  queuedFromEarlier: false,
};

const listeners = new Set<() => void>();

function set(patch: Partial<SyncState>) {
  state = { ...state, ...patch };
  for (const fn of listeners) fn();
}

export function getSyncState(): SyncState {
  return state;
}

export function subscribeSyncState(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function setOnline(online: boolean) {
  if (online !== state.online) set({ online });
}

export function trackPendingWrite(write: Promise<unknown>) {
  set({ pendingWrites: state.pendingWrites + 1 });
  write
    .catch((err) => {
      // Offline writes that the server later rejects (e.g. a revoked grant)
      // can't reach the caller any more. Log so they aren't silent.
      console.error("A queued change was rejected by the server", err);
    })
    .finally(() => set({ pendingWrites: Math.max(0, state.pendingWrites - 1) }));
}

export function watchQueuedWrites(wait: Promise<void>) {
  let settled = false;
  // Give the queue a moment to flush before announcing anything.
  const timer = setTimeout(() => {
    if (!settled) set({ queuedFromEarlier: true });
  }, 1500);
  wait
    .catch(() => {})
    .finally(() => {
      settled = true;
      clearTimeout(timer);
      set({ queuedFromEarlier: false });
    });
}

export function hasUnsyncedChanges(): boolean {
  return state.pendingWrites > 0 || state.queuedFromEarlier;
}
