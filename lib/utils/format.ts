export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 2,
  }).format(amount);
}

// Compact form for preview surfaces where large-magnitude values (e.g. CRC
// balances that run into millions) would blow out the layout. Uses "3K", "1.2M"
// etc. Full-value renders (modals, detail views) should keep `formatCurrency`.
export function formatCurrencyCompact(
  amount: number,
  currency = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(amount);
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function todayISODate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function formatDateHeader(iso: string): string {
  const today = todayISODate();
  if (iso === today) return "Today";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(today);
  if (match) {
    const y = Number(match[1]);
    const m = Number(match[2]);
    const d = Number(match[3]);
    const yesterday = new Date(y, m - 1, d - 1);
    const yISO = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;
    if (iso === yISO) return "Yesterday";
  }
  return formatDate(iso);
}
