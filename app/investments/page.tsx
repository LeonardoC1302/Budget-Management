"use client";

import { useMemo, useState } from "react";
import Button from "@/components/atoms/Button";
import EmptyState from "@/components/atoms/EmptyState";
import Modal from "@/components/atoms/Modal";
import RowSkeleton from "@/components/atoms/RowSkeleton";
import HoldingCard from "@/components/molecules/HoldingCard";
import RouteMasthead from "@/components/molecules/RouteMasthead";
import HoldingForm from "@/components/molecules/HoldingForm";
import HoldingDetailPanel from "@/components/organisms/HoldingDetailPanel";
import UnassignedMapper from "@/components/organisms/UnassignedMapper";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useHoldings } from "@/hooks/useHoldings";
import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import { emitDataChanged } from "@/lib/events/dataChanged";
import type { Holding, NewHolding, NewTransaction } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";
import {
  latestValuationFor,
  manualSnapshot,
  marketSnapshot,
  type HoldingValueSnapshot,
} from "@/lib/utils/holdings";
import { transactionStore } from "@/lib/storage";

export default function InvestmentsPage() {
  const {
    holdings,
    byId,
    positionsById,
    valuationsByHolding,
    unassignedInvestments,
    loading,
    addHolding,
    updateHolding,
    removeHolding,
    addValuation,
    removeValuation,
  } = useHoldings();
  const { byId: accountsById } = useAccounts();
  const { byId: categoriesById } = useCategories();

  const [createOpen, setCreateOpen] = useState(false);
  const [openHoldingId, setOpenHoldingId] = useState<string | null>(null);
  const [mapperOpen, setMapperOpen] = useState(false);

  const marketSymbols = useMemo(
    () =>
      holdings
        .filter((h) => h.kind === "market" && !!h.symbol)
        .map((h) => h.symbol as string),
    [holdings],
  );
  const { quotes, status: quoteStatus } = useMarketQuotes(marketSymbols);

  const snapshots = useMemo(() => {
    const map = new Map<string, HoldingValueSnapshot>();
    for (const h of holdings) {
      const position = positionsById[h.id];
      if (h.kind === "market") {
        map.set(
          h.id,
          marketSnapshot(position, h.symbol ? quotes[h.symbol] : undefined),
        );
      } else {
        const latest = latestValuationFor(
          h.id,
          valuationsByHolding[h.id] ?? [],
        );
        map.set(h.id, manualSnapshot(position, latest));
      }
    }
    return map;
  }, [holdings, positionsById, quotes, valuationsByHolding]);

  const totals = useMemo(() => {
    let costBasis = 0;
    let currentValue = 0;
    for (const h of holdings) {
      const snap = snapshots.get(h.id);
      const position = positionsById[h.id];
      costBasis += position?.costBasisUSD ?? 0;
      currentValue += snap?.currentValueUSD ?? 0;
    }
    for (const t of unassignedInvestments) {
      costBasis += t.amountUSD;
      currentValue += t.amountUSD;
    }
    return {
      costBasis,
      currentValue,
      gain: currentValue - costBasis,
      gainPct: costBasis > 0 ? (currentValue - costBasis) / costBasis : null,
    };
  }, [holdings, positionsById, snapshots, unassignedInvestments]);

  const openHolding = openHoldingId ? byId[openHoldingId] : undefined;

  async function handleCreateHolding(input: NewHolding) {
    await addHolding(input);
    setCreateOpen(false);
  }

  async function handleContribute(input: NewTransaction) {
    await transactionStore.add(input);
    emitDataChanged();
  }

  async function handleDeleteTransaction(id: string) {
    await transactionStore.remove(id);
    emitDataChanged();
  }

  async function handleAssignUnassigned(
    transactionIds: string[],
    holdingId: string,
  ) {
    const idSet = new Set(transactionIds);
    const targets = unassignedInvestments.filter((t) => idSet.has(t.id));
    await Promise.all(
      targets.map((t) =>
        transactionStore.update(t.id, {
          type: t.type,
          amount: t.amount,
          currency: t.currency,
          accountId: t.accountId,
          categoryId: "",
          description: t.description,
          date: t.date,
          holdingId,
          unpriced: true,
        }),
      ),
    );
    emitDataChanged();
    setMapperOpen(false);
  }

  async function handleDeleteHolding(holding: Holding) {
    await removeHolding(holding.id);
    setOpenHoldingId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <RouteMasthead
        kicker="Portfolio"
        title="Investments"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            New position
          </Button>
        }
      />

      <section
        className="surface p-5 flex flex-col gap-1.5"
        aria-label="Portfolio summary"
      >
        <span className="label-sm">Current value</span>
        <span className="text-3xl font-semibold tracking-tight tabular-nums text-invest">
          {formatCurrency(totals.currentValue, "USD")}
        </span>
        <div className="flex items-center justify-between text-xs text-fg-subtle mt-1">
          <span>Cost basis {formatCurrency(totals.costBasis, "USD")}</span>
          {totals.gainPct !== null && (
            <span
              className={
                totals.gain > 0
                  ? "text-income tabular-nums"
                  : totals.gain < 0
                    ? "text-expense tabular-nums"
                    : "text-fg-muted tabular-nums"
              }
            >
              {totals.gain >= 0 ? "+" : ""}
              {formatCurrency(totals.gain, "USD")} (
              {totals.gainPct >= 0 ? "+" : ""}
              {(totals.gainPct * 100).toFixed(2)}%)
            </span>
          )}
        </div>
        {quoteStatus === "unavailable" && marketSymbols.length > 0 && (
          <p className="text-[11px] text-fg-subtle mt-1">
            Live prices unavailable — showing cost basis. Set
            TWELVEDATA_API_KEY to enable market data.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="positions">
        <div className="flex items-center justify-between">
          <h2 id="positions" className="heading-lg">
            Positions
          </h2>
        </div>

        {loading ? (
          <RowSkeleton count={3} />
        ) : holdings.length === 0 ? (
          <EmptyState
            title="No positions yet"
            description="Add an ETF, stock, crypto, or a manual balance (e.g. a pension) to start tracking your portfolio."
            actionLabel="New position"
            actionOnClick={() => setCreateOpen(true)}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {holdings.map((h) => {
              const snap = snapshots.get(h.id);
              if (!snap) return null;
              const position = positionsById[h.id];
              const quote = h.symbol ? quotes[h.symbol] : undefined;
              return (
                <HoldingCard
                  key={h.id}
                  holding={h}
                  position={position}
                  snapshot={snap}
                  quote={quote}
                  onOpen={(x) => setOpenHoldingId(x.id)}
                />
              );
            })}
          </ul>
        )}

        {unassignedInvestments.length > 0 && (
          <button
            type="button"
            onClick={() => setMapperOpen(true)}
            className="surface p-4 text-left hover:bg-surface-2 transition-colors flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-sm font-medium text-fg">
                Unassigned contributions
              </p>
              <p className="text-xs text-fg-subtle">
                {unassignedInvestments.length} legacy entr
                {unassignedInvestments.length === 1 ? "y" : "ies"} · move into a
                holding
              </p>
            </div>
            <span className="text-sm text-fg tabular-nums">
              {formatCurrency(
                unassignedInvestments.reduce(
                  (sum, t) => sum + t.amountUSD,
                  0,
                ),
                "USD",
              )}
            </span>
          </button>
        )}
      </section>

      {openHolding && (
        <HoldingDetailPanel
          holding={openHolding}
          position={positionsById[openHolding.id]}
          snapshot={snapshots.get(openHolding.id)!}
          quote={openHolding.symbol ? quotes[openHolding.symbol] : undefined}
          valuations={valuationsByHolding[openHolding.id] ?? []}
          accountsById={accountsById}
          onClose={() => setOpenHoldingId(null)}
          onContribute={handleContribute}
          onDeleteTransaction={handleDeleteTransaction}
          onEditHolding={updateHolding}
          onDeleteHolding={handleDeleteHolding}
          onAddValuation={addValuation}
          onDeleteValuation={removeValuation}
        />
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add a position"
      >
        <HoldingForm
          onSubmit={handleCreateHolding}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      <UnassignedMapper
        open={mapperOpen}
        transactions={unassignedInvestments}
        holdings={holdings}
        accountsById={accountsById}
        categoriesById={categoriesById}
        onClose={() => setMapperOpen(false)}
        onAssign={handleAssignUnassigned}
      />
    </div>
  );
}
