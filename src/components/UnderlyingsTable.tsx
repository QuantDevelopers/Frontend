import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { UnderlyingRow } from '../hooks/useMarketOverview';
import {
  daysUntil,
  formatJalali,
  formatPrice,
  formatPriceChange,
  toPersianDigits,
} from '../utils/formatters';
import { routes } from '../utils/routes';
import { CodeChip, MarketBadge } from './Badges';

export type UnderlyingSortField = 'symbol' | 'market' | 'close' | 'change' | 'options' | 'expiry';
export interface SortState {
  field: UnderlyingSortField;
  dir: 'asc' | 'desc';
}

interface UnderlyingsTableProps {
  rows: UnderlyingRow[];
  sort: SortState;
  onSort: (field: UnderlyingSortField) => void;
}

export function sortUnderlyingRows(rows: UnderlyingRow[], { field, dir }: SortState): UnderlyingRow[] {
  const sign = dir === 'asc' ? 1 : -1;
  const num = (v: number | undefined) => (v === undefined ? -Infinity : v);
  const value = (r: UnderlyingRow): number | string => {
    switch (field) {
      case 'symbol':
        return r.underlying.symbol_fa;
      case 'market':
        return r.underlying.market_type;
      case 'close':
        return num(r.last?.close_price);
      case 'change':
        return num(r.changePct);
      case 'options':
        return r.activeOptions;
      case 'expiry':
        return r.nearestExpiry ?? '9999';
    }
  };
  return [...rows].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb, 'fa') * sign;
    return ((va as number) - (vb as number)) * sign;
  });
}

function SortHeader({
  field,
  label,
  sort,
  onSort,
  className = '',
}: {
  field: UnderlyingSortField;
  label: string;
  sort: SortState;
  onSort: (f: UnderlyingSortField) => void;
  className?: string;
}) {
  const active = sort.field === field;
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th className={className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 hover:text-slate-800 ${active ? 'text-indigo-600' : ''}`}
      >
        {label}
        <Icon size={12} className={active ? '' : 'opacity-40'} />
      </button>
    </th>
  );
}

export function UnderlyingsTable({ rows, sort, onSort }: UnderlyingsTableProps) {
  return (
    <div className="scroll-thin overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            <th className="w-10 text-center">#</th>
            <SortHeader field="symbol" label="نماد" sort={sort} onSort={onSort} />
            <th>insCode</th>
            <SortHeader field="market" label="بازار" sort={sort} onSort={onSort} />
            <SortHeader field="close" label="آخرین پایانی (ریال)" sort={sort} onSort={onSort} />
            <SortHeader field="change" label="تغییر" sort={sort} onSort={onSort} />
            <SortHeader field="options" label="قراردادهای فعال" sort={sort} onSort={onSort} />
            <SortHeader field="expiry" label="نزدیک‌ترین سررسید" sort={sort} onSort={onSort} />
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const change = formatPriceChange(r.changePct);
            const days = r.nearestExpiry ? daysUntil(r.nearestExpiry) : undefined;
            return (
              <tr key={r.underlying.id}>
                <td className="num text-center text-xs text-slate-400">{toPersianDigits(i + 1)}</td>
                <td>
                  <Link to={routes.underlying(r.underlying.symbol_fa)} className="group block">
                    <span className="block font-semibold text-slate-900 group-hover:text-indigo-600">
                      {r.underlying.symbol_fa}
                    </span>
                    <span className="block max-w-[220px] truncate text-[11px] text-slate-500" title={r.underlying.name_fa}>
                      {r.underlying.name_fa}
                    </span>
                  </Link>
                </td>
                <td>
                  <CodeChip value={r.underlying.tsetmc_id} />
                </td>
                <td>
                  <MarketBadge marketType={r.underlying.market_type} />
                </td>
                <td className="num">
                  <span className="font-semibold text-slate-900">{formatPrice(r.last?.close_price)}</span>
                  {r.last && <span className="block text-[11px] text-slate-400">{formatJalali(r.last.trade_date)}</span>}
                </td>
                <td className={`num text-xs font-semibold ${change.colorClass}`}>{change.text}</td>
                <td className="num">
                  {r.activeOptions > 0 ? (
                    <span className="inline-flex items-center gap-2">
                      <b className="text-slate-900">{toPersianDigits(r.activeOptions)}</b>
                      <span className="text-[11px]">
                        <span className="text-emerald-600">{toPersianDigits(r.calls)} خ</span>
                        <span className="mx-1 text-slate-300">/</span>
                        <span className="text-rose-600">{toPersianDigits(r.puts)} ف</span>
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="num">
                  {r.nearestExpiry ? (
                    <>
                      <span className="text-slate-700">{formatJalali(r.nearestExpiry)}</span>
                      {days !== undefined && (
                        <span className="block text-[11px] text-slate-400">{toPersianDigits(days)} روز مانده</span>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td>
                  {r.activeOptions > 0 && (
                    <Link to={routes.optionChain(r.underlying.symbol_fa)} className="link text-xs">
                      زنجیره
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
