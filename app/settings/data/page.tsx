"use client";

import { useMemo, useRef, useState } from "react";
import Button from "@/components/atoms/Button";
import Select from "@/components/atoms/Select";
import RouteMasthead from "@/components/molecules/RouteMasthead";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { emitDataChanged } from "@/lib/events/dataChanged";
import { auth } from "@/lib/firebase/client";
import { softDelete } from "@/lib/firebase/trash";
import {
  detectColumns,
  EXPORT_HEADER,
  exportRows,
  guessDateFormatFor,
  planImport,
  type ColumnKey,
  type ColumnMap,
} from "@/lib/import/transactionsCsv";
import { transactionStore } from "@/lib/storage";
import { downloadText, parseCsv, toCsv, type DateFormat } from "@/lib/utils/csv";
import { formatCurrency, formatDate, todayISODate } from "@/lib/utils/format";
import type { EntryType } from "@/lib/types";

const NONE = "-1";

const COLUMN_LABELS: Record<ColumnKey, string> = {
  date: "Date",
  amount: "Amount",
  debit: "Money out (debit)",
  credit: "Money in (credit)",
  type: "Type",
  description: "Description",
  category: "Category",
  account: "Account",
  currency: "Currency",
  tags: "Tags",
};

const DATE_FORMATS: { value: DateFormat; label: string }[] = [
  { value: "ymd", label: "2025-12-31" },
  { value: "dmy", label: "31/12/2025" },
  { value: "mdy", label: "12/31/2025" },
];

interface LoadedFile {
  name: string;
  header: string[];
  rows: string[][];
}

interface ImportResult {
  count: number;
  ids: string[];
  fileName: string;
  undone: boolean;
}

