"use client";

import { useEffect, useMemo } from "react";
import Select from "@/components/atoms/Select";
import { useBccrRates } from "@/hooks/useBccrRates";
import type { BccrEntityRate } from "@/lib/services/bccrRates";

import { getLocale, t } from "@/lib/i18n";
export type FxDirection = "USD_TO_CRC" | "CRC_TO_USD";

export interface ResolvedRate {
  rate: number;
  // "compra" when the bank is buying USD (USD→CRC); "venta" when selling.
  side: "compra" | "venta";
  entity: BccrEntityRate;
  snapshotAt: string;
}

interface EntityRatePickerProps {
  direction: FxDirection;
  value: string | null;
  onChange: (entityId: string) => void;
  onResolved: (result: { resolved: ResolvedRate | null; fallback: boolean }) => void;
  disabled?: boolean;
}

function pickRate(
  entity: BccrEntityRate,
  direction: FxDirection,
): { rate: number; side: "compra" | "venta" } | null {
  if (direction === "USD_TO_CRC") {
    if (entity.buy === null) return null;
    return { rate: entity.buy, side: "compra" };
  }
  if (entity.sell === null) return null;
  return { rate: entity.sell, side: "venta" };
}

export default function EntityRatePicker({
  direction,
  value,
  onChange,
  onResolved,
  disabled,
}: EntityRatePickerProps) {
  const { snapshot, error, loading, refresh } = useBccrRates();

  const entities = useMemo(() => snapshot?.entities ?? [], [snapshot]);

  const selected = useMemo(() => {
    if (!entities.length) return null;
    const match = entities.find((e) => e.id === value);
    if (match) return match;
    // Fall back to the first entity that has the required side posted so the
    // preview lands on a usable rate instead of "—".
    return (
      entities.find((e) => pickRate(e, direction) !== null) ?? entities[0]
    );
  }, [entities, value, direction]);

  useEffect(() => {
    if (selected && selected.id !== value) {
      onChange(selected.id);
    }
  }, [selected, value, onChange]);

  const resolved = useMemo<ResolvedRate | null>(() => {
    if (!selected || !snapshot) return null;
    const picked = pickRate(selected, direction);
    if (!picked) return null;
    return { ...picked, entity: selected, snapshotAt: snapshot.fetchedAt };
  }, [selected, snapshot, direction]);

  const fallback = !!error || (!!snapshot && resolved === null);

  useEffect(() => {
    onResolved({ resolved, fallback });
  }, [resolved, fallback, onResolved]);

  const options = entities.map((e) => {
    const picked = pickRate(e, direction);
    const label = picked
      ? `${e.name} — ${picked.rate.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
      : `${e.name} — no ${direction === "USD_TO_CRC" ? "compra" : "venta"}`;
    return { value: e.id, label };
  });

  const dirLabel = direction === "USD_TO_CRC" ? t("compra (USD→CRC)") : t("venta (CRC→USD)");

  return (
    <div className="flex flex-col gap-1.5">
      <Select
        label={t("Bank rate — {dirLabel}", { dirLabel })}
        value={selected?.id ?? ""}
        onChange={onChange}
        options={options}
        disabled={disabled || loading || options.length === 0}
        placeholder={loading ? t("Loading BCCR rates…") : t("Select entity")}
      />
      {error && (
        <p className="text-xs text-expense">
          {t("BCCR unreachable ({error}). Using open.er-api.com fallback rate.", { error })}{" "}
          <button
            type="button"
            onClick={() => void refresh()}
            className="underline decoration-dotted underline-offset-4"
          >
            {t("Retry")}
          </button>
        </p>
      )}
      {!error && snapshot && resolved === null && selected && (
        <p className="text-xs text-fg-subtle">
          {t("{name} has no {direction} rate posted. Using fallback.", { name: selected.name, direction: dirLabel })}
        </p>
      )}
      {resolved && (
        <p className="text-xs text-fg-subtle">
          {t("Snapshot from {date}", { date: new Date(resolved.snapshotAt).toLocaleString(getLocale()) })}
        </p>
      )}
    </div>
  );
}
