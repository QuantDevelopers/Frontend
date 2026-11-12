import { api, fetchLiveOptions } from '../services/api';
import type { DailyHistoryItem, OptionResponse, UnderlyingResponse } from '../types/api';
import { mapWithConcurrency } from '../utils/concurrency';
import { useQuery } from './useQuery';

/** One underlying enriched with its latest daily bar and active option counts. */
export interface UnderlyingRow {
  underlying: UnderlyingResponse;
  last?: DailyHistoryItem;
  /** % change of last close vs previous close (or yesterday_price). */
  changePct?: number;
  calls: number;
  puts: number;
  activeOptions: number;
  nearestExpiry?: string;
}

interface MarketOverview {
  rows: UnderlyingRow[];
  activeOptions: OptionResponse[];
  /** Latest trading day seen across all underlyings. */
  latestTradeDate?: string;
}

const DAILY_FANOUT_CONCURRENCY = 5;

function changePct(items: DailyHistoryItem[]): number | undefined {
  const [last, prev] = items; // newest first
  if (!last || !(last.close_price > 0)) return undefined;
  const base = prev?.close_price || last.yesterday_price;
  if (!base) return undefined;
  return ((last.close_price - base) / base) * 100;
}

/**
 * Builds the market overview used by the dashboard and the instruments page.
 * The backend exposes no aggregate endpoint, so this combines:
 *   - GET /underlyings                     (registry)
 *   - GET /options?is_active=true (paged, past-expiry dropped) (contract counts & nearest expiry)
 *   - GET /daily-history/underlying/{s}?limit=2 per underlying (last price & change)
 */
async function loadOverview(): Promise<MarketOverview> {
  const [{ items: underlyings }, activeOptions] = await Promise.all([api.underlyings(), fetchLiveOptions()]);

  const daily = await mapWithConcurrency(underlyings, DAILY_FANOUT_CONCURRENCY, (u) =>
    api.dailyHistory('UNDERLYING', u.symbol_fa, { limit: 2 })
  );

  const byUnderlying = new Map<number, OptionResponse[]>();
  for (const o of activeOptions) {
    const list = byUnderlying.get(o.underlying_asset_id) ?? [];
    list.push(o);
    byUnderlying.set(o.underlying_asset_id, list);
  }

  let latestTradeDate: string | undefined;
  const rows = underlyings.map((u, i): UnderlyingRow => {
    const bars = daily[i]?.items ?? [];
    const opts = byUnderlying.get(u.id) ?? [];
    const calls = opts.filter((o) => o.contract_type === 'CALL').length;
    const expiries = opts.map((o) => o.expiration_date.slice(0, 10)).sort();
    const last = bars[0];
    if (last && (!latestTradeDate || last.trade_date > latestTradeDate)) latestTradeDate = last.trade_date;
    return {
      underlying: u,
      last,
      changePct: changePct(bars),
      calls,
      puts: opts.length - calls,
      activeOptions: opts.length,
      nearestExpiry: expiries[0],
    };
  });

  return { rows, activeOptions, latestTradeDate };
}

export function useMarketOverview() {
  return useQuery<MarketOverview>('market-overview', loadOverview, { ttl: 120_000 });
}
