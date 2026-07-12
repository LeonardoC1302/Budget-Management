type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to global data-change ticks (e.g. after recurring materialization). */
export function subscribeDataChanged(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Notify all subscribers that stored data has changed and should be refetched. */
export function emitDataChanged(): void {
  for (const fn of listeners) fn();
}
