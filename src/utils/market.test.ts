import { describe, expect, it } from 'vitest';
import { capAtExpiry, classifyMoneyness, contractStatus, marketLabel } from './market';
import type { DailyHistoryItem } from '../types/api';
import { formatPrice, normalizeClock, toIsoDay, toPersianDigits } from './formatters';
import { normalizePersianText } from './normalizePersian';

describe('classifyMoneyness (mirrors backend domain/options)', () => {
  it('uses a ±1% ATM band around strike', () => {
    expect(classifyMoneyness('CALL', 1000, 1005)).toBe('ATM');
    expect(classifyMoneyness('PUT', 1000, 995)).toBe('ATM');
  });
  it('classifies calls and puts outside the band', () => {
    expect(classifyMoneyness('CALL', 1000, 1100)).toBe('ITM');
    expect(classifyMoneyness('CALL', 1000, 900)).toBe('OTM');
    expect(classifyMoneyness('PUT', 1000, 900)).toBe('ITM');
    expect(classifyMoneyness('PUT', 1000, 1100)).toBe('OTM');
  });
  it('returns null for invalid input', () => {
    expect(classifyMoneyness('CALL', 0, 100)).toBeNull();
  });
});

describe('formatters', () => {
  it('renders Persian digits and separators', () => {
    expect(toPersianDigits(2024)).toBe('۲۰۲۴');
    expect(formatPrice(12480)).toBe('۱۲٬۴۸۰');
  });
  it('normalizes date and time representations', () => {
    expect(toIsoDay('20240706')).toBe('2024-07-06');
    expect(toIsoDay('2024-07-06T00:00:00Z')).toBe('2024-07-06');
    expect(normalizeClock('90005')).toBe('09:00:05');
    expect(normalizeClock('0000-01-01T10:40:45Z')).toBe('10:40:45');
  });
  it('maps backend market types to Persian labels', () => {
    expect(marketLabel('Bourse')).toBe('بورس');
    expect(marketLabel('Farabourse')).toBe('فرابورس');
  });
  it('normalizes Arabic ي/ك to Persian ی/ک (rule 7.4)', () => {
    expect(normalizePersianText('بانك ملي')).toBe('بانک ملی');
  });
});

describe('contract expiry (backend never flips is_active)', () => {
  it('reports EXPIRED once the expiry date has passed, whatever the stored flag says', () => {
    expect(contractStatus({ expiration_date: '2020-01-01T00:00:00Z', status: 'ACTIVE', is_active: true })).toBe('EXPIRED');
    expect(contractStatus({ expiration_date: '2999-01-01T00:00:00Z', status: 'ACTIVE', is_active: true })).toBe('ACTIVE');
  });
  it('drops daily rows after expiry', () => {
    const bar = (trade_date: string) => ({ trade_date }) as DailyHistoryItem;
    const items = [bar('2026-11-11'), bar('2026-11-01'), bar('2026-10-31')];
    expect(capAtExpiry(items, '2026-11-01T00:00:00Z').map((d) => d.trade_date)).toEqual(['2026-11-01', '2026-10-31']);
  });
});
