import type { RecurrenceFrequency, RecurringTransaction } from "@/lib/types";

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  startDate: string;
  semiMonthlyDays?: [number, number];
  endDate?: string;
}

interface YMD {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

function parseISO(iso: string): YMD {
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y, month: m, day: d };
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatYMD(ymd: YMD): string {
  return `${ymd.year}-${pad(ymd.month)}-${pad(ymd.day)}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, daysInMonth(year, month));
}

function addMonths(ymd: YMD, delta: number): YMD {
  const total = ymd.month - 1 + delta;
  const year = ymd.year + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12 + 1;
  return { year, month, day: clampDay(year, month, ymd.day) };
}

function addDaysISO(iso: string, delta: number): string {
  const ymd = parseISO(iso);
  const d = new Date(Date.UTC(ymd.year, ymd.month - 1, ymd.day));
  d.setUTCDate(d.getUTCDate() + delta);
  return formatYMD({
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  });
}

function compareISO(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * All occurrence dates that satisfy:
 *   startDate ≤ date ≤ min(until, endDate)
 *   AND date > after (if `after` is provided)
 *
 * `after` is typically `lastGeneratedDate`, ensuring idempotency across runs.
 */
export function computeOccurrencesBetween(
  rule: RecurrenceRule,
  after: string | undefined,
  until: string,
): string[] {
  const startYMD = parseISO(rule.startDate);
  const hardEnd = rule.endDate && compareISO(rule.endDate, until) < 0 ? rule.endDate : until;
  if (compareISO(rule.startDate, hardEnd) > 0) return [];

  const lowerBound = after && compareISO(after, rule.startDate) >= 0 ? after : undefined;
  const isPastLower = (d: string) => (lowerBound ? compareISO(d, lowerBound) > 0 : true);
  const isWithinUpper = (d: string) => compareISO(d, hardEnd) <= 0;

  const out: string[] = [];

  switch (rule.frequency) {
    case "monthly": {
      for (let i = 0; ; i++) {
        const next = addMonths(startYMD, i);
        const iso = formatYMD(next);
        if (!isWithinUpper(iso)) break;
        if (isPastLower(iso)) out.push(iso);
      }
      break;
    }
    case "semi-monthly": {
      const rawDays = rule.semiMonthlyDays ?? [15, 30];
      const days = Array.from(new Set(rawDays)).sort((a, b) => a - b);
      // Walk months from startDate's month onwards
      for (let i = 0; ; i++) {
        const anchor = addMonths({ ...startYMD, day: 1 }, i);
        let stopped = false;
        for (const d of days) {
          const day = clampDay(anchor.year, anchor.month, d);
          const iso = formatYMD({ year: anchor.year, month: anchor.month, day });
          if (compareISO(iso, rule.startDate) < 0) continue;
          if (!isWithinUpper(iso)) {
            stopped = true;
            break;
          }
          if (isPastLower(iso)) out.push(iso);
        }
        if (stopped) break;
        // Safety: after 600 months (50 years) bail out.
        if (i > 600) break;
      }
      // De-dup in case identical days were passed
      return Array.from(new Set(out)).sort();
    }
    case "weekly":
    case "biweekly": {
      const step = rule.frequency === "weekly" ? 7 : 14;
      let cursor = rule.startDate;
      while (isWithinUpper(cursor)) {
        if (isPastLower(cursor)) out.push(cursor);
        cursor = addDaysISO(cursor, step);
      }
      break;
    }
    case "yearly": {
      for (let i = 0; ; i++) {
        const year = startYMD.year + i;
        const day = clampDay(year, startYMD.month, startYMD.day);
        const iso = formatYMD({ year, month: startYMD.month, day });
        if (!isWithinUpper(iso)) break;
        if (isPastLower(iso)) out.push(iso);
      }
      break;
    }
  }

  return out;
}

/**
 * The next occurrence strictly after `from` (default: today). Returns undefined
 * if the rule has ended.
 */
export function nextOccurrenceAfter(
  rule: RecurrenceRule,
  from: string,
): string | undefined {
  // Look ahead one year — long enough for any supported frequency.
  const horizon = addDaysISO(from, 366);
  const occurrences = computeOccurrencesBetween(rule, from, horizon);
  return occurrences[0];
}

export function toRule(template: RecurringTransaction): RecurrenceRule {
  return {
    frequency: template.frequency,
    startDate: template.startDate,
    semiMonthlyDays: template.semiMonthlyDays,
    endDate: template.endDate,
  };
}
