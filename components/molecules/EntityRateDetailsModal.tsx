"use client";

import Modal from "@/components/atoms/Modal";
import type { BccrEntityRate } from "@/lib/services/bccrRates";

interface EntityRateDetailsModalProps {
  entity: BccrEntityRate | null;
  bestBuy: number;
  bestSell: number;
  fetchedAt: string;
  onClose: () => void;
}

function fmtRate(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  if (Number.isNaN(then)) return iso;
  const seconds = Math.round(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function EntityRateDetailsModal({
  entity,
  bestBuy,
  bestSell,
  fetchedAt,
  onClose,
}: EntityRateDetailsModalProps) {
  const isBestBuy =
    entity !== null && entity.buy !== null && entity.buy === bestBuy;
  const isBestSell =
    entity !== null && entity.sell !== null && entity.sell === bestSell;
  const spread =
    entity && entity.buy !== null && entity.sell !== null
      ? entity.sell - entity.buy
      : null;
  const buyGap =
    entity && entity.buy !== null ? bestBuy - entity.buy : null;
  const sellGap =
    entity && entity.sell !== null ? entity.sell - bestSell : null;

  return (
    <Modal open={!!entity} onClose={onClose} title="Rate details">
      {entity && (
        <div className="flex flex-col gap-4">
          <div className="rounded-[10px] bg-surface-2 px-4 py-3">
            <span className="kicker">Entity</span>
            <p className="font-serif text-lg text-fg mt-1 break-words">
              {entity.name}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              {isBestBuy && (
                <span
                  className="chip"
                  style={{
                    background: "var(--color-income-soft)",
                    color: "var(--color-income)",
                    borderColor: "transparent",
                  }}
                >
                  Best buy
                </span>
              )}
              {isBestSell && (
                <span
                  className="chip"
                  style={{
                    background: "var(--color-expense-soft)",
                    color: "var(--color-expense)",
                    borderColor: "transparent",
                  }}
                >
                  Best sell
                </span>
              )}
              {!isBestBuy && !isBestSell && (
                <span className="text-[11px] text-fg-muted uppercase tracking-[0.14em]">
                  {entity.category ?? "Bank window"}
                </span>
              )}
            </div>
          </div>

          <dl className="flex flex-col divide-y divide-border">
            <Row
              label="Buy"
              hint={
                buyGap !== null && buyGap > 0
                  ? `₡${fmtRate(buyGap)} short of best`
                  : buyGap === 0
                    ? "At the best"
                    : undefined
              }
            >
              <span
                className="figure text-sm"
                style={{
                  color: isBestBuy ? "var(--color-income)" : "var(--color-fg)",
                }}
              >
                ₡{fmtRate(entity.buy)}
              </span>
            </Row>
            <Row
              label="Sell"
              hint={
                sellGap !== null && sellGap > 0
                  ? `₡${fmtRate(sellGap)} above best`
                  : sellGap === 0
                    ? "At the best"
                    : undefined
              }
            >
              <span
                className="figure text-sm"
                style={{
                  color: isBestSell ? "var(--color-expense)" : "var(--color-fg)",
                }}
              >
                ₡{fmtRate(entity.sell)}
              </span>
            </Row>
            {spread !== null && (
              <Row label="Spread">
                <span className="figure text-sm text-fg">
                  ₡{fmtRate(spread)}
                </span>
              </Row>
            )}
            <Row label="Updated">
              <span className="text-fg">{fmtRelative(fetchedAt)}</span>
            </Row>
          </dl>
        </div>
      )}
    </Modal>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 text-sm">
      <dt className="text-fg-subtle">{label}</dt>
      <dd className="text-fg text-right flex flex-col items-end gap-0.5">
        {children}
        {hint && <span className="text-xs text-fg-muted">{hint}</span>}
      </dd>
    </div>
  );
}
