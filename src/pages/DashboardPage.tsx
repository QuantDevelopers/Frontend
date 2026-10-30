import { Link } from 'react-router-dom';
import { useUnderlyings } from '../hooks/useUnderlyings';
import { toPersianDigits, formatPrice, formatCount } from '../utils/formatters';
import { ArrowLeft, Activity, ServerOff, RefreshCw } from 'lucide-react';

export function DashboardPage() {
  const { data, loading, error, reload } = useUnderlyings();

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-2">
        <div className="w-7 h-7 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">در حال بارگذاری اطلاعات داشبورد از سرور...</span>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12 text-right">
        <div className="bg-white border border-rose-200 rounded p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
              <ServerOff size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-900">عدم برقراری ارتباط با سرور بک‌اند</h2>
              <p className="text-xs text-rose-700">داده‌های داشبورد از سرور در دسترس نیست.</p>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            لطفاً اطمینان حاصل کنید سرور FastAPI روی پورت ۸۰۰۰ فعال است.
          </p>
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => reload()}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded hover:bg-slate-800"
            >
              <RefreshCw size={12} />
              <span>تلاش مجدد</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

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

  // Top 5 underlyings by active option contracts
  const top5 = [...data]
    .sort((a, b) => b.active_options_count - a.active_options_count)
    .slice(0, 5);

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div>
        <h1 className="text-sm font-bold text-slate-900">
          داشبورد تحلیلی بازار مشتقه (Overview)
        </h1>
        <p className="text-[11px] text-slate-500 mt-0.5">
          نمای کلی توزیع دارایی‌های پایه و وضعیت قراردادهای اختیار معامله بورس تهران
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded border border-slate-200 p-3.5 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">
            مجموع نمادهای پایه تحت پوشش
          </span>
          <div className="text-xl font-bold text-slate-900">
            {toPersianDigits(totalAssets)} <span className="text-xs font-normal text-slate-500">نماد مرجع</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {toPersianDigits(bourseCount)} بورس &bull; {toPersianDigits(farabourseCount)} فرابورس &bull; {toPersianDigits(fundCount)} صندوق ETF
          </div>
        </div>

        <div className="bg-white rounded border border-slate-200 p-3.5 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">
            مجموع قراردادهای فعال اختیار
          </span>
          <div className="text-xl font-bold text-slate-900">
            {formatCount(totalContracts)} <span className="text-xs font-normal text-slate-500">قرارداد</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600">
            خرید (Call): <strong className="text-emerald-700">{formatCount(totalCalls)}</strong> &bull; فروش (Put): <strong className="text-rose-700">{formatCount(totalPuts)}</strong>
          </div>
        </div>

        <div className="bg-white rounded border border-slate-200 p-3.5 shadow-xs">
          <span className="text-[11px] text-slate-500 font-medium block mb-1">
            منبع زنده داده‌های بازار
          </span>
          <div className="text-sm font-bold text-slate-800 mt-1 font-mono" dir="ltr">
            FastAPI :8000 /api/v1/underlyings
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium">
            پایش آنلاین ۲۵ نماد مرجع بازار مشتقه
          </div>
        </div>
      </div>

      {/* Top 5 Active Option Underlyings */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-3.5 py-2.5 border-b border-slate-200 bg-slate-100/80 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Activity size={13} className="text-slate-700" />
            ۵ دارایی پایه با بیشترین قرارداد فعال اختیار
          </h2>

          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-medium"
          >
            <span>مشاهده همه ابزارها</span>
            <ArrowLeft size={11} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                <th className="px-2.5 py-2 text-center w-10">#</th>
                <th className="px-3.5 py-2">نماد</th>
                <th className="px-3.5 py-2">نام شرکت</th>
                <th className="px-3.5 py-2 text-center">بازار</th>
                <th className="px-3.5 py-2 text-left">آخرین قیمت (ریال)</th>
                <th className="px-3.5 py-2 text-center">قراردادهای فعال</th>
                <th className="px-3 py-2 text-center w-28">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {top5.map((item, idx) => (
                <tr key={item.insCode} className="hover:bg-slate-50 transition-colors">
                  <td className="px-2.5 py-2 text-center text-slate-400 font-medium text-[11px]">
                    {toPersianDigits(idx + 1)}
                  </td>
                  <td className="px-3.5 py-2 font-bold text-slate-900">
                    {item.symbol}
                  </td>
                  <td className="px-3.5 py-2 text-slate-600">
                    {item.name}
                  </td>
                  <td className="px-3.5 py-2 text-center">
                    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded-xs bg-slate-100 text-slate-700 border border-slate-300">
                      {item.market}
                    </span>
                  </td>
                  <td className="px-3.5 py-2 text-left font-bold text-slate-900">
                    {formatPrice(item.last_price)}
                  </td>
                  <td className="px-3.5 py-2 text-center font-bold text-slate-800">
                    {toPersianDigits(item.active_options_count)} قرارداد
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Link
                      to={`/instruments/${item.insCode}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-900 hover:text-white transition-colors"
                    >
                      زنجیره اختیار
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
