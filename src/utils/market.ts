import type { ContractType, DailyHistoryItem, Moneyness, OptionResponse } from '../types/api';
import { daysUntil } from './formatters';

/** Backend `market_type` ("Bourse", "Farabourse", ...) -> Persian label. */
export function marketLabel(marketType: string | null | undefined): string {
  const v = (marketType || '').toLowerCase();
  if (v.includes('fara') || v.includes('فرابورس')) return 'فرابورس';
  if (v.includes('bourse') || v.includes('بورس')) return 'بورس';
  return marketType || '—';
}

export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  CALL: 'اختیار خرید',
  PUT: 'اختیار فروش',
};

export const MONEYNESS_LABEL: Record<Moneyness, string> = {
  ITM: 'در سود',
  ATM: 'بی‌تفاوت',
  OTM: 'در زیان',
};

export const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'فعال',
  EXPIRED: 'منقضی',
  DELISTED: 'حذف‌شده',
};

/** True once the expiry day (Tehran calendar) has passed; the contract still trades on the expiry day itself. */
export function isExpired(o: Pick<OptionResponse, 'expiration_date'>): boolean {
  return daysUntil(o.expiration_date.slice(0, 10)) < 0;
}

/**
 * Contract status for display. The backend never flips `is_active`/`status` after expiry,
 * so a past expiry date always wins over the stored flag.
 */
export function contractStatus(o: Pick<OptionResponse, 'expiration_date' | 'status' | 'is_active'>): string {
  if (isExpired(o)) return 'EXPIRED';
  return (o.status || (o.is_active ? 'ACTIVE' : 'EXPIRED')).toUpperCase();
}

/** Drops daily rows after the contract's expiry; the backend keeps returning carried-forward zero-volume bars. */
export function capAtExpiry(items: DailyHistoryItem[], expirationDate: string): DailyHistoryItem[] {
  const exp = expirationDate.slice(0, 10);
  return items.filter((d) => d.trade_date.slice(0, 10) <= exp);
}

/** ATM band used by the backend (`DefaultATMThresholdPct = 0.01`). */
const ATM_THRESHOLD_PCT = 0.01;

/** Same rule as backend domain/options.ClassifyMoneyness. */
export function classifyMoneyness(type: ContractType, strike: number, spot: number): Moneyness | null {
  if (!(strike > 0) || !(spot > 0)) return null;
  if (Math.abs(spot - strike) / strike <= ATM_THRESHOLD_PCT) return 'ATM';
  if (type === 'CALL') return spot > strike ? 'ITM' : 'OTM';
  return spot < strike ? 'ITM' : 'OTM';
}

/** Official TSETMC instrument page for an insCode. */
export function tsetmcUrl(insCode: string): string {
  return `https://www.tsetmc.com/instInfo/${insCode}`;
}
