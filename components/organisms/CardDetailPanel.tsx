"use client";

import Amount from "@/components/atoms/Amount";
import Button from "@/components/atoms/Button";
import CategoryChip from "@/components/atoms/CategoryChip";
import ProgressBar from "@/components/atoms/ProgressBar";
import { DeleteIcon, EditIcon } from "@/lib/action/icons";
import type {
  CardHistory,
  CardTotals,
  PriorStatement,
} from "@/lib/credit/statement";
import { effectiveDue } from "@/lib/credit/statement";
import type { Account, Category } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";

interface CardDetailPanelProps {
  card: Account;
  totals?: CardTotals;
  history?: CardHistory;
  accountsById: Record<string, Account | undefined>;
  categoriesById: Record<string, Category | undefined>;
  transactionCount: number;
  onEdit: (card: Account) => void;
  onDelete: (card: Account) => void;
  onPay: (card: Account) => void;
}

function isoFromDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatISOShort(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return formatShortDate(
    new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])),
  );
}

function daysCopy(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "1 day late";
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days late`;
}

export default function CardDetailPanel({
  card,
  totals,
  history,
  accountsById,
  categoriesById,
  transactionCount,
  onEdit,
  onDelete,
  onPay,
}: CardDetailPanelProps) {
  const canDelete = transactionCount === 0;

  if (!totals) {
    return (
      <section className="surface p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-fg truncate">{card.name}</p>
            <p className="text-xs text-fg-subtle">{card.currency} · Card</p>
          </div>
          <RowActions
            card={card}
            canDelete={canDelete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
        <p className="text-sm text-fg-muted">
          Add cut and payment days to see what&apos;s due.
        </p>
        <Button variant="secondary" size="sm" onClick={() => onEdit(card)} className="self-start">
          Add statement schedule
        </Button>
      </section>
    );
  }

  const due = effectiveDue(totals);
  const owed = totals.owed;
  const utilization = totals.utilization;
  const currentByCategory = history?.currentCycleByCategory ?? {};
  const categoryEntries = Object.entries(currentByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const chargedThisCycle = Object.values(currentByCategory).reduce((a, b) => a + b, 0);
  // Net of any payments that already covered next-cycle purchases,
  // so the tile agrees with the hero "You owe" figure.
  const netUnbilled = Math.max(0, totals.unbilledPurchases - totals.paymentsBeforeCutBacklog);
  const advancePayments = Math.min(
    totals.paymentsBeforeCutBacklog,
    totals.unbilledPurchases,
  );

  return (
    <section className="surface p-5 flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-fg truncate">{card.name}</p>
          <p className="text-xs text-fg-subtle">
            {card.currency} · Cut on day {card.cutDay} · Pay on day {card.paymentDay}
          </p>
        </div>
        <RowActions
          card={card}
          canDelete={canDelete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </header>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.08em] text-fg-subtle">
            You owe
          </p>
          <Amount
            value={owed}
            tone={owed > 0 ? "expense" : "neutral"}
            size="xl"
            currency={card.currency}
          />
        </div>
        <Button
          variant={owed > 0 ? "primary" : "secondary"}
          size="md"
          onClick={() => onPay(card)}
          disabled={owed === 0}
        >
          Pay card
        </Button>
      </div>

      {due.kind === "due" && (
        <p
          className={
            due.daysUntil <= 3 ? "text-sm text-expense" : "text-sm text-fg-muted"
          }
        >
          Pay{" "}
          <span className="text-fg font-medium">
            {formatCurrency(due.amount, card.currency)}
          </span>{" "}
          by {formatLongDate(due.date)} · {daysCopy(due.daysUntil)}
        </p>
      )}
      {due.kind === "next" && (
        <p className="text-sm text-fg-subtle">
          Nothing due yet — next statement due{" "}
          <span className="text-fg-muted">{formatLongDate(due.date)}</span>.
        </p>
      )}
      {due.kind === "none" && (
        <p className="text-sm text-fg-subtle">Nothing due — you&apos;re clear.</p>
      )}

      {typeof utilization === "number" && typeof card.creditLimit === "number" && (
        <div className="flex flex-col gap-1.5">
          <ProgressBar
            value={utilization}
            tone={utilization >= 0.9 ? "expense" : "accent"}
            ariaLabel={`${Math.round(utilization * 100)}% of credit limit used`}
          />
          <p className="text-xs text-fg-subtle flex items-center justify-between">
            <span>{Math.round(utilization * 100)}% of limit used</span>
            <span>
              {formatCurrency(
                totals.availableCredit ?? card.creditLimit,
                card.currency,
              )}{" "}
              available
            </span>
          </p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
        <MetricRow
          label="Statement due"
          value={
            totals.statementDue > 0
              ? formatCurrency(totals.statementDue, card.currency)
              : "—"
          }
          subline={
            totals.statementDue > 0
              ? `by ${formatLongDate(totals.cycle.currentStatementDueDate)}`
              : undefined
          }
        />
        <MetricRow
          label="Unbilled (next cycle)"
          value={
            netUnbilled > 0
              ? formatCurrency(netUnbilled, card.currency)
              : "—"
          }
          subline={
            netUnbilled > 0
              ? `closes ${formatLongDate(totals.cycle.nextCutDate)}`
              : advancePayments > 0
                ? `${formatCurrency(advancePayments, card.currency)} paid in advance`
                : undefined
          }
        />
        <MetricRow
          label="Last cut"
          value={formatLongDate(totals.cycle.lastCutDate)}
        />
        <MetricRow
          label="Next cut"
          value={formatLongDate(totals.cycle.nextCutDate)}
        />
        {history && history.observedCycleCount > 0 && (
          <>
            <MetricRow
              label="Avg per cycle"
              value={formatCurrency(history.avgMonthlyCharges, card.currency)}
              subline={`across ${history.observedCycleCount} cycle${history.observedCycleCount === 1 ? "" : "s"}`}
            />
            <MetricRow
              label="Peak cycle"
              value={formatCurrency(history.peakCycleCharges, card.currency)}
            />
          </>
        )}
      </dl>

      {categoryEntries.length > 0 && (
        <Group title="Charges this cycle">
          <ul className="flex flex-col divide-y divide-border">
            {categoryEntries.map(([catId, amt]) => (
              <li
                key={catId || "uncategorized"}
                className="flex items-center gap-3 py-2"
              >
                <CategoryChip
                  name={categoriesById[catId]?.name ?? "Uncategorized"}
                  tone="expense"
                  size="sm"
                />
                <span className="text-sm text-fg flex-1 truncate">
                  {categoriesById[catId]?.name ?? "Uncategorized"}
                </span>
                <span className="text-sm tabular-nums text-fg-muted">
                  {formatCurrency(amt, card.currency)}
                </span>
              </li>
            ))}
          </ul>
          {advancePayments > 0 && (
            <p className="text-[11px] text-fg-subtle">
              {formatCurrency(chargedThisCycle, card.currency)} charged ·{" "}
              {formatCurrency(advancePayments, card.currency)} already paid.
            </p>
          )}
        </Group>
      )}

      {history && history.recentCharges.length > 0 && (
        <Group title="Recent charges">
          <ul className="flex flex-col divide-y divide-border">
            {history.recentCharges.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-fg truncate">
                    {c.description ||
                      categoriesById[c.categoryId]?.name ||
                      "Charge"}
                  </p>
                  <p className="text-xs text-fg-subtle">
                    {categoriesById[c.categoryId]?.name ?? "—"} ·{" "}
                    {formatISOShort(c.date)}
                  </p>
                </div>
                <Amount
                  value={c.amount}
                  tone="expense"
                  size="sm"
                  currency={c.currency}
                />
              </li>
            ))}
          </ul>
        </Group>
      )}

      {history && history.paymentHistory.length > 0 && (
        <Group title="Recent payments">
          <ul className="flex flex-col divide-y divide-border">
            {history.paymentHistory.map((p) => {
              const source = p.sourceAccountId
                ? accountsById[p.sourceAccountId]
                : undefined;
              return (
                <li key={p.id} className="flex items-center gap-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-fg truncate">
                      {p.description || "Card payment"}
                    </p>
                    <p className="text-xs text-fg-subtle">
                      {source ? `from ${source.name} · ` : ""}
                      {formatISOShort(p.date)}
                    </p>
                  </div>
                  <Amount
                    value={p.amount}
                    tone="income"
                    size="sm"
                    currency={p.currency}
                  />
                </li>
              );
            })}
          </ul>
        </Group>
      )}

      {history && history.priorStatements.length > 0 && (
        <Group title="Prior statements">
          <ul className="flex flex-col divide-y divide-border">
            {history.priorStatements.map((s) => (
              <PriorStatementRow key={isoFromDate(s.cutDate)} statement={s} currency={card.currency} />
            ))}
          </ul>
        </Group>
      )}
    </section>
  );
}

function MetricRow({
  label,
  value,
  subline,
}: {
  label: string;
  value: string;
  subline?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] uppercase tracking-[0.06em] text-fg-subtle">
        {label}
      </dt>
      <dd className="text-sm text-fg tabular-nums">{value}</dd>
      {subline && <dd className="text-[11px] text-fg-subtle">{subline}</dd>}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="label-sm">{title}</p>
      {children}
    </div>
  );
}

function PriorStatementRow({
  statement,
  currency,
}: {
  statement: PriorStatement;
  currency: string;
}) {
  const remaining = Math.max(0, statement.charges - statement.paidByDue);
  const label =
    remaining === 0 && statement.charges > 0
      ? "Paid in full"
      : statement.paidByDue === 0
        ? "Unpaid"
        : `${formatCurrency(remaining, currency)} unpaid`;
  const labelTone =
    remaining === 0 && statement.charges > 0
      ? "text-income"
      : statement.paidByDue === 0 && statement.charges > 0
        ? "text-expense"
        : "text-fg-muted";
  return (
    <li className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-fg">
          Statement {formatShortDate(statement.cutDate)}
        </p>
        <p className={`text-xs ${labelTone}`}>{label}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-fg tabular-nums">
          {formatCurrency(statement.charges, currency)}
        </p>
        <p className="text-[11px] text-fg-subtle">
          due {formatShortDate(statement.dueDate)}
        </p>
      </div>
    </li>
  );
}

function RowActions({
  card,
  canDelete,
  onEdit,
  onDelete,
}: {
  card: Account;
  canDelete: boolean;
  onEdit: (c: Account) => void;
  onDelete: (c: Account) => void;
}) {
  return (
    <div className="flex gap-1 shrink-0">
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Edit ${card.name}`}
        onClick={() => onEdit(card)}
        className="px-2"
      >
        <EditIcon aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Delete ${card.name}`}
        onClick={() => onDelete(card)}
        disabled={!canDelete}
        title={
          canDelete
            ? "Delete card"
            : "Delete or reassign this card's transactions first"
        }
        className="px-2"
      >
        <DeleteIcon aria-hidden />
      </Button>
    </div>
  );
}
