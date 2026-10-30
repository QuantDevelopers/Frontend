import { useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
} from 'lucide-react';
import type { Underlying, SortConfig, SortField } from '../types/underlying';
import {
  formatPrice,
  formatCount,
  toPersianDigits,
} from '../utils/formatters';
import { CopyButton } from './CopyButton';

interface UnderlyingsTableProps {
  data: Underlying[];
  sortConfig: SortConfig;
  onSortChange: (field: SortField) => void;
  onResetFilters?: () => void;
}

function MarketBadge({ market }: { market: string }) {
  if (market === 'بورس') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded-xs bg-sky-50 text-sky-800 border border-sky-300">
        بورس
      </span>
    );
  }
  if (market === 'فرابورس') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded-xs bg-indigo-50 text-indigo-800 border border-indigo-300">
        فرابورس
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded-xs bg-emerald-50 text-emerald-800 border border-emerald-300">
      صندوق ETF
    </span>
  );
}

export function UnderlyingsTable({
  data,
  sortConfig,
  onSortChange,
  onResetFilters,
}: UnderlyingsTableProps) {
  const navigate = useNavigate();

  const renderSortIndicator = (field: SortField) => {
    if (sortConfig.field !== field) {
      return (
        <ArrowUpDown
          size={10}
          className="text-slate-400 group-hover:text-slate-600 transition-colors mr-1 inline"
        />
      );
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={11} className="text-blue-600 inline mr-1 stroke-[2.5]" />
    ) : (
      <ArrowDown size={11} className="text-blue-600 inline mr-1 stroke-[2.5]" />
    );
  };

  if (data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded p-12 text-center shadow-xs space-y-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <Layers size={18} />
        </div>
        <div className="text-xs font-bold text-slate-800">
          هیچ دارایی پایه‌ای با معیارهای فیلتر یا جستجو یافت نشد
        </div>
        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
          عبارت جستجو را تغییر دهید یا فیلتر بازار را بازنشانی فرمایید.
        </p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 transition-colors cursor-pointer"
          >
            بازنشانی فیلترها
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-right border-collapse">
          <thead>
            <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold select-none text-[11px]">
              {/* 1. ردیف (#) */}
              <th className="px-2.5 py-2 w-10 text-center font-bold text-slate-500">
                #
              </th>

              {/* 2. نماد (symbol) */}
              <th
                onClick={() => onSortChange('symbol')}
                className="px-3 py-2 cursor-pointer group hover:bg-slate-200/60 transition-colors"
              >
                <span className="flex items-center">
                  نماد
                  {renderSortIndicator('symbol')}
                </span>
              </th>

              {/* 3. نام کامل شرکت (name) */}
              <th
                onClick={() => onSortChange('name')}
                className="px-3 py-2 cursor-pointer group hover:bg-slate-200/60 transition-colors hidden sm:table-cell"
              >
                <span className="flex items-center">
                  نام کامل شرکت
                  {renderSortIndicator('name')}
                </span>
              </th>

              {/* 4. شناسه یکتا (insCode) */}
              <th className="px-3 py-2 font-bold text-slate-700">
                شناسه یکتا (ISIN)
              </th>

              {/* 5. بازار (market) */}
              <th
                onClick={() => onSortChange('market')}
                className="px-3 py-2 cursor-pointer group hover:bg-slate-200/60 transition-colors text-center"
              >
                <span className="flex items-center justify-center">
                  بازار
                  {renderSortIndicator('market')}
                </span>
              </th>

              {/* 6. آخرین قیمت (last_price) */}
              <th
                onClick={() => onSortChange('last_price')}
                className="px-3 py-2 cursor-pointer group hover:bg-slate-200/60 transition-colors text-left"
              >
                <span className="flex items-center justify-end">
                  آخرین قیمت (ریال)
                  {renderSortIndicator('last_price')}
                </span>
              </th>

              {/* 7. قراردادهای فعال (active_options_count) */}
              <th
                onClick={() => onSortChange('active_options_count')}
                className="px-3 py-2 cursor-pointer group hover:bg-slate-200/60 transition-colors text-center min-w-[140px]"
              >
                <span className="flex items-center justify-center">
                  قراردادهای فعال
                  {renderSortIndicator('active_options_count')}
                </span>
              </th>

              {/* 8. روش کشف (discovered_by) */}
              <th className="px-3 py-2 text-center hidden md:table-cell font-bold text-slate-600">
                روش کشف
              </th>

              {/* 9. دکمه عملیات */}
              <th className="px-3 py-2 text-center w-36 font-bold">
                عملیات
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {data.map((item, index) => {
              return (
                <tr
                  key={item.insCode}
                  className="group bg-white hover:bg-slate-50 transition-colors"
                >
                  {/* 1. ردیف */}
                  <td className="px-2.5 py-2 text-center text-slate-400 font-medium text-[11px]">
                    {toPersianDigits(index + 1)}
                  </td>

                  {/* 2. نماد (bold) */}
                  <td className="px-3 py-2">
                    <button
                      onClick={() => navigate(`/instruments/${item.insCode}`)}
                      type="button"
                      className="font-bold text-slate-900 hover:text-blue-700 transition-colors text-xs text-right cursor-pointer"
                    >
                      {item.symbol}
                    </button>
                  </td>

                  {/* 3. نام کامل شرکت */}
                  <td className="px-3 py-2 text-slate-600 hidden sm:table-cell max-w-[200px] truncate text-xs">
                    <span title={item.name}>{item.name}</span>
                  </td>

                  {/* 4. شناسه یکتا (insCode - Latin monospace with copy button) */}
                  <td className="px-3 py-2">
                    <div className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      <span className="font-mono text-[11px] text-slate-800 tracking-wider select-all" dir="ltr">
                        {item.insCode}
                      </span>
                      <CopyButton text={item.insCode} />
                    </div>
                  </td>

                  {/* 5. بازار */}
                  <td className="px-3 py-2 text-center">
                    <MarketBadge market={item.market} />
                  </td>

                  {/* 6. آخرین قیمت (Persian digits + Comma) */}
                  <td className="px-3 py-2 text-left font-bold text-slate-900 text-xs">
                    <span>{formatPrice(item.last_price)}</span>
                    <span className="text-[10px] text-slate-400 font-normal mr-1">ریال</span>
                  </td>

                  {/* 7. قراردادهای فعال (Persian digits) */}
                  <td className="px-3 py-2 text-center">
                    <div className="inline-flex items-center gap-1.5 text-xs">
                      <span className="font-bold text-slate-800">
                        {toPersianDigits(item.active_options_count)}
                      </span>
                      <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        <span className="text-emerald-700 font-bold">{toPersianDigits(item.call_count)} خ</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-rose-700 font-bold">{toPersianDigits(item.put_count)} ف</span>
                      </span>
                    </div>
                  </td>

                  {/* 8. روش کشف */}
                  <td className="px-3 py-2 text-center hidden md:table-cell">
                    <code className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-mono" dir="ltr">
                      {item.discovered_by}
                    </code>
                  </td>

                  {/* 9. دکمه عملیات: «مشاهده زنجیره اختیار» */}
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => navigate(`/instruments/${item.insCode}`)}
                      type="button"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>مشاهده زنجیره اختیار</span>
                      <ExternalLink size={10} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table summary note */}
      <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <span>تعداد کل نمادها: <strong className="text-slate-900 font-bold">{formatCount(data.length)}</strong> نماد مرجع</span>
        <span className="text-[11px] text-slate-400">منبع داده: TSETMC</span>
      </div>
    </div>
  );
}
