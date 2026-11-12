import { useMemo, useState } from 'react';
import type { DailyHistoryItem, PaginationMeta } from '../types/api';
import { formatCompact, formatCount, formatJalali, formatPrice, formatPriceChange } from '../utils/formatters';
import { Pagination } from './ui/Pagination';
import { EmptyState } from './ui/States';

const PAGE_SIZE = 20;

interface DailyHistoryTableProps {
  items: DailyHistoryItem[]; // newest first
  showOpenInterest?: boolean;
}

/** Tabular daily OHLCV with Jalali dates and client-side pagination. */
export function DailyHistoryTable({ items, showOpenInterest }: DailyHistoryTableProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const slice = useMemo(() => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [items, page]);

  if (items.length === 0) {
    return <EmptyState title="رکورد روزانه‌ای وجود ندارد" />;
  }

  const meta: PaginationMeta = {
    currentPage: page,
    pageSize: PAGE_SIZE,
    totalItems: items.length,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  return (
    <div>
      <div className="scroll-thin overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>تاریخ</th>
              <th>اولین</th>
              <th>بیشترین</th>
              <th>کمترین</th>
              <th>پایانی</th>
              <th>تغییر</th>
              <th>حجم</th>
              <th>ارزش (ریال)</th>
              <th>تعداد معامله</th>
              {showOpenInterest && <th>موقعیت باز</th>}
            </tr>
          </thead>
          <tbody>
            {slice.map((d) => {
              const base = d.yesterday_price;
              const change = formatPriceChange(base ? ((d.close_price - base) / base) * 100 : undefined);
              return (
                <tr key={d.id}>
                  <td className="num text-slate-700">{formatJalali(d.trade_date)}</td>
                  <td className="num">{formatPrice(d.open_price)}</td>
                  <td className="num">{formatPrice(d.high_price)}</td>
                  <td className="num">{formatPrice(d.low_price)}</td>
                  <td className="num font-semibold text-slate-900">{formatPrice(d.close_price)}</td>
                  <td className={`num text-xs font-semibold ${change.colorClass}`}>{change.text}</td>
                  <td className="num">{formatCount(d.volume)}</td>
                  <td className="num text-slate-600">{formatCompact(d.value)}</td>
                  <td className="num">{formatCount(d.trade_count)}</td>
                  {showOpenInterest && <td className="num">{d.open_interest === undefined ? '—' : formatCount(d.open_interest)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} onPageChange={setPage} />
    </div>
  );
}
