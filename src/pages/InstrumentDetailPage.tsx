import { useParams, Link } from 'react-router-dom';
import {
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useUnderlyings } from '../hooks/useUnderlyings';
import {
  formatPrice,
  toPersianDigits,
} from '../utils/formatters';
import { CopyButton } from '../components/CopyButton';
import { normalizePersianText } from '../utils/normalizePersian';

export function InstrumentDetailPage() {
  const { insCode } = useParams<{ insCode: string }>();
  const { data, loading } = useUnderlyings();

  const normalizedParam = insCode ? normalizePersianText(insCode) : '';
  const asset = data.find(
    (u) =>
      u.insCode === insCode ||
      normalizePersianText(u.symbol) === normalizedParam ||
      normalizePersianText(u.name) === normalizedParam
  );

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-2">
        <div className="w-7 h-7 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">در حال دریافت اطلاعات نماد از سرور...</span>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="space-y-4 max-w-7xl mx-auto py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 font-medium transition-colors"
        >
          <ArrowRight size={13} />
          بازگشت به فهرست دارایی‌ها
        </Link>
        <div className="bg-white border border-slate-200 rounded p-8 text-center space-y-2">
          <div className="text-xs font-bold text-slate-800">
            دارایی پایه با شناسه «{insCode}» یافت نشد.
          </div>
          <div>
            <Link
              to="/"
              className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded hover:bg-slate-800"
            >
              بازگشت به فهرست ابزارها
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Representative strike prices around last_price
  const price = asset.last_price > 0 ? asset.last_price : 20000;
  const strikeStep = Math.max(Math.round((price * 0.05) / 50) * 50, 50);
  const baseStrike = Math.round(price / strikeStep) * strikeStep;

  const strikePrices = [
    baseStrike - 3 * strikeStep,
    baseStrike - 2 * strikeStep,
    baseStrike - 1 * strikeStep,
    baseStrike,
    baseStrike + 1 * strikeStep,
    baseStrike + 2 * strikeStep,
    baseStrike + 3 * strikeStep,
  ];

  return (
    <div className="space-y-3 max-w-7xl mx-auto">
      {/* Back link */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors"
        >
          <ArrowRight size={12} />
          <span>بازگشت به فهرست دارایی‌های پایه</span>
        </Link>
      </div>

      {/* Asset Header Card */}
      <div className="bg-white border border-slate-200 rounded p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">
                {asset.symbol}
              </h1>
              <span className="text-xs text-slate-600 font-medium">
                {asset.name}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-slate-100 text-slate-800 border border-slate-300">
                {asset.market}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span>شناسه یکتا:</span>
                <span className="font-mono text-[11px] text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 select-all" dir="ltr">
                  {asset.insCode}
                </span>
                <CopyButton text={asset.insCode} />
              </span>

              <span className="text-slate-300">|</span>

              <a
                href={`http://www.tsetmc.com/Loader.aspx?ParTree=151311&i=${asset.insCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900"
              >
                <span>مشاهده در TSETMC</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* Asset Price & Active Options */}
          <div className="flex items-center gap-4 text-xs bg-slate-50 px-3 py-2 rounded border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px]">آخرین قیمت سهم</span>
              <span className="font-bold text-slate-900">
                {formatPrice(asset.last_price)} <span className="text-[10px] text-slate-400 font-normal">ریال</span>
              </span>
            </div>

            <div className="h-6 w-px bg-slate-200" />

            <div>
              <span className="text-slate-400 block text-[10px]">قراردادهای فعال</span>
              <span className="font-bold text-slate-800">
                {toPersianDigits(asset.active_options_count)}
                <span className="text-[10px] font-normal text-slate-600 mr-1.5">
                  (<strong className="text-emerald-700">{toPersianDigits(asset.call_count)} خرید</strong> / <strong className="text-rose-700">{toPersianDigits(asset.put_count)} فروش</strong>)
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Structured Placeholder Table for Option Chain */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-xs">
        <div className="px-3.5 py-2.5 border-b border-slate-200 bg-slate-100/80 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800">
            ساختار زنجیره اختیار معامله (Option Chain Preview)
          </h2>
          <span className="text-[10px] text-slate-500 font-mono" dir="ltr">
            Sprint 2 Ready
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              {/* Category Header */}
              <tr className="border-b border-slate-200">
                <th
                  colSpan={2}
                  className="px-3 py-1.5 text-center text-emerald-800 bg-emerald-50/70 font-bold border-l border-slate-200 text-xs"
                >
                  اختیار خرید (Call Options)
                </th>

                <th className="px-4 py-1.5 text-center text-slate-800 bg-slate-100 font-bold border-l border-slate-200 text-xs min-w-[120px]">
                  قیمت اعمال (Strike)
                </th>

                <th
                  colSpan={2}
                  className="px-3 py-1.5 text-center text-rose-800 bg-rose-50/70 font-bold text-xs"
                >
                  اختیار فروش (Put Options)
                </th>
              </tr>

              {/* Sub-header */}
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50 text-[11px] font-bold">
                <th className="px-3 py-1.5 text-center">نماد قرارداد</th>
                <th className="px-3 py-1.5 text-left border-l border-slate-200">
                  آخرین معامله (ریال)
                </th>

                <th className="px-3 py-1.5 text-center border-l border-slate-200 bg-slate-100/70 text-slate-800">
                  قیمت اعمال
                </th>

                <th className="px-3 py-1.5 text-left">آخرین معامله (ریال)</th>
                <th className="px-3 py-1.5 text-center">نماد قرارداد</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {strikePrices.map((strike, idx) => {
                const isATM = strike === baseStrike;
                const isCallITM = strike < price;
                const isPutITM = strike > price;

                const shortSym = asset.symbol.slice(0, 3);
                const callSym = `ض${shortSym}${8000 + idx * 10}`;
                const putSym = `ط${shortSym}${8000 + idx * 10}`;

                return (
                  <tr
                    key={strike}
                    className={`transition-colors ${
                      isATM ? 'bg-amber-50/60 font-medium' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-3 py-2 text-center text-emerald-800 font-bold">
                      {callSym}
                    </td>

                    <td className="px-3 py-2 text-left text-slate-800 border-l border-slate-200 font-medium">
                      {isCallITM
                        ? formatPrice(Math.round(price - strike + strike * 0.04))
                        : formatPrice(Math.round(strike * 0.03))}
                    </td>

                    <td
                      className={`px-3 py-2 text-center font-bold border-l border-slate-200 ${
                        isATM ? 'bg-amber-100/70 text-amber-950' : 'bg-slate-50 text-slate-900'
                      }`}
                    >
                      {formatPrice(strike)}
                    </td>

                    <td className="px-3 py-2 text-left text-slate-800 font-medium">
                      {isPutITM
                        ? formatPrice(Math.round(strike - price + strike * 0.04))
                        : formatPrice(Math.round(strike * 0.03))}
                    </td>

                    <td className="px-3 py-2 text-center text-rose-800 font-bold">
                      {putSym}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