export default function DataPage() {
  const { transactions, loading } = useTransactions();
  const { accounts, byId: accountsById } = useAccounts();
  const { categories, byId: categoriesById, filterByType } = useCategories();

  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [columns, setColumns] = useState<ColumnMap | null>(null);
  const [dateFormat, setDateFormat] = useState<DateFormat>("ymd");
  const [defaultAccountId, setDefaultAccountId] = useState("");
  const [fallback, setFallback] = useState<Record<EntryType, string>>({
    expense: "",
    income: "",
    investment: "",
  });
  const [includeDuplicates, setIncludeDuplicates] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expenseCategories = filterByType("expense");
  const incomeCategories = filterByType("income");
  const accountId = defaultAccountId || accounts[0]?.id || "";
  const fallbackCategory = {
    expense: fallback.expense || expenseCategories[0]?.id || "",
    income: fallback.income || incomeCategories[0]?.id || "",
    investment: "",
  };

  function handleExport() {
    const csv = toCsv(
      EXPORT_HEADER,
      exportRows(transactions, accountsById, categoriesById),
    );
    downloadText(`perch-transactions-${todayISODate()}.csv`, csv);
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    setError(null);
    setResult(null);
    const text = await picked.text();
    const parsed = parseCsv(text);
    if (parsed.length < 2) {
      setError("That file doesn't have a header row and at least one transaction.");
      return;
    }
    const [header, ...rows] = parsed;
    const detected = detectColumns(header);
    setFile({ name: picked.name, header, rows });
    setColumns(detected);
    setDateFormat(guessDateFormatFor(rows, detected));
  }

  const plan = useMemo(() => {
    if (!file || !columns) return [];
    return planImport(
      file.rows,
      {
        columns,
        dateFormat,
        defaultAccountId: accountId,
        fallbackCategory,
      },
      accounts,
      categories,
      transactions,
    );
    // fallbackCategory is derived from `fallback` + the category lists.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, columns, dateFormat, accountId, fallback, accounts, categories, transactions]);

  const ready = plan.filter((p) => p.status.kind === "ready");
  const duplicates = plan.filter((p) => p.status.kind === "duplicate");
  const skipped = plan.filter((p) => p.status.kind === "skipped");
  const toImport = includeDuplicates ? [...ready, ...duplicates] : ready;
  const missingRequired =
    !columns ||
    columns.date < 0 ||
    (columns.amount < 0 && columns.debit < 0 && columns.credit < 0);

  async function handleImport() {
    if (!file || toImport.length === 0) return;
    setImporting(true);
    setError(null);
    try {
      const inputs = toImport.map((p) => p.input!);
      const ids = (await transactionStore.addMany(inputs)) ?? [];
      emitDataChanged();
      setResult({ count: inputs.length, ids, fileName: file.name, undone: false });
      setFile(null);
      setColumns(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The import failed.");
    } finally {
      setImporting(false);
    }
  }

  async function handleUndoImport() {
    const uid = auth.currentUser?.uid;
    if (!result || !uid || result.ids.length === 0) return;
    setImporting(true);
    try {
      await softDelete(uid, {
        kind: "import",
        label: `${result.fileName} (${result.count} transactions)`,
        refs: result.ids.map((id) => ({ col: "transactions", id })),
      });
      emitDataChanged();
      setResult({ ...result, undone: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't undo the import.");
    } finally {
      setImporting(false);
    }
  }

  const headerOptions = [
    { value: NONE, label: "—" },
    ...(file?.header.map((h, i) => ({ value: String(i), label: h || `Column ${i + 1}` })) ?? []),
  ];

  return (
    <div className="flex flex-col gap-8">
      <RouteMasthead kicker="Settings" title="Import & export" />

      <section className="flex flex-col gap-3">
        <h2 className="label-sm">Export</h2>
        <div className="surface p-5 flex flex-col gap-3">
          <p className="text-sm text-fg-muted">
            Every transaction, including transfers and investments, as a CSV
            that opens in Excel, Numbers or Google Sheets. Amounts are in each
            transaction&apos;s own currency, with the USD value alongside.
          </p>
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={loading || transactions.length === 0}
          >
            {loading
              ? "Loading…"
              : `Download ${transactions.length} transaction${transactions.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="label-sm">Import</h2>
        <div className="surface p-5 flex flex-col gap-4">
          <p className="text-sm text-fg-muted">
            Bring in income and expenses from a CSV: a Perch export, a bank
            statement, or your own spreadsheet. You&apos;ll see a preview
            before anything is saved, and rows already in your ledger are
            skipped.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFile}
          />
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            {file ? "Choose a different file" : "Choose a CSV file"}
          </Button>

          {error && <p className="text-sm text-expense">{error}</p>}

          {result && (
            <div className="surface-2 p-4 flex items-center gap-3 text-sm">
              <span className="flex-1">
                {result.undone
                  ? `Import undone. The ${result.count} transactions are in Recently deleted.`
                  : `Imported ${result.count} transaction${result.count === 1 ? "" : "s"} from ${result.fileName}.`}
              </span>
              {!result.undone && result.ids.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndoImport}
                  disabled={importing}
                >
                  Undo import
                </Button>
              )}
            </div>
          )}

          {file && columns && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-fg-subtle">
                {file.name} · {file.rows.length} row
                {file.rows.length === 1 ? "" : "s"}. Check which column holds
                what.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => (
                  <Select
                    key={key}
                    label={COLUMN_LABELS[key]}
                    options={headerOptions}
                    value={String(columns[key])}
                    onChange={(v) => setColumns({ ...columns, [key]: Number(v) })}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Date format"
                  options={DATE_FORMATS}
                  value={dateFormat}
                  onChange={(v) => setDateFormat(v as DateFormat)}
                />
                <Select
                  label="Account when not in the file"
                  options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                  value={accountId}
                  onChange={setDefaultAccountId}
                />
                <Select
                  label="Unmatched expense category"
                  options={expenseCategories.map((c) => ({ value: c.id, label: c.name }))}
                  value={fallbackCategory.expense}
                  onChange={(v) => setFallback({ ...fallback, expense: v })}
                />
                <Select
                  label="Unmatched income category"
                  options={incomeCategories.map((c) => ({ value: c.id, label: c.name }))}
                  value={fallbackCategory.income}
                  onChange={(v) => setFallback({ ...fallback, income: v })}
                />
              </div>

              {missingRequired ? (
                <p className="text-sm text-expense">
                  Pick the Date column and an Amount (or Money out / Money in)
                  column to continue.
                </p>
              ) : (
                <>
                  <p className="text-sm">
                    <span className="text-fg font-medium">{ready.length} ready</span>
                    {duplicates.length > 0 && (
                      <span className="text-fg-muted"> · {duplicates.length} already in your ledger</span>
                    )}
                    {skipped.length > 0 && (
                      <span className="text-fg-muted"> · {skipped.length} can&apos;t be read</span>
                    )}
                  </p>

                  {duplicates.length > 0 && (
                    <label className="flex items-center gap-2 text-sm text-fg-muted">
                      <input
                        type="checkbox"
                        checked={includeDuplicates}
                        onChange={(e) => setIncludeDuplicates(e.target.checked)}
                      />
                      Import the {duplicates.length} possible duplicates too
                    </label>
                  )}

                  <ul className="rooms max-h-80 overflow-y-auto">
                    {plan.slice(0, 50).map((p) => (
                      <li key={p.line} className="px-3 py-2 flex items-center gap-3 text-xs">
                        <span className="text-fg-subtle w-8 shrink-0">#{p.line}</span>
                        {p.input ? (
                          <>
                            <span className="flex-1 min-w-0 truncate">
                              {formatDate(p.input.date)} · {p.input.description || p.categoryName}
                              <span className="text-fg-subtle"> · {p.categoryName} · {p.accountName}</span>
                            </span>
                            <span className={p.input.type === "income" ? "text-income" : "text-expense"}>
                              {p.input.type === "income" ? "+" : "−"}
                              {formatCurrency(p.input.amount, p.input.currency)}
                            </span>
                          </>
                        ) : (
                          <span className="flex-1 text-fg-subtle">
                            {p.status.kind === "skipped" ? p.status.reason : ""}
                          </span>
                        )}
                        {p.status.kind === "duplicate" && (
                          <span className="text-fg-subtle shrink-0">duplicate</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {plan.length > 50 && (
                    <p className="text-xs text-fg-subtle">Showing the first 50 rows.</p>
                  )}

                  <Button
                    onClick={handleImport}
                    disabled={importing || toImport.length === 0}
                  >
                    {importing
                      ? "Importing…"
                      : `Import ${toImport.length} transaction${toImport.length === 1 ? "" : "s"}`}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
