import { COVERAGE_TARGET_PCT } from '../config';
import type { DailyHistoryItem, UnderlyingResponse } from '../types/api';
import { isoDayToDate } from './formatters';

/**
 * Client-side data-quality checks over GET /daily-history.
 * The backend exposes only crawl/DB counters (GET /crawl/status), so per-instrument
 * checks (uniqueness, ordering, OHLC sanity, coverage vs trading calendar, gaps) run here.
 */

export type QualityStatus = 'PASSED' | 'WARNING' | 'FAILED';

interface Gap {
  from: string;
  to: string;
  days: number;
}

export interface InstrumentQuality {
  underlying: UnderlyingResponse;
  status: QualityStatus;
  rows: number;
  tradedDays: number;
  firstDate?: string;
  lastDate?: string;
  /** Traded days present / trading-calendar days since DATA_START_DATE (or since first bar). */
  coveragePct: number;
  expectedDays: number;
  duplicates: number;
  orderViolations: number;
  ohlcViolations: number;
  missingDays: string[];
  gaps: Gap[];
  /** All traded days present for this instrument (for the heatmap). */
  days: Set<string>;
}

const hasTrades = (d: DailyHistoryItem) => d.trade_count > 0 || d.volume > 0;

/**
 * Trading calendar proxy: union of days on which *any* underlying traded.
 * (The backend has no trading-calendar endpoint; with 25 liquid underlyings this matches market days.)
 */
export function buildTradingCalendar(histories: (DailyHistoryItem[] | undefined)[]): string[] {
  const set = new Set<string>();
  for (const items of histories) for (const d of items ?? []) if (hasTrades(d)) set.add(d.trade_date);
  return [...set].sort();
}

function toGaps(missing: string[], calendar: string[]): Gap[] {
  const index = new Map(calendar.map((d, i) => [d, i]));
  const gaps: Gap[] = [];
  for (const day of missing) {
    const last = gaps[gaps.length - 1];
    if (last && index.get(day) === (index.get(last.to) ?? -2) + 1) {
      last.to = day;
      last.days++;
    } else {
      gaps.push({ from: day, to: day, days: 1 });
    }
  }
  return gaps.sort((a, b) => b.days - a.days);
}

export function assessInstrument(
  underlying: UnderlyingResponse,
  items: DailyHistoryItem[] | undefined,
  calendar: string[]
): InstrumentQuality {
  const rows = items ?? [];
  const dates = rows.map((d) => d.trade_date);

  // Uniqueness: one bar per (instrument, trade_date)
  const duplicates = dates.length - new Set(dates).size;

  // Ordering: backend contract is newest-first
  let orderViolations = 0;
  for (let i = 1; i < dates.length; i++) if (dates[i] >= dates[i - 1]) orderViolations++;

  // OHLC sanity on traded days: low ≤ open/close ≤ high, prices positive
  const ohlcViolations = rows.filter(
    (d) =>
      hasTrades(d) &&
      (d.low_price <= 0 ||
        d.high_price < d.low_price ||
        d.open_price > d.high_price ||
        d.open_price < d.low_price ||
        d.close_price > d.high_price ||
        d.close_price < d.low_price)
  ).length;

  const days = new Set(rows.filter(hasTrades).map((d) => d.trade_date));
  const sortedDays = [...days].sort();
  const firstDate = sortedDays[0];
  const lastDate = sortedDays[sortedDays.length - 1];

  // Expected = calendar days from the first bar on (instruments listed later are not penalized for pre-listing days)
  const expected = firstDate ? calendar.filter((d) => d >= firstDate) : calendar;
  const missingDays = expected.filter((d) => !days.has(d));
  const coveragePct = expected.length ? ((expected.length - missingDays.length) / expected.length) * 100 : 0;

  let status: QualityStatus = 'PASSED';
  if (days.size === 0 || coveragePct < 80) status = 'FAILED';
  else if (coveragePct < COVERAGE_TARGET_PCT || duplicates > 0 || orderViolations > 0 || ohlcViolations > 0 || !underlying.tsetmc_id)
    status = 'WARNING';

  return {
    underlying,
    status,
    rows: rows.length,
    tradedDays: days.size,
    firstDate,
    lastDate,
    coveragePct,
    expectedDays: expected.length,
    duplicates,
    orderViolations,
    ohlcViolations,
    missingDays,
    gaps: toGaps(missingDays, calendar),
    days,
  };
}

/* ---------- Jalali month bucketing for the heatmap ---------- */

const jalaliParts = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
  year: 'numeric',
  month: 'numeric',
  timeZone: 'UTC',
});

/** "2024-07-06" -> "1403-04" (Jalali year-month key, sortable). */
export function jalaliMonthKey(day: string): string {
  const parts = jalaliParts.formatToParts(isoDayToDate(day));
  const y = parts.find((p) => p.type === 'year')?.value ?? '0';
  const m = parts.find((p) => p.type === 'month')?.value ?? '0';
  return `${y.replace(/\D/g, '')}-${m.replace(/\D/g, '').padStart(2, '0')}`;
}

export interface MonthBucket {
  key: string;
  /** A representative calendar day of the month (for labels). */
  sampleDay: string;
  days: string[];
}

export function groupCalendarByMonth(calendar: string[]): MonthBucket[] {
  const map = new Map<string, MonthBucket>();
  for (const day of calendar) {
    const key = jalaliMonthKey(day);
    const b = map.get(key) ?? { key, sampleDay: day, days: [] };
    b.days.push(day);
    map.set(key, b);
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}
