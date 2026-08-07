"use client";

import { useMemo, useState } from "react";
import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import ConfirmDialog from "@/components/atoms/ConfirmDialog";
import Modal from "@/components/atoms/Modal";
import HoldingContributionForm from "@/components/molecules/HoldingContributionForm";
import HoldingForm from "@/components/molecules/HoldingForm";
import ValuationForm from "@/components/molecules/ValuationForm";
import TransactionList from "@/components/organisms/TransactionList";
import { useMarketHistory } from "@/hooks/useMarketHistory";
import { DeleteIcon, EditIcon } from "@/lib/action/icons";
import type { MarketRange, QuoteResult } from "@/lib/services/marketData";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type {
  Account,
  Holding,
  HoldingValuation,
  NewHolding,
  NewHoldingValuation,
  NewTransaction,
} from "@/lib/types";
import type {
  HoldingPosition,
  HoldingValueSnapshot,
} from "@/lib/utils/holdings";

interface HoldingDetailPanelProps {
  holding: Holding;
  position?: HoldingPosition;
  snapshot: HoldingValueSnapshot;
  quote?: QuoteResult;
  valuations: HoldingValuation[];
  accountsById: Record<string, Account | undefined>;
  onClose: () => void;
  onContribute: (input: NewTransaction) => void | Promise<void>;
  onDeleteTransaction: (id: string) => void | Promise<void>;
  onEditHolding: (id: string, patch: Partial<NewHolding>) => Promise<unknown>;
  onDeleteHolding: (holding: Holding) => void | Promise<void>;
  onAddValuation: (input: NewHoldingValuation) => Promise<unknown>;
  onDeleteValuation: (id: string) => void | Promise<void>;
}

const RANGES: MarketRange[] = ["1M", "3M", "6M", "1Y", "5Y"];

const CHART_W = 320;
const CHART_H = 160;
const CHART_PAD_X = 12;
const CHART_PAD_Y = 10;

