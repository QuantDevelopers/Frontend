import type { ContractType, Moneyness } from '../types/api';

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
