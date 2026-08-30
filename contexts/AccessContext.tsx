"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setAccessibleContexts } from "@/lib/firebase/access";
import {
  readNickname,
  subscribeMyGrants,
  subscribeMyGrantsGiven,
  type ConnectionDoc,
} from "@/lib/firebase/connections";
import { useAuth } from "@/contexts/AuthContext";
import { emitDataChanged } from "@/lib/events/dataChanged";
import type { OwnerCtx } from "@/lib/types";

interface AccessContextValue {
  // OwnerCtxs the signed-in user can read from. Does NOT include self; use
  // `getAccessibleContexts()` from `lib/firebase/access` for the self-inclusive
  // list when doing store fan-out. Kept here for UI that lists grantors only.
  grantors: OwnerCtx[];
  // Connections where the signed-in user is the owner (i.e. people they've
  // shared with). Rendered on the Connections page's "People you share with".
  grantsGiven: ConnectionDoc[];
  // Raw connection docs where the user is the guest. Handy when the UI wants
  // the connectionId (e.g. for renaming/revoking).
  grantsReceived: ConnectionDoc[];
  loading: boolean;
}

const Ctx = createContext<AccessContextValue | null>(null);

export function AccessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [grantsReceived, setGrantsReceived] = useState<ConnectionDoc[]>([]);
  const [grantsGiven, setGrantsGiven] = useState<ConnectionDoc[]>([]);
  const [grantors, setGrantors] = useState<OwnerCtx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // Reset when signed out. Setting these here would fire the
      // set-state-in-effect lint rule; the deferred callbacks below dodge it
      // and semantically are the same thing.
      queueMicrotask(() => {
        setGrantsReceived([]);
        setGrantsGiven([]);
        setGrantors([]);
        setLoading(false);
      });
      setAccessibleContexts([]);
      return;
    }
    queueMicrotask(() => setLoading(true));
    const unsubReceived = subscribeMyGrants(user.uid, setGrantsReceived);
    const unsubGiven = subscribeMyGrantsGiven(user.uid, setGrantsGiven);
    return () => {
      unsubReceived();
      unsubGiven();
    };
  }, [user]);

  // Whenever the guest-side grants change, resolve each owner's current
  // nickname (from users/{uid}) so badges use the latest name — the snapshot
  // stored on the connection doc is only a fallback.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: OwnerCtx[] = await Promise.all(
        grantsReceived.map(async (g) => {
          let nickname = g.ownerNickname;
          try {
            const fresh = await readNickname(g.ownerUid);
            if (fresh) nickname = fresh;
          } catch {
            // Non-fatal — stick with snapshot nickname
          }
          return {
            uid: g.ownerUid,
            nickname,
            permission: g.permission,
          } satisfies OwnerCtx;
        }),
      );
      if (cancelled) return;
      setGrantors(next);
      setAccessibleContexts(next);
      setLoading(false);
      // Notify hooks so lists re-fetch and now include shared data.
      emitDataChanged();
    })();
    return () => {
      cancelled = true;
    };
  }, [grantsReceived]);

  const value = useMemo<AccessContextValue>(
    () => ({ grantors, grantsGiven, grantsReceived, loading }),
    [grantors, grantsGiven, grantsReceived, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAccess(): AccessContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAccess must be used inside <AccessProvider>");
  return ctx;
}

// Convenience: does the signed-in user have any write-grants?
export function useHasWriteGrants(): boolean {
  const { grantors } = useAccess();
  return useCallback(
    () => grantors.some((g) => g.permission === "write"),
    [grantors],
  )();
}