function LineChart({ values }: { values: { date: string; value: number }[] }) {
  if (values.length < 2) {
    return (
      <p className="text-sm text-fg-subtle">Not enough data yet to plot.</p>
    );
  }
  const min = Math.min(...values.map((v) => v.value));
  const max = Math.max(...values.map((v) => v.value));
  const range = max - min || 1;
  const w = CHART_W - CHART_PAD_X * 2;
  const h = CHART_H - CHART_PAD_Y * 2;
  const step = w / (values.length - 1);
  const points = values.map((v, i) => {
    const x = CHART_PAD_X + i * step;
    const y = CHART_PAD_Y + h - ((v.value - min) / range) * h;
    return { x, y };
  });
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${path} L ${points[points.length - 1].x.toFixed(1)} ${CHART_PAD_Y + h} L ${points[0].x.toFixed(1)} ${CHART_PAD_Y + h} Z`;
  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="w-full h-[160px]"
      role="img"
      aria-label="Price history"
    >
      <defs>
        <linearGradient id="holding-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-invest)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-invest)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#holding-area)" />
      <path
        d={path}
        fill="none"
        stroke="var(--color-invest)"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type ModalKind =
  | { kind: "none" }
  | { kind: "contribute" }
  | { kind: "edit" }
  | { kind: "valuation"; existing?: HoldingValuation }
  | { kind: "confirm-delete-tx"; transactionId: string; shares?: number };

export default function HoldingDetailPanel({
  holding,
  position,
  snapshot,
  quote,
  valuations,
  accountsById,
  onClose,
  onContribute,
  onDeleteTransaction,
  onEditHolding,
  onDeleteHolding,
  onAddValuation,
  onDeleteValuation,
}: HoldingDetailPanelProps) {
  const [range, setRange] = useState<MarketRange>("6M");
  const [modal, setModal] = useState<ModalKind>({ kind: "none" });
  const [confirmDeleteHolding, setConfirmDeleteHolding] = useState(false);

  const isMarket = holding.kind === "market";
  const historySymbol = isMarket ? holding.symbol ?? null : null;
  const { data: history, status: historyStatus } = useMarketHistory(
    historySymbol,
    range,
  );

  const chartValues = useMemo(() => {
    if (isMarket) {
      return (history?.points ?? []).map((p) => ({
        date: p.date,
        value: p.closeUSD,
      }));
    }
    return [...valuations]
      .slice()
      .sort((a, b) => a.asOfDate.localeCompare(b.asOfDate))
      .map((v) => ({ date: v.asOfDate, value: v.valueUSD }));
  }, [history, isMarket, valuations]);

  const gainTone =
    snapshot.gainUSD > 0
      ? "text-income"
      : snapshot.gainUSD < 0
        ? "text-expense"
        : "text-fg-muted";

  const canDelete = (position?.contributions.length ?? 0) === 0;

  const contributions = position?.contributions ?? [];

  return (
    <section className="surface p-5 flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="label-sm">
            {isMarket
              ? `${holding.symbol ?? ""}${holding.quoteCurrency && holding.quoteCurrency !== "USD" ? ` · quoted in ${holding.quoteCurrency}` : ""}`
              : holding.symbol
                ? `${holding.symbol} · Manual position`
                : "Manual position"}
          </p>
          <h3 className="heading-lg truncate">{holding.name}</h3>
          {snapshot.asOf && (
            <p className="text-xs text-fg-subtle">
              As of {formatDate(snapshot.asOf)}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Amount value={snapshot.currentValueUSD} size="xl" />
          {snapshot.gainPct !== null && (
            <span className={cn("text-sm tabular-nums", gainTone)}>
              {snapshot.gainUSD >= 0 ? "+" : ""}
              {formatCurrency(snapshot.gainUSD, "USD")}{" "}
              ({snapshot.gainPct >= 0 ? "+" : ""}
              {(snapshot.gainPct * 100).toFixed(2)}%)
            </span>
          )}
        </div>
      </header>

      {isMarket ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1 p-0.5 bg-surface-2 border border-border rounded-[10px]">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={cn(
                    "px-2.5 h-7 text-xs font-medium rounded-[7px] transition-colors",
                    range === r
                      ? "bg-invest-soft text-invest"
                      : "text-fg-muted hover:text-fg",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            {quote?.priceUSD && (
              <span className="text-xs text-fg-subtle tabular-nums">
                {formatCurrency(quote.priceUSD, "USD")} last
              </span>
            )}
          </div>
          {historyStatus === "unavailable" ? (
            <p className="text-sm text-fg-subtle">
              Market data unavailable — set TWELVEDATA_API_KEY to enable
              price history.
            </p>
          ) : historyStatus === "loading" ? (
            <p className="text-sm text-fg-subtle">Loading price history…</p>
          ) : historyStatus === "error" ? (
            <p className="text-sm text-fg-subtle">
              Could not load price history right now.
            </p>
          ) : (
            <LineChart values={chartValues} />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-fg-subtle">
            Balance history from your valuation entries.
          </p>
          <LineChart values={chartValues} />
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3">
        <Stat
          label="Cost basis"
          value={formatCurrency(position?.costBasisUSD ?? 0, "USD")}
        />
        <Stat
          label="Current value"
          value={formatCurrency(snapshot.currentValueUSD, "USD")}
        />
        {isMarket && (position?.shares ?? 0) > 0 && (
          <>
            <Stat
              label="Shares"
              value={(position?.shares ?? 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}
            />
            <Stat
              label="Avg cost"
              value={formatCurrency(position?.avgCostUSD ?? 0, "USD")}
            />
          </>
        )}
      </dl>

      {position?.hasUnpriced && (
        <p className="text-xs text-fg-subtle">
          Some contributions were migrated from a legacy investment category and
          have no price on file — they count toward cost basis only.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => setModal({ kind: "contribute" })}
        >
          Contribute
        </Button>
        {!isMarket && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setModal({ kind: "valuation" })}
          >
            Update balance
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setModal({ kind: "edit" })}
        >
          <EditIcon aria-hidden />
          <span className="ml-1">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmDeleteHolding(true)}
          disabled={!canDelete}
          title={
            canDelete
              ? "Delete this position"
              : "Delete or move this position's contributions first"
          }
          className="text-expense hover:text-white hover:bg-expense"
        >
          <DeleteIcon aria-hidden />
          <span className="ml-1">Delete</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="ml-auto"
        >
          Close
        </Button>
      </div>

      {!isMarket && valuations.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="label-sm">Balance history</h4>
          <ul className="surface divide-y divide-border">
            {valuations.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm text-fg tabular-nums">
                    {formatCurrency(v.valueUSD, "USD")}
                  </p>
                  <p className="text-xs text-fg-subtle truncate">
                    {formatDate(v.asOfDate)}
                    {v.note ? ` · ${v.note}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Delete valuation"
                  onClick={() => onDeleteValuation(v.id)}
                  className="px-2"
                >
                  <DeleteIcon aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h4 className="label-sm">Contributions</h4>
        <TransactionList
          transactions={contributions}
          accountsById={accountsById as Record<string, Account>}
          onSelect={(t) =>
            setModal({
              kind: "confirm-delete-tx",
              transactionId: t.id,
              shares: t.sharesDelta,
            })
          }
          emptyTitle="No contributions yet"
          emptyDescription="Use Contribute to log your first buy."
        />
      </div>

      <Modal
        open={modal.kind === "contribute"}
        onClose={() => setModal({ kind: "none" })}
        title={`Contribute to ${holding.name}`}
      >
        <HoldingContributionForm
          holding={holding}
          onSubmit={async (input) => {
            await onContribute(input);
            setModal({ kind: "none" });
          }}
          onCancel={() => setModal({ kind: "none" })}
        />
      </Modal>

      <Modal
        open={modal.kind === "edit"}
        onClose={() => setModal({ kind: "none" })}
        title="Edit position"
      >
        <HoldingForm
          initial={holding}
          onSubmit={async (patch) => {
            await onEditHolding(holding.id, patch);
            setModal({ kind: "none" });
          }}
          onCancel={() => setModal({ kind: "none" })}
        />
      </Modal>

      <Modal
        open={modal.kind === "valuation"}
        onClose={() => setModal({ kind: "none" })}
        title="Record balance"
      >
        <ValuationForm
          holdingId={holding.id}
          onSubmit={async (input) => {
            await onAddValuation(input);
            setModal({ kind: "none" });
          }}
          onCancel={() => setModal({ kind: "none" })}
        />
      </Modal>

      <ConfirmDialog
        open={modal.kind === "confirm-delete-tx"}
        title="Remove this contribution?"
        message={
          modal.kind === "confirm-delete-tx" ? (
            <>
              This removes{" "}
              {typeof modal.shares === "number" && modal.shares > 0 ? (
                <>
                  <span className="text-fg font-medium">
                    {modal.shares.toFixed(4)} shares
                  </span>{" "}
                  from your {holding.name} position.
                </>
              ) : (
                <>this contribution from your {holding.name} position.</>
              )}{" "}
              The originating account outflow is deleted too.
            </>
          ) : null
        }
        confirmLabel="Delete"
        cancelLabel="Keep it"
        tone="danger"
        onConfirm={async () => {
          if (modal.kind !== "confirm-delete-tx") return;
          await onDeleteTransaction(modal.transactionId);
          setModal({ kind: "none" });
        }}
        onCancel={() => setModal({ kind: "none" })}
      />

      <ConfirmDialog
        open={confirmDeleteHolding}
        title="Delete this position?"
        message={
          <>
            <span className="text-fg font-medium">{holding.name}</span> will be
            removed. Contributions must be deleted or moved first.
          </>
        }
        confirmLabel="Delete"
        cancelLabel="Keep it"
        tone="danger"
        onConfirm={async () => {
          setConfirmDeleteHolding(false);
          await onDeleteHolding(holding);
        }}
        onCancel={() => setConfirmDeleteHolding(false)}
      />
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[10px] bg-surface-2 px-3 py-2">
      <span className="text-[10px] text-fg-subtle">{label}</span>
      <span className="text-sm text-fg tabular-nums">{value}</span>
    </div>
  );
}
