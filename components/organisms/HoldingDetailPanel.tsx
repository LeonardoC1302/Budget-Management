"use client";

import { useMemo, useState } from "react";
import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import ConfirmDialog from "@/components/atoms/ConfirmDialog";
import Modal from "@/components/atoms/Modal";
import HoldingContributionForm from "@/components/molecules/HoldingContributionForm";
import HoldingForm from "@/components/molecules/HoldingForm";
import RecurringContributionForm from "@/components/molecules/RecurringContributionForm";
import ValuationForm from "@/components/molecules/ValuationForm";
import TransactionList from "@/components/organisms/TransactionList";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useMarketHistory } from "@/hooks/useMarketHistory";
import { DeleteIcon, EditIcon } from "@/lib/action/icons";
import type { MarketRange, QuoteResult } from "@/lib/services/marketData";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils/format";
import type {
  Account,
  Holding,
  HoldingValuation,
  NewHolding,
  NewHoldingValuation,
  NewRecurringTransaction,
  NewTransaction,
  RecurringTransaction,
} from "@/lib/types";
import { RECURRENCE_FREQUENCY_LABELS } from "@/lib/types";
import { nextOccurrenceAfter, toRule } from "@/lib/recurring/engine";
import { todayISODate } from "@/lib/utils/format";
import type {
  HoldingPosition,
  HoldingValueSnapshot,
} from "@/lib/utils/holdings";

import { getLocale, t } from "@/lib/i18n";
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
  // Standing contributions into this holding.
  recurringRules?: RecurringTransaction[];
  onAddRecurring?: (input: NewRecurringTransaction) => Promise<unknown>;
}

const RANGES: MarketRange[] = ["1M", "3M", "6M", "1Y", "5Y"];

const CHART_W = 320;
const CHART_H = 160;
const CHART_PAD_X = 12;
const CHART_PAD_Y = 10;

