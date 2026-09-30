"use client";

import { useMemo, useState } from "react";
import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import ConfirmDialog from "@/components/atoms/ConfirmDialog";
import Modal from "@/components/atoms/Modal";
import ProgressBar from "@/components/atoms/ProgressBar";
import RowSkeleton from "@/components/atoms/RowSkeleton";
import ContributionForm from "@/components/molecules/ContributionForm";
import GoalForm from "@/components/molecules/GoalForm";
import GoalWithdrawalForm from "@/components/molecules/GoalWithdrawalForm";
import RouteMasthead from "@/components/molecules/RouteMasthead";
import GoalList from "@/components/organisms/GoalList";
import { useAccounts } from "@/hooks/useAccounts";
import { useGoals } from "@/hooks/useGoals";
import type { Goal, NewGoal, NewGoalContribution } from "@/lib/types";

import { t, tn } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils/format";
type Mode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; goal: Goal }
  | { kind: "contribute"; goal: Goal }
  | { kind: "withdraw"; goal: Goal };

export default function GoalsPage() {
  const {
    goals,
    contributionsByGoal,
    monthlyRate,
    loading,
    addGoal,
    updateGoal,
    removeGoal,
    addContribution,
    removeContribution,
  } = useGoals();
  const {
    accounts,
    byId: accountsById,
    balances,
    reservationsByAccount,
  } = useAccounts();

  const [mode, setMode] = useState<Mode>({ kind: "closed" });
  const [pendingDelete, setPendingDelete] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState(false);

  function close() {
    setMode({ kind: "closed" });
  }

  async function handleGoalSubmit(input: NewGoal) {
    if (mode.kind === "edit") {
      await updateGoal(mode.goal.id, input);
    } else {
      await addGoal(input);
    }
    close();
  }

  async function handleContributionSubmit(input: NewGoalContribution) {
    await addContribution(input);
    close();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await removeGoal(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  const modalTitle =
    mode.kind === "create"
      ? t("New goal")
      : mode.kind === "edit"
        ? t("Edit goal")
        : mode.kind === "contribute"
          ? t("Contribute to {name}", { name: mode.goal.name })
          : mode.kind === "withdraw"
            ? t("Withdraw from {name}", { name: mode.goal.name })
            : "";

  const totalsByCurrency = useMemo(() => {
    const map: Record<string, { saved: number; target: number }> = {};
    for (const g of goals) {
      const contribs = contributionsByGoal[g.id] ?? [];
      const saved =
        g.initialAmount + contribs.reduce((s, c) => s + c.amount, 0);
      if (!map[g.currency]) map[g.currency] = { saved: 0, target: 0 };
      map[g.currency].saved += saved;
      map[g.currency].target += g.targetAmount;
    }
    return Object.entries(map)
      .map(([currency, sums]) => ({
        currency,
        saved: sums.saved,
        target: sums.target,
        percent: sums.target > 0 ? Math.min(sums.saved / sums.target, 1) : 0,
      }))
      .sort((a, b) => b.target - a.target);
  }, [goals, contributionsByGoal]);

  return (
    <div className="flex flex-col gap-6">
      <RouteMasthead
        kicker={t("Plan")}
        title={t("Saving goals")}
        actions={
          <Button size="md" onClick={() => setMode({ kind: "create" })}>
            {t("+ Add")}
          </Button>
        }
      />

      {loading ? (
        <RowSkeleton count={3} />
      ) : (
        <>
          {goals.length > 0 && (
            <section
              className="flex flex-col"
              aria-label={t("Total saved across goals")}
            >
              <div className="section-head">
                <span className="section-head-title">{t("Total saved")}</span>
                <span className="section-head-meta">
                  {tn("{count} goal", "{count} goals", goals.length)}
                  {" · "}
                  {tn("{count} currency", "{count} currencies", totalsByCurrency.length)}
                </span>
              </div>
              <div className="rooms">
                {totalsByCurrency.map((row) => (
                  <div key={row.currency} className="px-4 py-3 flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
                        <Amount
                          value={row.saved}
                          tone="neutral"
                          size="lg"
                          currency={row.currency}
                          className="font-serif"
                        />
                        <span className="text-[11px] text-fg-muted uppercase tracking-[0.14em]">
                          {t("of {amount}", { amount: formatCurrency(row.target, row.currency) })}
                        </span>
                      </div>
                      <span className="figure text-xs text-fg-muted shrink-0">
                        {Math.round(row.percent * 100)}%
                      </span>
                    </div>
                    <ProgressBar
                      value={row.percent}
                      tone="accent"
                      ariaLabel={t("{currency} saved progress", { currency: row.currency })}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col" aria-label={t("Goals")}>
            <div className="section-head">
              <span className="section-head-title">{t("Goals")}</span>
              <span className="section-head-meta">{t("Saving toward")}</span>
            </div>
            <GoalList
              goals={goals}
              contributionsByGoal={contributionsByGoal}
              monthlyRate={monthlyRate}
              onContribute={(goal) => setMode({ kind: "contribute", goal })}
              onWithdraw={(goal) => setMode({ kind: "withdraw", goal })}
              onDeleteContribution={removeContribution}
              onEdit={(goal) => setMode({ kind: "edit", goal })}
              onDelete={(goal) => setPendingDelete(goal)}
              emptyTitle={t("No goals yet.")}
              emptyDescription={t("Name something you're saving for and Perch will track your monthly pace toward it.")}
              emptyActionLabel={t("Create a goal")}
              emptyActionOnClick={() => setMode({ kind: "create" })}
            />
          </section>
        </>
      )}

      <Modal open={mode.kind !== "closed"} onClose={close} title={modalTitle}>
        {mode.kind === "contribute" ? (
          <ContributionForm
            goalId={mode.goal.id}
            goalCurrency={mode.goal.currency}
            accounts={accounts}
            balances={balances}
            reservationsByAccount={reservationsByAccount}
            onSubmit={handleContributionSubmit}
            onCancel={close}
          />
        ) : mode.kind === "withdraw" ? (
          <GoalWithdrawalForm
            goal={mode.goal}
            contributions={contributionsByGoal[mode.goal.id] ?? []}
            accountsById={accountsById}
            onSubmit={handleContributionSubmit}
            onCancel={close}
          />
        ) : mode.kind === "closed" ? null : (
          <GoalForm
            initial={mode.kind === "edit" ? mode.goal : undefined}
            onSubmit={handleGoalSubmit}
            onCancel={close}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t("Delete goal?")}
        message={
          pendingDelete && (
            <>
              {t("This deletes")}{" "}
              <span className="text-fg font-medium">
                “{pendingDelete.name}”
              </span>{" "}
              {t("and all of its contributions. You can restore it from Recently deleted for 30 days.")}
            </>
          )
        }
        confirmLabel={t("Delete")}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
        submitting={deleting}
      />
    </div>
  );
}
