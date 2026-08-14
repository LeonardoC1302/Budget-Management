export const BASE_CURRENCY = "USD";

export interface CurrencyEntry {
  code: string;
  name: string;
  symbol: string;
}

// The app is used from Costa Rica; only USD and CRC are supported. Any legacy
// currency code stored on older documents falls through the label helper as
// its raw code so the UI stays readable.
export const SUPPORTED_CURRENCIES: CurrencyEntry[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "CRC", name: "Costa Rican Colón", symbol: "₡" },
];

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]["code"];

const NAME_BY_CODE: Record<string, string> = Object.fromEntries(
  SUPPORTED_CURRENCIES.map((c) => [c.code, c.name]),
);

export function currencyLabel(code: string): string {
  const name = NAME_BY_CODE[code];
  return name ? `${code} — ${name}` : code;
}
