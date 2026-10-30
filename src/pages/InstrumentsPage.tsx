import { useState, useMemo } from 'react';
import { RefreshCw, ServerOff } from 'lucide-react';
import type {
  MarketFilter,
  SortConfig,
  SortField,
  Underlying,
} from '../types/underlying';
import { useUnderlyings } from '../hooks/useUnderlyings';
import { normalizePersianText } from '../utils/normalizePersian';
import { KpiStrip } from '../components/KpiStrip';
import { Toolbar } from '../components/Toolbar';
import { UnderlyingsTable } from '../components/UnderlyingsTable';

interface InstrumentsPageProps {
  isOnline: boolean;
}

export function InstrumentsPage({ isOnline }: InstrumentsPageProps) {
  const { data, loading, error, reload } = useUnderlyings();

  const [searchQuery, setSearchQuery] = useState('');
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('همه');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'active_options_count',
    direction: 'desc',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await reload();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleSortChange = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setMarketFilter('همه');
    setSortConfig({
      field: 'active_options_count',
      direction: 'desc',
    });
  };

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchQuery.trim()) {
      const normalizedQuery = normalizePersianText(
        searchQuery.trim().toLowerCase()
      );
      result = result.filter(
        (item) =>
          normalizePersianText(item.symbol.toLowerCase()).includes(
            normalizedQuery
          ) ||
          normalizePersianText(item.name.toLowerCase()).includes(
            normalizedQuery
          ) ||
          item.insCode.includes(normalizedQuery)
      );
    }

    if (marketFilter !== 'همه') {
      result = result.filter((item) => item.market === marketFilter);
    }

    result.sort((a: Underlying, b: Underlying) => {
      const dir = sortConfig.direction === 'asc' ? 1 : -1;
      const field = sortConfig.field;

      if (field === 'symbol') {
        return a.symbol.localeCompare(b.symbol, 'fa') * dir;
      }
      if (field === 'name') {
        return a.name.localeCompare(b.name, 'fa') * dir;
      }
      if (field === 'market') {
        return a.market.localeCompare(b.market, 'fa') * dir;
      }

      const aVal = a[field] || 0;
      const bVal = b[field] || 0;
      return (aVal - bVal) * dir;
    });

    return result;
  }, [data, searchQuery, marketFilter, sortConfig]);

  // Loading State
  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-2">
        <div className="w-7 h-7 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">در حال دریافت اطلاعات از سرور بک‌اند...</span>
      </div>
    );
  }

  // Error State: Not connected to backend
  if (error && data.length === 0) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto py-12">
        <div className="bg-white border border-rose-200 rounded p-6 shadow-sm text-right space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
              <ServerOff size={22} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-900">
                خطا در برقراری ارتباط با سرور بک‌اند
              </h2>
              <p className="text-xs text-rose-700 mt-0.5">
                امکان دریافت داده‌های زنده از سرور بک‌اند (FastAPI) میسر نشد.
              </p>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded p-3 text-xs text-rose-800 space-y-1 font-mono" dir="ltr">
            <div>API Endpoint: http://localhost:8000/api/v1/underlyings</div>
            <div className="text-[11px] text-rose-600">Error: {error}</div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
            <div className="font-bold text-slate-800">راهنمای رفع مشکل:</div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
              <li>بررسی کنید سرویس بک‌اند روی پورت <code className="bg-slate-200 px-1 rounded">8000</code> در حال اجرا باشد.</li>
              <li>در صورت استفاده از داکر، دستور <code className="bg-slate-200 px-1 rounded">docker compose up -d</code> را در پوشه بک‌اند اجرا کنید.</li>
            </ul>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleRefresh}
              type="button"
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={isRefreshing ? 'animate-spin' : ''}
              />
              <span>تلاش مجدد برای برقراری ارتباط</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Top Title & Refresh */}
      <div className="flex items-center justify-between">

        <button
          onClick={handleRefresh}
          type="button"
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-60"
        >
          <RefreshCw
            size={11}
            className={`text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          <span>بروزرسانی داده‌ها</span>
        </button>
      </div>

      {/* 1. Summary KPI Strip */}
      <KpiStrip
        data={data}
        isOnline={isOnline}
      />

      {/* 2. Toolbar */}
      <Toolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        marketFilter={marketFilter}
        onMarketFilterChange={setMarketFilter}
        totalCount={data.length}
        filteredCount={filteredData.length}
        data={filteredData}
      />

      {/* 3. Underlyings Data Table */}
      <UnderlyingsTable
        data={filteredData}
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
}
