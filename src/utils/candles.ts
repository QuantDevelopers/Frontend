import type { DailyHistoryItem, TickItem } from '../types/api';
import { isoDayToDate, normalizeClock, toIsoDay } from './formatters';

export interface Candle {
  /** "YYYY-MM-DD" for daily bars, or wall-clock seconds (see `wallClockSeconds`) for intraday bars. */
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Daily bars (backend returns newest first) -> chronological candles.
 * Days without a valid close are skipped; a missing open falls back to yesterday/close.
 */
export function dailyToCandles(items: DailyHistoryItem[]): Candle[] {
  return [...items]
    .filter((d) => d.close_price > 0)
    .sort((a, b) => a.trade_date.localeCompare(b.trade_date))
    .map((d) => {
      const open = d.open_price > 0 ? d.open_price : d.yesterday_price || d.close_price;
      const high = Math.max(d.high_price || 0, open, d.close_price);
      const low = Math.min(d.low_price > 0 ? d.low_price : Infinity, open, d.close_price);
      return { time: toIsoDay(d.trade_date), open, high, low, close: d.close_price, volume: d.volume };
    });
}

/**
 * Tehran wall-clock date+time encoded as a UTC epoch (seconds).
 * Charts render UTC, so this keeps the axis showing the exact trade time (e.g. 09:00:05)
 * independent of the viewer's timezone.
 */
export function wallClockSeconds(tradeDate: string, tradeTime: string): number {
  const [h, m, s] = normalizeClock(tradeTime).split(':').map(Number);
  return isoDayToDate(tradeDate).getTime() / 1000 + (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
}

/**
 * Aggregates raw ticks into OHLCV candles of `intervalSec` seconds.
 * The backend has no candle endpoint, so candles are built client-side from /ticks.
 */
export function ticksToCandles(ticks: TickItem[], intervalSec: number): Candle[] {
  const buckets = new Map<number, Candle>();
  for (const t of ticks) {
    if (!(t.price > 0)) continue;
    const ts = wallClockSeconds(t.trade_date, t.trade_time);
    const bucket = ts - (ts % intervalSec);
    const c = buckets.get(bucket);
    if (!c) {
      buckets.set(bucket, { time: bucket, open: t.price, high: t.price, low: t.price, close: t.price, volume: t.volume });
    } else {
      c.high = Math.max(c.high, t.price);
      c.low = Math.min(c.low, t.price);
      c.close = t.price; // ticks arrive chronologically
      c.volume += t.volume;
    }
  }
  return [...buckets.values()].sort((a, b) => (a.time as number) - (b.time as number));
}
