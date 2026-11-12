import { useMemo, useState } from 'react';
import type { DailyHistoryItem } from '../types/api';
import { dailyToCandles } from '../utils/candles';
import { isoDayToDate, tehranToday } from '../utils/formatters';
import { PriceChart } from './PriceChart';
import { SegmentedControl } from './ui/SegmentedControl';
import { EmptyState } from './ui/States';

type Range = '1M' | '3M' | '6M' | '1Y' | 'ALL';
const RANGE_DAYS: Record<Exclude<Range, 'ALL'>, number> = { '1M': 31, '3M': 92, '6M': 183, '1Y': 366 };

function cutoff(range: Range): string | null {
  if (range === 'ALL') return null;
  const d = isoDayToDate(tehranToday());
  d.setUTCDate(d.getUTCDate() - RANGE_DAYS[range]);
  return d.toISOString().slice(0, 10);
}

interface DailyChartPanelProps {
  items: DailyHistoryItem[];
  /** Candles for underlyings; a close-price line reads better for thinly traded options. */
  mode?: 'candles' | 'line';
}

/** Daily OHLCV chart with range presets; data comes from GET /daily-history (already loaded by the page). */
export function DailyChartPanel({ items, mode = 'candles' }: DailyChartPanelProps) {
  const [range, setRange] = useState<Range>('6M');
  const all = useMemo(() => dailyToCandles(items), [items]);
  const candles = useMemo(() => {
    const from = cutoff(range);
    return from ? all.filter((c) => (c.time as string) >= from) : all;
  }, [all, range]);

  if (all.length === 0) return <EmptyState title="تاریخچه روزانه‌ای ثبت نشده است" />;

  return (
    <div className="space-y-3 p-4">
      <SegmentedControl<Range>
        ariaLabel="بازه زمانی"
        value={range}
        onChange={setRange}
        options={[
          { value: '1M', label: '۱ ماه' },
          { value: '3M', label: '۳ ماه' },
          { value: '6M', label: '۶ ماه' },
          { value: '1Y', label: '۱ سال' },
          { value: 'ALL', label: 'همه' },
        ]}
      />
      {candles.length === 0 ? (
        <EmptyState title="در این بازه معامله‌ای ثبت نشده است" />
      ) : (
        <PriceChart candles={candles} mode={mode} />
      )}
    </div>
  );
}
