// Minimal RFC 4180 CSV: quoted fields, escaped quotes, CRLF or LF, and a
// leading BOM. Delimiter is auto-detected between comma and semicolon, since
// spreadsheets in Spanish locales export with semicolons.

export function detectDelimiter(text: string): "," | ";" {
  const firstLine = text.replace(/^﻿/, "").split(/\r?\n/, 1)[0] ?? "";
  let commas = 0;
  let semis = 0;
  let quoted = false;
  for (const ch of firstLine) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && ch === ",") commas++;
    else if (!quoted && ch === ";") semis++;
  }
  return semis > commas ? ";" : ",";
}

export function parseCsv(text: string, delimiter = detectDelimiter(text)): string[][] {
  const src = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

function escapeField(value: string): string {
  // Leading =, +, -, @ make spreadsheets treat a cell as a formula. Prefix a
  // quote so descriptions can't run as formulas when the export is opened.
  const safe = /^[=+\-@]/.test(value) && !/^-?\d/.test(value) ? `'${value}` : value;
  return /[",\r\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(header: string[], rows: (string | number)[][]): string {
  const lines = [header, ...rows].map((r) =>
    r.map((v) => escapeField(String(v))).join(","),
  );
  // BOM so Excel opens UTF-8 (accents, ₡) correctly.
  return "﻿" + lines.join("\r\n") + "\r\n";
}

export function downloadText(filename: string, text: string, mime = "text/csv") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Parse an amount the way people type it in either locale:
 * "1,234.50", "1.234,50", "-45", "(45.00)", "₡12 500". Returns null when
 * nothing numeric is left.
 */
export function parseAmount(raw: string): number | null {
  let s = raw.trim();
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.includes("-")) negative = true;
  s = s.replace(/[^0-9.,]/g, "");
  if (!s) return null;
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    // Whichever separator comes last is the decimal one.
    const decimal = lastDot > lastComma ? "." : ",";
    const thousands = decimal === "." ? "," : ".";
    s = s.split(thousands).join("").replace(decimal, ".");
  } else if (lastComma >= 0) {
    // "12,50" is a decimal; "12,500" is thousands.
    const decimals = s.length - lastComma - 1;
    s = decimals === 3 && s.indexOf(",") === lastComma ? s.replace(",", "") : s.replace(/,/g, ".");
    if ((s.match(/\./g) ?? []).length > 1) s = s.replace(/\.(?=.*\.)/g, "");
  } else if ((s.match(/\./g) ?? []).length > 1) {
    // "1.234.567" can only be thousands separators.
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

export type DateFormat = "ymd" | "dmy" | "mdy";

/** Parse a date into YYYY-MM-DD. Accepts -, / or . as separators. */
export function parseDate(raw: string, format: DateFormat): string | null {
  const s = raw.trim().slice(0, 10);
  const parts = s.split(/[-/.]/).map((p) => p.trim());
  if (parts.length !== 3) return null;
  let y: number, m: number, d: number;
  if (parts[0].length === 4) {
    [y, m, d] = parts.map(Number);
  } else if (format === "mdy") {
    [m, d, y] = parts.map(Number);
  } else {
    [d, m, y] = parts.map(Number);
  }
  if (y < 100) y += 2000;
  if (!y || !m || !d || m > 12 || d > 31) return null;
  const date = new Date(y, m - 1, d);
  if (date.getMonth() !== m - 1) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Guess the date format from sample values: any first part > 12 means d/m. */
export function guessDateFormat(samples: string[]): DateFormat {
  for (const raw of samples) {
    const parts = raw.trim().split(/[-/.]/);
    if (parts.length !== 3) continue;
    if (parts[0].length === 4) return "ymd";
    if (Number(parts[0]) > 12) return "dmy";
    if (Number(parts[1]) > 12) return "mdy";
  }
  return "dmy";
}
