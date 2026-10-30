import { useRef, useEffect } from 'react';
import {
  Search,
  X,
  Download,
} from 'lucide-react';
import type {
  MarketFilter,
  Underlying,
} from '../types/underlying';
import { toPersianDigits, formatCount } from '../utils/formatters';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  marketFilter: MarketFilter;
  onMarketFilterChange: (filter: MarketFilter) => void;
  totalCount: number;
  filteredCount: number;
  data: Underlying[];
}

export function Toolbar({
  searchQuery,
  onSearchChange,
  marketFilter,
  onMarketFilterChange,
  totalCount,
  filteredCount,
  data,
}: ToolbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        onSearchChange('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearchChange]);

  const handleExportCSV = () => {
    const headers = [
      'ردیف',
      'نماد',
      'نام شرکت',
      'شناسه یکتا (insCode)',
      'بازار',
      'آخرین قیمت (ریال)',
      'قراردادهای فعال',
      'اختیار خرید (Call)',
      'اختیار فروش (Put)',
      'روش کشف',
    ];

    const rows = data.map((item, idx) => [
      idx + 1,
      `"${item.symbol}"`,
      `"${item.name}"`,
      `"${item.insCode}"`,
      `"${item.market}"`,
      item.last_price,
      item.active_options_count,
      item.call_count,
      item.put_count,
      `"${item.discovered_by}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Underlyings_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const marketOptions: { label: string; value: MarketFilter }[] = [
    { label: 'همه بازارها', value: 'همه' },
    { label: 'بورس', value: 'بورس' },
    { label: 'فرابورس', value: 'فرابورس' },
    { label: 'صندوق', value: 'صندوق' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded p-2.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search
          size={13}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="جستجو بر اساس نماد، نام شرکت یا شناسه..."
          className="w-full pr-8 pl-8 py-1.5 text-xs border border-slate-300 rounded bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            type="button"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
            title="پاک کردن جستجو"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Market Filter & Actions */}
      <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
        <div className="inline-flex rounded border border-slate-300 bg-slate-50 p-0.5 text-xs">
          {marketOptions.map((opt) => {
            const active = marketFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onMarketFilterChange(opt.value)}
                className={`px-2.5 py-1 text-xs rounded-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-500 hidden md:inline">
          نمایش <strong className="text-slate-900 font-bold">{toPersianDigits(filteredCount)}</strong> از{' '}
          {formatCount(totalCount)}
        </div>

        {/* Export to CSV */}
        <button
          onClick={handleExportCSV}
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors cursor-pointer"
          title="دانلود جدول دارایی‌های پایه در فرمت اکسل CSV"
        >
          <Download size={12} className="text-slate-500" />
          <span>خروجی CSV</span>
        </button>
      </div>
    </div>
  );
}
