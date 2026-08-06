import type { Account, Transaction } from "@/lib/types";

export interface CardCycle {
  lastCutDate: Date;
  previousCutDate: Date;
  nextCutDate: Date;
  currentStatementDueDate: Date;
  nextStatementDueDate: Date;
  daysUntilCurrentDue: number;
}

export interface CardTotals {
  cycle: CardCycle;
  owed: number;
  statementSnapshot: number;
  paymentsSinceCut: number;
  statementDue: number;
  unbilledPurchases: number;
  paymentsBeforeCutBacklog: number;
  /** owed + advance payments that have already been absorbed by unbilled charges.
   *  Represents "how much of the credit line this cycle has actually taken", so
   *  utilization and available credit don't rebound just because the user pre-paid. */
  committed: number;
  availableCredit?: number;
  utilization?: number;
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function clampDayToMonth(
  year: number,
  monthIndex: number,
  day: number,
): number {
  return Math.min(day, daysInMonth(year, monthIndex));
}

function atLocalMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function cutDateAt(year: number, monthIndex: number, cutDay: number): Date {
  return new Date(year, monthIndex, clampDayToMonth(year, monthIndex, cutDay));
}

// Payment for a given cut lands the same month when paymentDay > cutDay,
// otherwise the following month. Matches BAC & most LatAm bank cycles.
function paymentDateForCut(cutDate: Date, cutDay: number, paymentDay: number): Date {
  const sameMonth = paymentDay > cutDay;
  const y = cutDate.getFullYear();
  const m = cutDate.getMonth() + (sameMonth ? 0 : 1);
  const normalizedYear = y + Math.floor(m / 12);
  const normalizedMonth = ((m % 12) + 12) % 12;
  return new Date(
    normalizedYear,
    normalizedMonth,
    clampDayToMonth(normalizedYear, normalizedMonth, paymentDay),
  );
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function diffDays(from: Date, to: Date): number {
  return Math.round((atLocalMidnight(to).getTime() - atLocalMidnight(from).getTime()) / MS_PER_DAY);
}

export function computeCardCycle(
  cutDay: number,
  paymentDay: number,
  today: Date,
): CardCycle {
  const t = atLocalMidnight(today);
  const y = t.getFullYear();
  const m = t.getMonth();

  const cutThisMonth = cutDateAt(y, m, cutDay);
  const cutLastMonth = cutDateAt(y, m - 1, cutDay);
  const cutNextMonth = cutDateAt(y, m + 1, cutDay);

  let lastCutDate: Date;
  let nextCutDate: Date;
  let previousCutDate: Date;
  if (t.getTime() >= cutThisMonth.getTime()) {
    lastCutDate = cutThisMonth;
    nextCutDate = cutNextMonth;
    previousCutDate = cutLastMonth;
  } else {
    lastCutDate = cutLastMonth;
    nextCutDate = cutThisMonth;
    previousCutDate = cutDateAt(y, m - 2, cutDay);
  }

  const currentStatementDueDate = paymentDateForCut(lastCutDate, cutDay, paymentDay);
  const nextStatementDueDate = paymentDateForCut(nextCutDate, cutDay, paymentDay);
  const daysUntilCurrentDue = diffDays(t, currentStatementDueDate);

  return {
    lastCutDate,
    previousCutDate,
    nextCutDate,
    currentStatementDueDate,
    nextStatementDueDate,
    daysUntilCurrentDue,
  };
}

function parseISODate(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return new Date(iso);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function accountDelta(t: Transaction, accountId: string): number {
  if (t.accountId !== accountId) return 0;
  if (t.type === "income") return t.amount;
  if (t.type === "expense" || t.type === "investment") return -t.amount;
  if (t.type === "transfer") return t.transferDirection === "in" ? t.amount : -t.amount;
  return 0;
}

export function computeCardTotals(
  account: Account,
  transactions: Transaction[],
  today: Date = new Date(),
): CardTotals | null {
  if (
    typeof account.cutDay !== "number" ||
    typeof account.paymentDay !== "number"
  ) {
    return null;
  }

  const cycle = computeCardCycle(account.cutDay, account.paymentDay, today);
  const lastCut = cycle.lastCutDate;

  let runningBalance = account.initialBalance;
  let balanceAtCut = account.initialBalance;
  let paymentsSinceCut = 0;
  let unbilledPurchases = 0;
  let paymentsBeforeCutBacklog = 0;

  for (const t of transactions) {
    if (t.accountId !== account.id) continue;
    const delta = accountDelta(t, account.id);
    runningBalance += delta;

    const txDate = parseISODate(t.date);
    const beforeOrOnCut = txDate.getTime() <= lastCut.getTime();
    if (beforeOrOnCut) {
      balanceAtCut += delta;
    } else if (t.type === "transfer" && t.transferDirection === "in") {
      paymentsSinceCut += t.amount;
    } else if (t.type === "expense" || t.type === "investment") {
      unbilledPurchases += t.amount;
    }
  }

  const owed = Math.max(0, -runningBalance);
  const statementSnapshot = Math.max(0, -balanceAtCut);
  const statementDue = Math.max(0, statementSnapshot - paymentsSinceCut);
  paymentsBeforeCutBacklog = Math.max(0, paymentsSinceCut - statementSnapshot);
  const committed = owed + paymentsBeforeCutBacklog;

  const totals: CardTotals = {
    cycle,
    owed,
    statementSnapshot,
    paymentsSinceCut,
    statementDue,
    unbilledPurchases,
    paymentsBeforeCutBacklog,
    committed,
  };

  if (typeof account.creditLimit === "number" && account.creditLimit > 0) {
    totals.availableCredit = Math.max(0, account.creditLimit - committed);
    totals.utilization = Math.min(1, committed / account.creditLimit);
  }

  return totals;
}

export type EffectiveDue =
  | { kind: "due"; date: Date; amount: number; daysUntil: number }
  | { kind: "next"; date: Date; amount: number; daysUntil: number }
  | { kind: "none" };

export function effectiveDue(totals: CardTotals, today: Date = new Date()): EffectiveDue {
  if (totals.statementDue > 0) {
    return {
      kind: "due",
      date: totals.cycle.currentStatementDueDate,
      amount: totals.statementDue,
      daysUntil: totals.cycle.daysUntilCurrentDue,
    };
  }
  if (totals.unbilledPurchases - totals.paymentsBeforeCutBacklog > 0) {
    const daysUntil = Math.round(
      (atLocalMidnight(totals.cycle.nextStatementDueDate).getTime() -
        atLocalMidnight(today).getTime()) /
        MS_PER_DAY,
    );
    return {
      kind: "next",
      date: totals.cycle.nextStatementDueDate,
      amount: Math.max(0, totals.unbilledPurchases - totals.paymentsBeforeCutBacklog),
      daysUntil,
    };
  }
  return { kind: "none" };
}

export interface PriorStatement {
  cutDate: Date;
  dueDate: Date;
  charges: number;
  paidByDue: number;
}

export interface CardPayment {
  id: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  sourceAccountId?: string;
}

export interface CardCharge {
  id: string;
  date: string;
  amount: number;
  currency: string;
  categoryId: string;
  description: string;
}

export interface CardHistory {
  priorStatements: PriorStatement[];
  paymentHistory: CardPayment[];
  recentCharges: CardCharge[];
  currentCycleByCategory: Record<string, number>;
  avgMonthlyCharges: number;
  peakCycleCharges: number;
  observedCycleCount: number;
}

export interface CardHistoryOptions {
  statementCount?: number;
  chargeCount?: number;
  paymentCount?: number;
  maxCyclesLookback?: number;
}

export function computeCardHistory(
  account: Account,
  transactions: Transaction[],
  today: Date = new Date(),
  options: CardHistoryOptions = {},
): CardHistory | null {
  if (
    typeof account.cutDay !== "number" ||
    typeof account.paymentDay !== "number"
  ) {
    return null;
  }
  const cutDay = account.cutDay;
  const paymentDay = account.paymentDay;
  const {
    statementCount = 6,
    chargeCount = 8,
    paymentCount = 5,
    maxCyclesLookback = 24,
  } = options;

  const cycle = computeCardCycle(cutDay, paymentDay, today);
  const cardTxs = transactions
    .filter((t) => t.accountId === account.id)
    .map((t) => ({ tx: t, dt: parseISODate(t.date) }));

  const lastCutMs = cycle.lastCutDate.getTime();

  const recentCharges: CardCharge[] = cardTxs
    .filter(
      ({ tx, dt }) =>
        (tx.type === "expense" || tx.type === "investment") &&
        dt.getTime() > lastCutMs,
    )
    .sort((a, b) => b.dt.getTime() - a.dt.getTime())
    .slice(0, chargeCount)
    .map(({ tx }) => ({
      id: tx.id,
      date: tx.date,
      amount: tx.amount,
      currency: tx.currency,
      categoryId: tx.categoryId,
      description: tx.description,
    }));

  const paymentHistory: CardPayment[] = cardTxs
    .filter(
      ({ tx }) => tx.type === "transfer" && tx.transferDirection === "in",
    )
    .sort((a, b) => b.dt.getTime() - a.dt.getTime())
    .slice(0, paymentCount)
    .map(({ tx }) => ({
      id: tx.id,
      date: tx.date,
      amount: tx.amount,
      currency: tx.currency,
      description: tx.description,
      sourceAccountId: tx.linkedAccountId,
    }));

  const currentCycleByCategory: Record<string, number> = {};
  for (const { tx, dt } of cardTxs) {
    if (
      (tx.type === "expense" || tx.type === "investment") &&
      dt.getTime() > lastCutMs
    ) {
      currentCycleByCategory[tx.categoryId] =
        (currentCycleByCategory[tx.categoryId] ?? 0) + tx.amount;
    }
  }

  const priorStatements: PriorStatement[] = [];
  let cursor = cycle.lastCutDate;
  for (let i = 0; i < statementCount; i++) {
    const prev = cutDateAt(
      cursor.getFullYear(),
      cursor.getMonth() - 1,
      cutDay,
    );
    const dueDate = paymentDateForCut(cursor, cutDay, paymentDay);
    let charges = 0;
    let paidByDue = 0;
    for (const { tx, dt } of cardTxs) {
      const t = dt.getTime();
      if (t > prev.getTime() && t <= cursor.getTime()) {
        if (tx.type === "expense" || tx.type === "investment") {
          charges += tx.amount;
        }
      }
      if (t > cursor.getTime() && t <= dueDate.getTime()) {
        if (tx.type === "transfer" && tx.transferDirection === "in") {
          paidByDue += tx.amount;
        }
      }
    }
    priorStatements.push({ cutDate: cursor, dueDate, charges, paidByDue });
    cursor = prev;
  }

  let earliest = Infinity;
  for (const { dt } of cardTxs) {
    const t = dt.getTime();
    if (t < earliest) earliest = t;
  }

  const cycleCharges: number[] = [];
  let ccursor = cycle.lastCutDate;
  for (let i = 0; i < maxCyclesLookback; i++) {
    const prev = cutDateAt(
      ccursor.getFullYear(),
      ccursor.getMonth() - 1,
      cutDay,
    );
    if (earliest !== Infinity && prev.getTime() < earliest) break;
    let sum = 0;
    for (const { tx, dt } of cardTxs) {
      const t = dt.getTime();
      if (
        t > prev.getTime() &&
        t <= ccursor.getTime() &&
        (tx.type === "expense" || tx.type === "investment")
      ) {
        sum += tx.amount;
      }
    }
    cycleCharges.push(sum);
    ccursor = prev;
  }
  const activeCycles = cycleCharges.filter((c) => c > 0);
  const avgMonthlyCharges =
    activeCycles.length > 0
      ? activeCycles.reduce((a, b) => a + b, 0) / activeCycles.length
      : 0;
  const peakCycleCharges = cycleCharges.reduce((a, b) => Math.max(a, b), 0);

  return {
    priorStatements: priorStatements.filter(
      (s) => s.charges > 0 || s.paidByDue > 0,
    ),
    paymentHistory,
    recentCharges,
    currentCycleByCategory,
    avgMonthlyCharges,
    peakCycleCharges,
    observedCycleCount: activeCycles.length,
  };
}
