"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { emitDataChanged } from "@/lib/events/dataChanged";
import { runMaterialization } from "@/lib/recurring/runMaterialization";

/**
 * Materializes any missed recurring occurrences into real transactions,
 * once per authenticated session. Broadcasts via emitDataChanged so hooks
 * like useTransactions / useAccounts refetch.
 */
export function useRecurringMaterializer() {
  const { user } = useAuth();
  const ranForUid = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (ranForUid.current === user.uid) return;
    ranForUid.current = user.uid;

    let cancelled = false;
    (async () => {
      try {
        const inserted = await runMaterialization();
        if (!cancelled && inserted) emitDataChanged();
      } catch (err) {
        console.error("Recurring materialization failed", err);
        ranForUid.current = null;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);
}
