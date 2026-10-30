import type { Underlying } from '../types/underlying';
import { toPersianDigits, formatCount } from '../utils/formatters';

interface KpiStripProps {
  data: Underlying[];
  isOnline: boolean;
}

export function KpiStrip({ data, isOnline }: KpiStripProps) {
  const totalAssets = data.length;
  const bourseCount = data.filter((d) => d.market === 'بورس').length;
  const farabourseCount = data.filter((d) => d.market === 'فرابورس').length;
  const fundCount = data.filter((d) => d.market === 'صندوق').length;

  const totalContracts = data.reduce(
    (sum, item) => sum + item.active_options_count,
    0
  );
  const totalCalls = data.reduce((sum, item) => sum + item.call_count, 0);
  const totalPuts = data.reduce((sum, item) => sum + item.put_count, 0);

  return (
    <div className="bg-white border border-slate-200 rounded text-slate-800 shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200 text-xs">
        {/* Metric 1: Total Underlyings */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500">
              تعداد کل دارایی‌های پایه
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">
                {formatCount(totalAssets)}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">نماد مرجع</span>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            <div>بورس: <strong className="text-slate-800 font-bold">{toPersianDigits(bourseCount)}</strong></div>
            <div>فرابورس: <strong className="text-slate-800 font-bold">{toPersianDigits(farabourseCount)}</strong> &bull; صندوق: <strong className="text-slate-800 font-bold">{toPersianDigits(fundCount)}</strong></div>
          </div>
        </div>

        {/* Metric 2: Active Contracts */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500">
              کل قراردادهای اختیار فعال
            </div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">
                {formatCount(totalContracts)}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">قرارداد کشف‌شده</span>
            </div>
          </div>
          <div className="text-right text-[11px] bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            <div className="text-emerald-700 font-medium">
              خرید (Call): <strong className="font-bold">{formatCount(totalCalls)}</strong>
            </div>
            <div className="text-rose-700 font-medium">
              فروش (Put): <strong className="font-bold">{formatCount(totalPuts)}</strong>
            </div>
          </div>
        </div>

        {/* Metric 3: Data Connection */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500">
              وضعیت اتصال داده‌ها
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-bold text-slate-800">
                {isOnline ? 'متصل به سرور' : 'قطع ارتباط با سرور'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
