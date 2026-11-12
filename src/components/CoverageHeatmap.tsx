import type { InstrumentQuality, MonthBucket } from '../utils/quality';
import { formatJalaliMonth, formatPercent, toPersianDigits } from '../utils/formatters';

const jMonthShort = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'short', timeZone: 'UTC' });
const jYear = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: '2-digit', timeZone: 'UTC' });

function cellClass(pct: number | null): string {
  if (pct === null) return 'bg-slate-100/60';
  if (pct >= 100) return 'bg-emerald-500';
  if (pct >= 98) return 'bg-emerald-400';
  if (pct >= 90) return 'bg-lime-400';
  if (pct >= 75) return 'bg-amber-300';
  if (pct > 0) return 'bg-orange-400';
  return 'bg-rose-500';
}

export const HEATMAP_LEGEND: [string, string][] = [
  ['bg-emerald-500', '۱۰۰٪'],
  ['bg-emerald-400', '≥ ۹۸٪'],
  ['bg-lime-400', '≥ ۹۰٪'],
  ['bg-amber-300', '≥ ۷۵٪'],
  ['bg-orange-400', '< ۷۵٪'],
  ['bg-rose-500', 'بدون داده'],
  ['bg-slate-100', 'قبل از درج'],
];

interface CoverageHeatmapProps {
  items: InstrumentQuality[];
  months: MonthBucket[];
}

/** Underlyings × Jalali months; each cell = share of trading days with a daily bar. */
export function CoverageHeatmap({ items, months }: CoverageHeatmapProps) {
  return (
    <div className="scroll-thin overflow-x-auto p-4">
      <table className="border-separate border-spacing-[3px] text-[11px]">
        <thead>
          <tr>
            <th className="sticky right-0 z-10 bg-white" />
            {months.map((m, i) => {
              const d = new Date(`${m.sampleDay}T00:00:00Z`);
              const showYear = i === 0 || m.key.endsWith('-01');
              return (
                <th key={m.key} className="min-w-[22px] pb-1 align-bottom font-normal text-slate-400">
                  <span className="block whitespace-nowrap [writing-mode:vertical-rl] rotate-180 leading-none">
                    {jMonthShort.format(d)}
                    {showYear && <b className="text-slate-600"> {jYear.format(d)}</b>}
                  </span>
                </th>
              );
            })}
            <th className="px-2 font-medium text-slate-500">پوشش</th>
          </tr>
        </thead>
        <tbody>
          {items.map((q) => {
            const sym = q.underlying.symbol_fa;
            return (
              <tr key={q.underlying.id}>
                <th className="sticky right-0 z-10 whitespace-nowrap bg-white px-2 text-right font-medium text-slate-700">
                  {sym}
                </th>
                {months.map((m) => {
                  const expected = q.firstDate ? m.days.filter((d) => d >= q.firstDate!) : m.days;
                  const present = expected.filter((d) => q.days.has(d)).length;
                  const pct = expected.length === 0 ? null : (present / expected.length) * 100;
                  const tip = `${sym} · ${formatJalaliMonth(m.sampleDay)} · ${toPersianDigits(present)} از ${toPersianDigits(expected.length)} روز معاملاتی`;
                  return (
                    <td key={m.key} title={tip} className="p-0">
                      <span className={`block h-[18px] w-[22px] rounded-sm ${cellClass(pct)}`} />
                    </td>
                  );
                })}
                <td className="num whitespace-nowrap px-2 text-slate-700">{formatPercent(q.coveragePct)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
