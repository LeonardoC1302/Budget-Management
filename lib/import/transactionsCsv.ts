import {
  guessDateFormat,
  parseAmount,
  parseDate,
  type DateFormat,
} from "@/lib/utils/csv";
import { normalizeTag } from "@/lib/utils/tags";
import { SUPPORTED_CURRENCIES } from "@/lib/utils/currencies";
import type {
  Account,
  Category,
  EntryType,
  NewTransaction,
  Transaction,
} from "@/lib/types";

export type ColumnKey =
  | "date"
  | "amount"
  | "debit"
  | "credit"
  | "type"
  | "description"
  | "category"
  | "account"
  | "currency"
  | "tags";

export type ColumnMap = Record<ColumnKey, number>;

// Header synonyms, lowercase and accent-free. Covers PerchCR's own export plus
// the usual English and Spanish bank/spreadsheet headers.
const SYNONYMS: Record<ColumnKey, string[]> = {
  date: ["date", "fecha", "fecha de transaccion", "fecha contable", "posted", "transaction date"],
  amount: ["amount", "monto", "importe", "valor", "total"],
  debit: ["debit", "debito", "cargo", "cargos", "withdrawal", "retiro", "salida"],
  credit: ["credit", "credito", "abono", "abonos", "deposit", "deposito", "entrada"],
  type: ["type", "tipo", "kind"],
  description: ["description", "descripcion", "detalle", "concepto", "memo", "note", "nota", "payee", "comercio"],
  category: ["category", "categoria"],
  account: ["account", "cuenta"],
  currency: ["currency", "moneda", "divisa"],
  tags: ["tags", "etiquetas", "tag"],
};

function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function detectColumns(header: string[]): ColumnMap {
  const folded = header.map(fold);
  const map = {} as ColumnMap;
  const taken = new Set<number>();
  for (const key of Object.keys(SYNONYMS) as ColumnKey[]) {
    const idx = folded.findIndex(
      (h, i) => !taken.has(i) && SYNONYMS[key].includes(h),
    );
    map[key] = idx;
    if (idx >= 0) taken.add(idx);
  }
  return map;
}

export type RowStatus =
  | { kind: "ready" }
  | { kind: "duplicate" }
  | { kind: "skipped"; reason: string };

export interface PlannedRow {
  line: number;
  input: NewTransaction | null;
  status: RowStatus;
  // For the preview only.
  accountName?: string;
  categoryName?: string;
}

export interface ImportOptions {
  columns: ColumnMap;
  dateFormat: DateFormat;
  defaultAccountId: string;
  fallbackCategory: Record<EntryType, string>;
}

function typeFrom(raw: string): EntryType | "transfer" | "investment" | null {
  const v = fold(raw);
  if (["income", "ingreso", "ingresos", "credit", "credito", "abono"].includes(v)) return "income";
  if (["expense", "gasto", "gastos", "debit", "debito", "cargo"].includes(v)) return "expense";
  // PerchCR's own export writes "transfer-out" / "transfer-in".
  if (v.startsWith("transfer")) return "transfer";
  if (["investment", "inversion"].includes(v)) return "investment";
  return null;
}

/** Key used to spot a row that's already in the ledger. */
export function duplicateKey(t: {
  date: string;
  accountId: string;
  amount: number;
  currency: string;
  description: string;
}): string {
  return [
    t.date,
    t.accountId,
    t.amount.toFixed(2),
    t.currency,
    fold(t.description),
  ].join("|");
}

export function guessDateFormatFor(rows: string[][], columns: ColumnMap): DateFormat {
  if (columns.date < 0) return "ymd";
  return guessDateFormat(rows.slice(0, 50).map((r) => r[columns.date] ?? ""));
}

