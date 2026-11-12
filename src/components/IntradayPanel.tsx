import { useMemo, useState } from 'react';
import { useQuery } from '../hooks/useQuery';
import { fetchAllTicks } from '../services/api';
import { ApiError } from '../services/http';
import type { DailyHistoryItem, InstrumentType, PaginationMeta } from '../types/api';
import { ticksToCandles } from '../utils/candles';
import { formatCompact, formatCount, formatJalali, formatPrice, normalizeClock, toPersianDigits } from '../utils/formatters';
import { PriceChart } from './PriceChart';
import { Pagination } from './ui/Pagination';
import { SegmentedControl } from './ui/SegmentedControl';
import { EmptyState, ErrorState, Loading } from './ui/States';

const INTERVALS = [
  { value: 60, label: '۱ دقیقه' },
  { value: 300, label: '۵ دقیقه' },
  { value: 900, label: '۱۵ دقیقه' },
  { value: 3600, label: '۱ ساعت' },
];
const TICK_PAGE_SIZE = 50;

interface IntradayPanelProps {
  type: InstrumentType;
  symbol: string;
  /** Daily bars (newest first) used for the date picker and tick-vs-daily reconciliation. */
  daily: DailyHistoryItem[];
  /** Multiplier for trade value (1 for underlyings, contract size for options). */
  contractSize?: number;
}

function Match({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3 py-1.5 text-xs">
      <span className="text-slate-600">
        <span className={ok ? 'text-emerald-600' : 'text-amber-600'}>{ok ? '●' : '○'}</span> {label}
      </span>
      <span className="num text-slate-500">{detail}</span>
    </li>
  );
}

/** Intraday view: candles aggregated from GET /ticks plus a reconciliation against the daily bar. */
export function IntradayPanel({ type, symbol, daily, contractSize = 1 }: IntradayPanelProps) {
  const tradedDays = useMemo(() => daily.filter((d) => d.trade_count > 0 || d.volume > 0).slice(0, 120), [daily]);
  const [date, setDate] = useState<string>(''); // '' => backend default (latest day with ticks)
  const [bucketSec, setBucketSec] = useState(300);
  const [page, setPage] = useState(1);

  const { data, error, loading, reload } = useQuery(
    `ticks-day:${type}:${symbol}:${date}`,
    async () => {
      if (date) return fetchAllTicks(type, symbol, date);
      try {
        return await fetchAllTicks(type, symbol, undefined);
      } catch (e) {
        // Backend quirk: /ticks without ?date= answers 500 when the instrument has no ticks at all
        // (MAX(trade_date) is NULL). Fall back to the latest traded day, which takes the normal path.
        if (!(e instanceof ApiError) || e.status !== 500) throw e;
        const latest = tradedDays[0]?.trade_date;
        return latest ? fetchAllTicks(type, symbol, latest) : { items: [], totalItems: 0, truncated: false };
      }
    },
    { ttl: 300_000 }
  );

  const ticks = data?.items ?? [];
  const candles = useMemo(() => ticksToCandles(ticks, bucketSec), [ticks, bucketSec]);
  const totals = useMemo(() => {
    if (ticks.length === 0) return null;
    const prices = ticks.map((t) => t.price);
    return { volume: ticks.reduce((s, t) => s + t.volume, 0), high: Math.max(...prices), low: Math.min(...prices) };
  }, [ticks]);
  const dayBar = data?.tradeDate ? daily.find((d) => d.trade_date === data.tradeDate) : undefined;

  const totalPages = Math.max(1, Math.ceil(ticks.length / TICK_PAGE_SIZE));
  const meta: PaginationMeta = {
    currentPage: page,
    pageSize: TICK_PAGE_SIZE,
    totalItems: ticks.length,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
  const pageTicks = ticks.slice((page - 1) * TICK_PAGE_SIZE, page * TICK_PAGE_SIZE);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setPage(1);
          }}
          className="input w-auto py-1.5 text-xs"
          aria-label="روز معاملاتی"
        >
          <option value="">آخرین روز</option>
          {tradedDays.map((d) => (
            <option key={d.trade_date} value={d.trade_date}>
              {formatJalali(d.trade_date)}
            </option>
          ))}
        </select>
        <SegmentedControl ariaLabel="بازه کندل" value={bucketSec} onChange={setBucketSec} options={INTERVALS} />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <Loading />
      ) : ticks.length === 0 ? (
        <EmptyState title="برای این روز تیکی ثبت نشده است" />
      ) : (
        <>
          <p className="num text-xs text-slate-500">
            {formatJalali(data?.tradeDate)} · {formatCount(data?.totalItems)} معامله
            {data?.truncated && ` (نمایش ${formatCount(ticks.length)} مورد اول)`}
          </p>

          <PriceChart candles={candles} intraday height={320} />

          {totals && !data?.truncated && (
            <div>
              <p className="text-xs font-semibold text-slate-700">تطبیق با داده روزانه</p>
              {dayBar ? (
                <ul className="divide-y divide-slate-100">
                  <Match
                    ok={totals.volume === dayBar.volume}
                    label="حجم"
                    detail={`${formatCount(totals.volume)} / ${formatCount(dayBar.volume)}`}
                  />
                  <Match
                    ok={ticks.length === dayBar.trade_count}
                    label="تعداد معاملات"
                    detail={`${formatCount(ticks.length)} / ${formatCount(dayBar.trade_count)}`}
                  />
                  <Match
                    ok={totals.high <= dayBar.high_price && totals.low >= dayBar.low_price}
                    label="بازه قیمت"
                    detail={`${formatPrice(totals.low)}–${formatPrice(totals.high)} / ${formatPrice(dayBar.low_price)}–${formatPrice(dayBar.high_price)}`}
                  />
                </ul>
              ) : (
                <p className="mt-1 text-xs text-amber-700">برای این روز رکورد روزانه وجود ندارد.</p>
              )}
            </div>
          )}

          <div className="overflow-hidden rounded-md border border-slate-200">
            <div className="scroll-thin overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>ردیف</th>
                    <th>زمان</th>
                    <th>قیمت</th>
                    <th>حجم</th>
                    <th>ارزش (ریال)</th>
                  </tr>
                </thead>
                <tbody>
                  {pageTicks.map((t, i) => (
                    <tr key={t.id}>
                      <td className="num text-xs text-slate-400">
                        {toPersianDigits(t.sequence_number ?? (page - 1) * TICK_PAGE_SIZE + i + 1)}
                      </td>
                      <td className="num">{toPersianDigits(normalizeClock(t.trade_time))}</td>
                      <td className="num font-semibold text-slate-900">{formatPrice(t.price)}</td>
                      <td className="num">{formatCount(t.volume)}</td>
                      <td className="num text-slate-600">{formatCompact(t.price * t.volume * contractSize)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={meta} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
