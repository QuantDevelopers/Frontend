import { describe, expect, it } from 'vitest';
import type { DailyHistoryItem, UnderlyingResponse } from '../types/api';
import { assessInstrument, buildTradingCalendar, groupCalendarByMonth, jalaliMonthKey } from './quality';

const ua = (tsetmc_id: string | null = '123'): UnderlyingResponse => ({
  id: 1,
  symbol_fa: 'اهرم',
  name_fa: 'اهرم',
  tsetmc_id,
  market_type: 'Bourse',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
});

const bar = (trade_date: string, over: Partial<DailyHistoryItem> = {}): DailyHistoryItem => ({
  id: 1,
  trade_date,
  open_price: 100,
  high_price: 110,
  low_price: 90,
  close_price: 105,
  volume: 10,
  value: 1000,
  trade_count: 3,
  ...over,
});

const calendar = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-06', '2024-01-07'];

describe('buildTradingCalendar', () => {
  it('unions traded days across instruments and ignores no-trade bars', () => {
    const cal = buildTradingCalendar([
      [bar('2024-01-02'), bar('2024-01-01')],
      [bar('2024-01-03'), bar('2024-01-04', { trade_count: 0, volume: 0 })],
      undefined,
    ]);
    expect(cal).toEqual(['2024-01-01', '2024-01-02', '2024-01-03']);
  });
});

describe('assessInstrument', () => {
  it('passes a complete, ordered, sane series', () => {
    const items = [...calendar].reverse().map((d) => bar(d));
    const q = assessInstrument(ua(), items, calendar);
    expect(q.coveragePct).toBe(100);
    expect(q.status).toBe('PASSED');
    expect(q.gaps).toEqual([]);
  });

  it('detects duplicates, order violations and OHLC violations', () => {
    const items = [
      bar('2024-01-07'),
      bar('2024-01-07'), // duplicate (also an order violation: not strictly descending)
      bar('2024-01-06', { close_price: 200 }), // close above high
      bar('2024-01-03'),
      bar('2024-01-02'),
      bar('2024-01-01'),
    ];
    const q = assessInstrument(ua(), items, calendar);
    expect(q.duplicates).toBe(1);
    expect(q.orderViolations).toBe(1);
    expect(q.ohlcViolations).toBe(1);
    expect(q.status).toBe('WARNING');
  });

  it('groups consecutive missing calendar days into gaps (largest first)', () => {
    const items = [bar('2024-01-07'), bar('2024-01-01')];
    const q = assessInstrument(ua(), items, calendar);
    expect(q.missingDays).toEqual(['2024-01-02', '2024-01-03', '2024-01-06']);
    expect(q.gaps).toEqual([{ from: '2024-01-02', to: '2024-01-06', days: 3 }]);
    expect(q.coveragePct).toBe(40);
    expect(q.status).toBe('FAILED');
  });

  it('measures coverage from the first traded day (no penalty before listing)', () => {
    const items = [bar('2024-01-07'), bar('2024-01-06')];
    const q = assessInstrument(ua(), items, calendar);
    expect(q.expectedDays).toBe(2);
    expect(q.coveragePct).toBe(100);
  });

  it('warns when the registry has no insCode and fails with no data', () => {
    const full = calendar.map((d) => bar(d)).reverse();
    expect(assessInstrument(ua(null), full, calendar).status).toBe('WARNING');
    expect(assessInstrument(ua(), [], calendar).status).toBe('FAILED');
  });
});

describe('Jalali month bucketing', () => {
  it('maps Gregorian days to Jalali year-month keys', () => {
    expect(jalaliMonthKey('2023-03-21')).toBe('1402-01'); // Nowruz 1402
    expect(jalaliMonthKey('2026-11-12')).toBe('1405-08'); // 21 Aban 1405
  });

  it('groups a calendar by Jalali month in order', () => {
    const months = groupCalendarByMonth(['2023-03-20', '2023-03-21', '2023-04-21']);
    expect(months.map((m) => m.key)).toEqual(['1401-12', '1402-01', '1402-02']);
  });
});