export function planImport(
  rows: string[][],
  options: ImportOptions,
  accounts: Account[],
  categories: Category[],
  existing: Transaction[],
): PlannedRow[] {
  const { columns } = options;
  const cell = (r: string[], key: ColumnKey) =>
    columns[key] >= 0 ? (r[columns[key]] ?? "").trim() : "";

  const accountByName = new Map(accounts.map((a) => [fold(a.name), a]));
  const categoryByKey = new Map(
    categories.map((c) => [`${c.type}:${fold(c.name)}`, c]),
  );
  const knownCurrencies = new Set(SUPPORTED_CURRENCIES.map((c) => c.code));

  const seen = new Set(
    existing
      .filter((t) => t.type === "income" || t.type === "expense")
      .map((t) => duplicateKey(t)),
  );

  return rows.map((r, i): PlannedRow => {
    const line = i + 2; // 1-based, after the header row
    const skip = (reason: string): PlannedRow => ({
      line,
      input: null,
      status: { kind: "skipped", reason },
    });

    const date = parseDate(cell(r, "date"), options.dateFormat);
    if (!date) return skip("Unreadable date");

    let amount: number | null = null;
    let type: EntryType | null = null;
    const typeCell = cell(r, "type");
    const declared = typeCell ? typeFrom(typeCell) : null;
    if (declared === "transfer" || declared === "investment") {
      return skip(
        declared === "transfer"
          ? "Transfers aren't imported"
          : "Investments aren't imported",
      );
    }

    if (columns.debit >= 0 || columns.credit >= 0) {
      const debit = parseAmount(cell(r, "debit"));
      const credit = parseAmount(cell(r, "credit"));
      if (debit && Math.abs(debit) > 0) {
        amount = Math.abs(debit);
        type = "expense";
      } else if (credit && Math.abs(credit) > 0) {
        amount = Math.abs(credit);
        type = "income";
      }
    }
    if (amount === null) {
      const parsed = parseAmount(cell(r, "amount"));
      if (parsed === null) return skip("Unreadable amount");
      amount = Math.abs(parsed);
      // An explicit type wins; otherwise negative means money out.
      type = declared ?? (parsed < 0 ? "expense" : "income");
    }
    if (declared) type = declared;
    if (!type || !amount) return skip("Zero amount");

    const accountName = cell(r, "account");
    const account =
      (accountName && accountByName.get(fold(accountName))) ||
      accounts.find((a) => a.id === options.defaultAccountId);
    if (!account) return skip("No account to put it in");

    const currencyCell = cell(r, "currency").toUpperCase();
    const currency = knownCurrencies.has(currencyCell)
      ? currencyCell
      : account.currency;

    const categoryName = cell(r, "category");
    const category =
      (categoryName && categoryByKey.get(`${type}:${fold(categoryName)}`)) ||
      categories.find((c) => c.id === options.fallbackCategory[type]);
    if (!category) {
      return skip(type === "income" ? "No income category to use" : "No expense category to use");
    }

    const tags = cell(r, "tags")
      .split(/[\s,;|]+/)
      .map(normalizeTag)
      .filter(Boolean);

    const input: NewTransaction = {
      type,
      amount: Math.round(amount * 100) / 100,
      currency,
      accountId: account.id,
      categoryId: category.id,
      description: cell(r, "description"),
      date,
      ...(tags.length ? { tags: [...new Set(tags)] } : {}),
    };

    const key = duplicateKey(input);
    if (seen.has(key)) {
      return {
        line,
        input,
        status: { kind: "duplicate" },
        accountName: account.name,
        categoryName: category.name,
      };
    }
    // Also catches the same row appearing twice in one file.
    seen.add(key);
    return {
      line,
      input,
      status: { kind: "ready" },
      accountName: account.name,
      categoryName: category.name,
    };
  });
}

export const EXPORT_HEADER = [
  "date",
  "type",
  "amount",
  "currency",
  "amount_usd",
  "account",
  "category",
  "description",
  "tags",
  "refund_of",
  "transfer_id",
  "id",
];

export function exportRows(
  transactions: Transaction[],
  accountsById: Record<string, Account>,
  categoriesById: Record<string, Category>,
): (string | number)[][] {
  return [...transactions]
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
    .map((t) => [
      t.date.slice(0, 10),
      t.type === "transfer" ? `transfer-${t.transferDirection ?? "out"}` : t.type,
      t.amount,
      t.currency,
      Math.round(t.amountUSD * 100) / 100,
      accountsById[t.accountId]?.name ?? "",
      categoriesById[t.categoryId]?.name ?? "",
      t.description ?? "",
      (t.tags ?? []).join(" "),
      t.refundOf ?? "",
      t.transferId ?? "",
      t.id,
    ]);
}
