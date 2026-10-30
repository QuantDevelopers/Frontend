/**
 * Financial Number & Price Formatters (Iran Capital Markets / TSETMC Standard)
 * Formats numbers into authentic, crisp Persian typography (IRANYekan) with tabular alignment.
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Converts English ASCII digits (0-9) to standard Persian digits (۰-۹).
 * Preserves commas, decimals, and text characters.
 */
export function toPersianDigits(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value).replace(/[0-9]/g, (char) => PERSIAN_DIGITS[Number(char)] ?? char);
}

/**
 * Formats a price in Rials with thousands separator and Persian numerals.
 * e.g. 12480 -> "۱۲,۴۸۰"
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || isNaN(price)) return '—';
  const formatted = Math.round(price).toLocaleString('en-US');
  return toPersianDigits(formatted);
}

/**
 * Formats an integer count with thousands separator and Persian numerals.
 * e.g. 1480 -> "۱,۴۸۰", 25 -> "۲۵"
 */
export function formatCount(count: number | null | undefined): string {
  if (count === null || count === undefined || isNaN(count)) return '۰';
  const formatted = Math.round(count).toLocaleString('en-US');
  return toPersianDigits(formatted);
}

/**
 * Formats percentage change with sign and Persian numerals.
 * e.g. 2.45 -> "+۲.۴۵٪"
 */
export function formatPriceChange(change: number | null | undefined): {
  text: string;
  isPositive: boolean;
  isNegative: boolean;
  colorClass: string;
  badgeClass: string;
  arrow: string;
} {
  if (change === null || change === undefined || isNaN(change)) {
    return {
      text: '—',
      isPositive: false,
      isNegative: false,
      colorClass: 'text-slate-500',
      badgeClass: 'bg-slate-100 text-slate-600',
      arrow: '',
    };
  }

  const isPositive = change > 0;
  const isNegative = change < 0;
  const sign = isPositive ? '+' : isNegative ? '-' : '';
  const absValue = Math.abs(change).toFixed(2);
  const text = `${sign}${toPersianDigits(absValue)}٪`;
  const arrow = isPositive ? '▲' : isNegative ? '▼' : '';

  const colorClass = isPositive
    ? 'text-emerald-700'
    : isNegative
      ? 'text-rose-700'
      : 'text-slate-600';

  const badgeClass = isPositive
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : isNegative
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';

  return { text, isPositive, isNegative, colorClass, badgeClass, arrow };
}

/**
 * Formats a Date object to Persian time format (HH:MM:SS) in Persian digits.
 */
export function formatTime(date: Date | null | undefined): string {
  if (!date) return '—';
  const timeStr = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return toPersianDigits(timeStr);
}