function LineChart({ values }: { values: { date: string; value: number }[] }) {
  if (values.length < 2) {
    return (
      <p className="text-sm text-fg-subtle">{t("Not enough data yet to plot.")}</p>
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
      aria-label={t("Price history")}
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
  | { kind: "recurring" }
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
  recurringRules = [],
  onAddRecurring,
}: HoldingDetailPanelProps) {
  const { displayCurrency, convertUsd } = usePreferences();
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
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="label-sm">
            {isMarket
              ? `${holding.symbol ?? ""}${holding.quoteCurrency && holding.quoteCurrency !== "USD" ? t(" · quoted in {quoteCurrency}", { quoteCurrency: holding.quoteCurrency }) : ""}`
              : holding.symbol
                ? t("{symbol} · Manual position", { symbol: holding.symbol })
                : t("Manual position")}
          </p>
          <h3 className="heading-lg truncate">{holding.name}</h3>
          {snapshot.asOf && (
            <p className="text-xs text-fg-subtle">
              {t("As of {date}", { date: formatDate(snapshot.asOf) })}
            </p>
          )}
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1 min-w-0">
          <Amount
            value={convertUsd(snapshot.currentValueUSD)}
            size="xl"
            currency={displayCurrency}
          />
          {snapshot.gainPct !== null && (
            <span className={cn("text-sm tabular-nums", gainTone)}>
              {snapshot.gainUSD >= 0 ? "+" : ""}
              {formatCurrency(convertUsd(snapshot.gainUSD), displayCurrency)}{" "}
              ({snapshot.gainPct >= 0 ? "+" : ""}
              {formatPercent(snapshot.gainPct)})
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
                {t("{price} last", { price: formatCurrency(convertUsd(quote.priceUSD), displayCurrency) })}
              </span>
            )}
          </div>
          {historyStatus === "unavailable" ? (
            <p className="text-sm text-fg-subtle">
              {t("Market data unavailable — set TWELVEDATA_API_KEY to enable price history.")}
            </p>
          ) : historyStatus === "loading" ? (
            <p className="text-sm text-fg-subtle">{t("Loading price history…")}</p>
          ) : historyStatus === "error" ? (
            <p className="text-sm text-fg-subtle">
              {t("Could not load price history right now.")}
            </p>
          ) : (
            <LineChart values={chartValues} />
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-fg-subtle">
            {t("Balance history from your valuation entries.")}
          </p>
          <LineChart values={chartValues} />
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3">
        <Stat
          label={t("Cost basis")}
          value={formatCurrency(convertUsd(position?.costBasisUSD ?? 0), displayCurrency)}
        />
        <Stat
          label={t("Current value")}
          value={formatCurrency(convertUsd(snapshot.currentValueUSD), displayCurrency)}
        />
        {isMarket && (position?.shares ?? 0) > 0 && (
          <>
            <Stat
              label={t("Shares")}
              value={(position?.shares ?? 0).toLocaleString(getLocale(), {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}
            />
            <Stat
              label={t("Avg cost")}
              value={formatCurrency(convertUsd(position?.avgCostUSD ?? 0), displayCurrency)}
            />
          </>
        )}
      </dl>

      {position?.hasUnpriced && (
        <p className="text-xs text-fg-subtle">
          {t("Some contributions were migrated from a legacy investment category and have no price on file — they count toward cost basis only.")}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => setModal({ kind: "contribute" })}
        >
          {t("Contribute")}
        </Button>
        {onAddRecurring && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setModal({ kind: "recurring" })}
          >
            {t("Repeat")}
          </Button>
        )}
        {!isMarket && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setModal({ kind: "valuation" })}
          >
            {t("Update balance")}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setModal({ kind: "edit" })}
        >
          <EditIcon aria-hidden />
          <span className="ml-1">{t("Edit")}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmDeleteHolding(true)}
          disabled={!canDelete}
          title={
            canDelete
              ? t("Delete this position")
              : t("Delete or move this position's contributions first")
          }
          className="text-expense hover:text-bg hover:bg-expense"
        >
          <DeleteIcon aria-hidden />
          <span className="ml-1">{t("Delete")}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="ml-auto"
        >
          {t("Close")}
        </Button>
      </div>

      {!isMarket && valuations.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="label-sm">{t("Balance history")}</h4>
          <ul className="surface divide-y divide-border">
            {valuations.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm text-fg tabular-nums">
                    {formatCurrency(convertUsd(v.valueUSD), displayCurrency)}
                  </p>
                  <p className="text-xs text-fg-subtle truncate">
                    {formatDate(v.asOfDate)}
                    {v.note ? ` · ${v.note}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t("Delete valuation")}
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
        <h4 className="label-sm">{t("Contributions")}</h4>
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
          emptyTitle={t("No contributions yet")}
          emptyDescription={t("Use Contribute to log your first buy.")}
        />
      </div>

      {recurringRules.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs text-fg-muted">
          {recurringRules.map((r) => {
            const next = r.active
              ? nextOccurrenceAfter(toRule(r), todayISODate())
              : undefined;
            return (
              <li key={r.id}>
                {formatCurrency(r.amount, r.currency)}{" "}
                {t(RECURRENCE_FREQUENCY_LABELS[r.frequency]).toLowerCase()}
                {r.active
                  ? next
                    ? t(" · next {0}", { "0": formatDate(next) })
                    : t(" · ended")
                  : t(" · paused")}
                {" · "}
                <a href="/recurring" className="underline underline-offset-2 hover:text-fg">
                  {t("manage")}
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {onAddRecurring && (
        <Modal
          open={modal.kind === "recurring"}
          onClose={() => setModal({ kind: "none" })}
          title={t("Repeat a contribution to {name}", { name: holding.name })}
        >
          <RecurringContributionForm
            holdings={[holding]}
            holdingId={holding.id}
            onSubmit={async (input) => {
              await onAddRecurring(input);
              setModal({ kind: "none" });
            }}
            onCancel={() => setModal({ kind: "none" })}
          />
        </Modal>
      )}

      <Modal
        open={modal.kind === "contribute"}
        onClose={() => setModal({ kind: "none" })}
        title={t("Contribute to {name}", { name: holding.name })}
      >
        <HoldingContributionForm
          holding={holding}
          lastFee={
            [...(position?.contributions ?? [])]
              .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
              .find((c) => typeof c.fee === "number")?.fee
          }
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
        title={t("Edit position")}
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
        title={t("Record balance")}
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
        title={t("Remove this contribution?")}
        message={
          modal.kind === "confirm-delete-tx" ? (
            <>
              {t("This removes")}{" "}
              {typeof modal.shares === "number" && modal.shares > 0 ? (
                <>
                  {t("{shares} shares from your {name} position.", {
                    shares: modal.shares.toFixed(4),
                    name: holding.name,
                  })}
                </>
              ) : (
                <>{t("this contribution from your {name} position.", { name: holding.name })}</>
              )}{" "}
              {t("The originating account outflow is deleted too.")}
            </>
          ) : null
        }
        confirmLabel={t("Delete")}
        cancelLabel={t("Keep it")}
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
        title={t("Delete this position?")}
        message={
          <>
            <span className="text-fg font-medium">{holding.name}</span>{" "}{t("will be removed. Contributions must be deleted or moved first.")}
          </>
        }
        confirmLabel={t("Delete")}
        cancelLabel={t("Keep it")}
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
