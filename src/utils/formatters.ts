/**
 * Number & date formatters for the Persian (RTL) UI.
 * Numbers are rendered with Persian digits; dates in the Jalali (Solar Hijri) calendar.
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const EMPTY = '—';

/** Wraps text in a Unicode LTR isolate so signs (+/−) stay on the left inside RTL text. */
const ltrIsolate = (text: string) => `⁦${text}⁩`;

const isMissing = (v: number | null | undefined): v is null | undefined =>
  v === null || v === undefined || Number.isNaN(v);

/** Converts ASCII digits (0-9) to Persian digits (۰-۹), keeping other characters. */
export function toPersianDigits(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return EMPTY;
  return String(value).replace(/[0-9]/g, (char) => PERSIAN_DIGITS[Number(char)] ?? char);
}

/** Price in Rials with thousands separator, e.g. 12480 -> "۱۲٬۴۸۰". */
export function formatPrice(price: number | null | undefined): string {
  if (isMissing(price)) return EMPTY;
  return toPersianDigits(Math.round(price).toLocaleString('en-US')).replace(/,/g, '٬');
}

/** Integer count with thousands separator. */
export function formatCount(count: number | null | undefined): string {
  if (isMissing(count)) return '۰';
  return toPersianDigits(Math.round(count).toLocaleString('en-US')).replace(/,/g, '٬');
}

/** Percentage with given decimals, e.g. 98.456 -> "۹۸٫۵٪". */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (isMissing(value)) return EMPTY;
  const text = `${toPersianDigits(Math.abs(value).toFixed(decimals)).replace('.', '٫')}٪`;
  return value < 0 ? ltrIsolate(`−${text}`) : text;
}

/** Large values in Persian units: 2_500_000_000 -> "۲٫۵ میلیارد". */
export function formatCompact(value: number | null | undefined): string {
  if (isMissing(value)) return EMPTY;
  const abs = Math.abs(value);
  const units: [number, string][] = [
    [1e12, 'هزار میلیارد'],
    [1e9, 'میلیارد'],
    [1e6, 'میلیون'],
    [1e3, 'هزار'],
  ];
  for (const [size, label] of units) {
    if (abs >= size) {
      const scaled = value / size;
      const text = scaled.toFixed(abs >= size * 100 ? 0 : 1).replace(/\.0$/, '');
      return `${toPersianDigits(text).replace('.', '٫')} ${label}`;
    }
  }
  return formatCount(value);
}

/** Byte size, e.g. 1536 -> "۱٫۵ KB". */
export function formatBytes(bytes: number | null | undefined): string {
  if (isMissing(bytes)) return EMPTY;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${toPersianDigits(size.toFixed(i === 0 ? 0 : 1)).replace('.', '٫')} ${units[i]}`;
}

/** Signed percent change with a text color class. */
export function formatPriceChange(change: number | null | undefined): { text: string; colorClass: string } {
  if (isMissing(change)) return { text: EMPTY, colorClass: 'text-slate-400' };
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  const text = ltrIsolate(`${sign}${toPersianDigits(Math.abs(change).toFixed(2)).replace('.', '٫')}٪`);
  if (change > 0) return { text, colorClass: 'text-emerald-600' };
  if (change < 0) return { text, colorClass: 'text-rose-600' };
  return { text, colorClass: 'text-slate-500' };
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

/** "2024-07-06", "20240706" or an ISO timestamp -> "2024-07-06". */
export function toIsoDay(value: string): string {
  const v = value.trim();
  if (/^\d{8}$/.test(v)) return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
  return v.slice(0, 10);
}

/** Calendar day string -> Date at UTC midnight (timezone-independent). */
export function isoDayToDate(day: string): Date {
  const [y, m, d] = toIsoDay(day).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

const jalaliShort = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
});
const jalaliParts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
  timeZone: 'UTC',
});

/** Jalali date parts; assembled manually because ICU's fa-persian patterns order them inconsistently. */
function jalaliPartsOf(day: string): Record<'year' | 'month' | 'day' | 'weekday', string> {
  const parts = jalaliParts.formatToParts(isoDayToDate(day));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return { year: get('year'), month: get('month'), day: get('day'), weekday: get('weekday') };
}
const tehranDateTime = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Tehran',
});

/** Calendar day -> Jalali "۱۴۰۵/۰۸/۲۱". */
export function formatJalali(day: string | null | undefined): string {
  if (!day) return EMPTY;
  return jalaliShort.format(isoDayToDate(day));
}

/** Calendar day -> "چهارشنبه ۲۱ آبان ۱۴۰۵". */
export function formatJalaliLong(day: string | null | undefined): string {
  if (!day) return EMPTY;
  const p = jalaliPartsOf(day);
  return `${p.weekday} ${p.day} ${p.month} ${p.year}`;
}

/** Calendar day -> "آبان ۱۴۰۵". */
export function formatJalaliMonth(day: string): string {
  const p = jalaliPartsOf(day);
  return `${p.month} ${p.year}`;
}

/** Instant (ISO with timezone) -> Jalali date & time in Asia/Tehran. */
export function formatTehranDateTime(iso: string | null | undefined): string {
  if (!iso) return EMPTY;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() < 1900) return EMPTY;
  return tehranDateTime.format(date).replace(',', '،');
}

/** Today's calendar day in Asia/Tehran as "YYYY-MM-DD". */
export function tehranToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date());
}

/** Whole days from today (Tehran) until the given calendar day; negative if in the past. */
export function daysUntil(day: string): number {
  const ms = isoDayToDate(day).getTime() - isoDayToDate(tehranToday()).getTime();
  return Math.round(ms / 86_400_000);
}

/** Normalizes TSETMC/Postgres time values ("90005", "09:00:05", "0000-01-01T09:00:05Z") to "HH:MM:SS". */
export function normalizeClock(raw: string): string {
  const v = raw.trim();
  const match = v.match(/(\d{1,2}):(\d{2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}:${match[3]}`;
  if (/^\d{1,6}$/.test(v)) {
    const p = v.padStart(6, '0');
    return `${p.slice(0, 2)}:${p.slice(2, 4)}:${p.slice(4, 6)}`;
  }
  return v;
}
