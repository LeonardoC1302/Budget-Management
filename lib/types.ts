export type TransactionType = "income" | "expense" | "transfer" | "investment";

// Permission an OwnerCtx grants. "owner" is the signed-in user acting on their
// own data; "read" and "write" describe grants received through a connection.
export type OwnerPermission = "owner" | "read" | "write";

// Attached to items after they're read via `listAcrossOwners`. Never persisted
// — stores strip it on writes. When absent on legacy call sites, mutations
// default to the signed-in user's own subtree (backwards-compatible).
export interface OwnerCtx {
  uid: string;
  nickname: string;
  permission: OwnerPermission;
}

// FX rate applied to a transaction or transfer. `bccr` means the user picked a
// Costa Rican bank's window rate (compra when the bank is buying USD, venta
// when it's selling). `fallback` means BCCR was unreachable and the app used
// the generic open.er-api.com mid-market rate — the transaction still records
// which source was used so history is traceable.
export type RateSource =
  | {
      provider: "bccr";
      entityId: string;
      entityName: string;
      rate: number;
      side: "compra" | "venta";
      snapshotAt: string;
    }
  | { provider: "fallback"; rate: number };

export type EntryType = Exclude<TransactionType, "transfer">;

export type TransferDirection = "out" | "in";

export type AccountType = "debit" | "credit" | "wallet" | "cash" | "savings";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  initialBalanceUSD: number;
  currency: string;
  createdAt: string;
  // Credit-card only. Both required together to enable statement math.
  cutDay?: number;
  paymentDay?: number;
  creditLimit?: number;
  creditLimitUSD?: number;
  _owner?: OwnerCtx;
}

export type NewAccount = Omit<
  Account,
  "id" | "createdAt" | "initialBalanceUSD" | "creditLimitUSD"
>;

export interface Category {
  id: string;
  name: string;
  type: EntryType;
  isDefault: boolean;
  createdAt: string;
  _owner?: OwnerCtx;
}

export type NewCategory = Omit<Category, "id" | "createdAt" | "isDefault">;

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  amountUSD: number;
  // Amount converted to the transaction's *account* currency at creation-time
  // FX. Enables e.g. a CRC purchase on a USD card without corrupting the
  // card's balance/statement math. Missing on legacy docs — fall back to
  // `amount` (safe when the transaction currency matches the account).
  accountAmount?: number;
  currency: string;
  accountId: string;
  categoryId: string;
  description: string;
  date: string;
  createdAt: string;
  transferId?: string;
  transferDirection?: TransferDirection;
  linkedAccountId?: string;
  // Fixed commission charged by the source entity on a transfer, in the
  // transfer's currency. Stored on both paired legs; the destination leg's
  // `amount` is already net of it.
  fee?: number;
  recurringId?: string;
  // Set on both paired docs of a credit-card payment transfer.
  paymentForAccountId?: string;
  // Card-payment only. IDs of the specific card charges this payment covered,
  // so the pay-card form can exclude them from the selectable list next time.
  paidChargeIds?: string[];
  // Investment-only. Set when the contribution is bound to a Holding.
  holdingId?: string;
  sharesDelta?: number;
  unitPriceUSD?: number;
  // True when the contribution predates auto-pricing (migrated from a legacy
  // investment category) and has no shares/price on file yet.
  unpriced?: boolean;
  rateSource?: RateSource;
  _owner?: OwnerCtx;
}

export type NewTransaction = Omit<
  Transaction,
  "id" | "createdAt" | "amountUSD" | "accountAmount"
>;

export type RecurrenceFrequency =
  | "monthly"
  | "semi-monthly"
  | "weekly"
  | "biweekly"
  | "yearly";

export interface RecurringTransaction {
  id: string;
  type: EntryType;
  amount: number;
  currency: string;
  accountId: string;
  categoryId: string;
  description: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  semiMonthlyDays?: [number, number];
  endDate?: string;
  lastGeneratedDate?: string;
  active: boolean;
  createdAt: string;
  // BCCR bank pick consulted at materialization time when currency differs
  // from the account's. Only used for USD↔CRC; other pairs fall through to
  // open.er-api.com. The rate itself is fetched each run, not stored here.
  rateBccrEntity?: { id: string; name: string };
  _owner?: OwnerCtx;
}

export type NewRecurringTransaction = Omit<
  RecurringTransaction,
  "id" | "createdAt" | "lastGeneratedDate"
>;

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  monthly: "Monthly",
  "semi-monthly": "Semi-monthly (two days)",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  yearly: "Yearly",
};

export interface NewTransfer {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  description: string;
  date: string;
  paymentForAccountId?: string;
  paidChargeIds?: string[];
  // Overrides the destination-side amount. Used for card payments where the
  // bank charges the source account more than what actually pays down the card
  // (e.g. FX spread or fees). Falls back to `amount * fx(fromCurrency,toCurrency)`.
  toAmount?: number;
  // Fixed commission charged by the source entity, in `fromCurrency`. Only
  // applied when `fromCurrency === toCurrency` — destination leg is credited
  // `amount - fee`. Distinct from `toAmount` (which models FX spread).
  fee?: number;
  rateSource?: RateSource;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  initialAmount: number;
  currency: string;
  targetDate?: string;
  createdAt: string;
  _owner?: OwnerCtx;
}

export type NewGoal = Omit<Goal, "id" | "createdAt">;

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  note?: string;
  date: string;
  createdAt: string;
  // Optional to preserve legacy contributions written before goals earmarked
  // money from a specific account. New contributions require it.
  accountId?: string;
  _owner?: OwnerCtx;
}

export type NewGoalContribution = Omit<GoalContribution, "id" | "createdAt">;

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  currency: string;
  createdAt: string;
  _owner?: OwnerCtx;
}

export type NewBudget = Omit<Budget, "id" | "createdAt">;

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  debit: "Debit",
  credit: "Credit",
  wallet: "Digital wallet",
  cash: "Cash",
  savings: "Savings",
};

export type HoldingKind = "market" | "manual";

export interface Holding {
  id: string;
  kind: HoldingKind;
  name: string;
  // Required when kind === "market". Twelve Data ticker (e.g. "SPY", "BTC/USD").
  symbol?: string;
  // Native quote currency of the instrument. USD for most; e.g. "EUR" for IWDA.AS.
  quoteCurrency?: string;
  provider?: "twelvedata";
  // Manual-only. Seed cost basis for money invested before tracking began.
  // Not a transaction — never debits a cash account — and not a valuation —
  // never counted as current value. Just widens the denominator so later
  // contributions and valuations compute gain against the real total invested.
  initialCostUSD?: number;
  createdAt: string;
  _owner?: OwnerCtx;
}

export type NewHolding = Omit<Holding, "id" | "createdAt">;

export interface HoldingValuation {
  id: string;
  holdingId: string;
  valueUSD: number;
  asOfDate: string;
  note?: string;
  createdAt: string;
  _owner?: OwnerCtx;
}

export type NewHoldingValuation = Omit<HoldingValuation, "id" | "createdAt">;
