import { describe, expect, it } from 'vitest';
import type { DailyHistoryItem, TickItem } from '../types/api';
import { dailyToCandles, ticksToCandles, wallClockSeconds } from './candles';

const tick = (trade_time: string, price: number, volume = 1): TickItem => ({
  id: 1,
  trade_date: '2024-07-06',
  trade_time,
  price,
  volume,
});

describe('wallClockSeconds', () => {
  it('encodes Tehran wall-clock time as UTC epoch seconds', () => {
    const ts = wallClockSeconds('2024-07-06', '10:40:45');
    expect(new Date(ts * 1000).toISOString()).toBe('2024-07-06T10:40:45.000Z');
  });

  it('accepts TSETMC hEven integers (zero-padded to 6 digits)', () => {
    expect(wallClockSeconds('2024-07-06', '90005')).toBe(wallClockSeconds('2024-07-06', '09:00:05'));
  });
});

describe('ticksToCandles', () => {
  it('aggregates OHLCV per bucket in chronological order', () => {
    const candles = ticksToCandles(
      [tick('09:00:05', 100, 2), tick('09:00:40', 120, 3), tick('09:00:59', 90, 1), tick('09:01:10', 95, 4)],
      60
    );
    expect(candles).toHaveLength(2);
    expect(candles[0]).toMatchObject({ open: 100, high: 120, low: 90, close: 90, volume: 6 });
    expect(candles[1]).toMatchObject({ open: 95, high: 95, low: 95, close: 95, volume: 4 });
  });

  it('skips non-positive prices', () => {
    expect(ticksToCandles([tick('09:00:00', 0)], 60)).toEqual([]);
  });
});

describe('dailyToCandles', () => {
  const day = (trade_date: string, over: Partial<DailyHistoryItem> = {}): DailyHistoryItem => ({
    id: 1,
    trade_date,
    open_price: 10,
    high_price: 12,
    low_price: 9,
    close_price: 11,
    volume: 5,
    value: 55,
    trade_count: 1,
    ...over,
  });

  it('sorts newest-first API output ascending and drops days without a close', () => {
    const candles = dailyToCandles([day('2024-01-03'), day('2024-01-02', { close_price: 0 }), day('2024-01-01')]);
    expect(candles.map((c) => c.time)).toEqual(['2024-01-01', '2024-01-03']);
  });

  it('falls back to yesterday price when open is missing', () => {
    const [c] = dailyToCandles([day('2024-01-01', { open_price: 0, yesterday_price: 10.5 })]);
    expect(c.open).toBe(10.5);
    expect(c.low).toBe(9);
  });
});
