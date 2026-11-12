import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge, CodeChip } from '../components/Badges';
import { CoverageHeatmap, HEATMAP_LEGEND } from '../components/CoverageHeatmap';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { EmptyState, ErrorState, Loading } from '../components/ui/States';
import { COVERAGE_TARGET_PCT, DAILY_HISTORY_MAX_LIMIT, DATA_START_DATE } from '../config';
import { useQuery } from '../hooks/useQuery';
import { api, fetchLiveOptions } from '../services/api';
import { mapWithConcurrency } from '../utils/concurrency';
import {
  formatBytes,
  formatCompact,
  formatCount,
  formatJalali,
  formatPercent,
  formatTehranDateTime,
  toPersianDigits,
} from '../utils/formatters';
import { assessInstrument, buildTradingCalendar, groupCalendarByMonth } from '../utils/quality';
import type { QualityStatus } from '../utils/quality';
import { routes } from '../utils/routes';

const FANOUT_CONCURRENCY = 4;

const STATUS_UI: Record<QualityStatus, { label: string; tone: 'emerald' | 'amber' | 'rose' }> = {
  PASSED: { label: 'موفق', tone: 'emerald' },
  WARNING: { label: 'هشدار', tone: 'amber' },
  FAILED: { label: 'ناموفق', tone: 'rose' },
};

function Count({ value }: { value: number }) {
  return <span className={`num ${value ? 'font-semibold text-amber-600' : 'text-slate-400'}`}>{toPersianDigits(value)}</span>;
}

/** Loads full daily history for every underlying and runs the quality checks. */
async function loadQuality() {
  const { items: underlyings } = await api.underlyings();
  const histories = await mapWithConcurrency(underlyings, FANOUT_CONCURRENCY, (u) =>
    api.dailyHistory('UNDERLYING', u.symbol_fa, { from: DATA_START_DATE, limit: DAILY_HISTORY_MAX_LIMIT })
  );
  const calendar = buildTradingCalendar(histories.map((h) => h?.items));
  const results = underlyings.map((u, i) => assessInstrument(u, histories[i]?.items, calendar));
  return { calendar, results };
}

const gapText = (from: string, to: string) => (from === to ? formatJalali(from) : `${formatJalali(from)} تا ${formatJalali(to)}`);

export function DataQualityPage() {
  const status = useQuery('crawl-status', () => api.crawlStatus(), { ttl: 30_000 });
  const quality = useQuery('quality-daily', loadQuality, { ttl: 300_000 });
  const liveOptions = useQuery('live-options', () => fetchLiveOptions(), { ttl: 120_000 });

  const results = quality.data?.results ?? [];
  const calendar = quality.data?.calendar ?? [];
  const months = useMemo(() => groupCalendarByMonth(calendar), [calendar]);

  const summary = useMemo(() => {
    const withData = results.filter((r) => r.tradedDays > 0);
    return {
      passed: results.filter((r) => r.status === 'PASSED').length,
      avgCoverage: withData.length ? withData.reduce((s, r) => s + r.coveragePct, 0) / withData.length : 0,
    };
  }, [results]);

  const gaps = useMemo(() => {
    const noData = results.filter((r) => r.tradedDays === 0).map((r) => r.underlying.symbol_fa);
    const lateStart = results.filter((r) => r.firstDate && r.firstDate > (calendar[0] ?? DATA_START_DATE));
    // instruments without any data are listed in `noData`, not as one giant gap
    const biggest = results
      .filter((r) => r.tradedDays > 0)
      .flatMap((r) => r.gaps.map((g) => ({ ...g, symbol: r.underlying.symbol_fa })))
      .sort((a, b) => b.days - a.days)
      .slice(0, 10);
    return { noData, lateStart, biggest };
  }, [results, calendar]);

  const db = status.data?.database;
  const mf = status.data?.manifests;
  const job = status.data?.latest_job;

  return (
    <>
      <PageHeader
        title="کیفیت داده"
        subtitle={`از ${formatJalali(DATA_START_DATE)} · هدف پوشش ${toPersianDigits(COVERAGE_TARGET_PCT)}٪ روزهای معاملاتی`}
        actions={
          <button
            type="button"
            className="btn-secondary"
            disabled={quality.loading}
            onClick={() => {
              status.reload();
              quality.reload();
            }}
          >
            بررسی مجدد
          </button>
        }
      />

      {status.error ? (
        <div className="card">
          <ErrorState error={status.error} onRetry={status.reload} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="دارایی‌های پایه"
            value={formatCount(db?.underlyings_with_tsetmc_id)}
            loading={!db}
          />
          <StatCard
            label="قراردادها"
            value={formatCount(db?.options_total)}
            loading={!db}
            hint={liveOptions.data && `${formatCount(liveOptions.data.length)} فعال`}
          />
          <StatCard
            label="ردیف‌های روزانه / تیک"
            value={db ? `${formatCompact(db.daily_history_rows)} / ${formatCompact(db.tick_raw_rows)}` : '—'}
            loading={!db}
          />
          <StatCard
            label="فایل‌های خام (manifest)"
            value={formatCount(mf?.manifests_total)}
            loading={!mf}
            hint={mf && `${formatCount(mf.manifests_ok)} موفق · ${formatCount(mf.manifests_empty)} خالی · ${formatBytes(mf.raw_bytes_total)}`}
          />
        </div>
      )}

      <Card title="آخرین اجرای خزنده">
        {!status.data ? (
          <Loading className="py-6" />
        ) : !job ? (
          <EmptyState title="گزارشی از اجرای خزنده ثبت نشده است" className="py-6" />
        ) : (
          <div className="p-4">
            <div className="num grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
              {[
                ['شروع', formatTehranDateTime(job.started_at)],
                ['پایان', formatTehranDateTime(job.finished_at)],
                ['در صف', formatCount(job.total_queued)],
                ['رد شده (resume)', formatCount(job.skipped_resume)],
                ['موفق', formatCount(job.succeeded)],
                ['روز بدون معامله', formatCount(job.empty_days)],
                ['ناموفق', formatCount(job.failed)],
                ['ذخیره در DB', formatCount(job.db_rows_saved)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 border-b border-slate-100 py-1">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-800">{v}</span>
                </div>
              ))}
            </div>
            {job.circuit_broken && <p className="mt-3 text-xs text-rose-700">خزش به‌دلیل خطای زیاد متوقف شده است (circuit breaker).</p>}
            {job.errors && job.errors.length > 0 && (
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-rose-700">{toPersianDigits(job.errors.length)} خطا</summary>
                <ul className="ltr scroll-thin mt-2 max-h-40 space-y-1 overflow-y-auto font-mono text-[11px] text-slate-600">
                  {job.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </Card>

      {quality.error ? (
        <div className="card">
          <ErrorState error={quality.error} onRetry={quality.reload} />
        </div>
      ) : !quality.data ? (
        <div className="card">
          <Loading />
        </div>
      ) : calendar.length === 0 ? (
        <div className="card">
          <EmptyState title="هنوز تاریخچه روزانه‌ای در دیتابیس ثبت نشده است" />
        </div>
      ) : (
        <>
          <Card
            title="پوشش داده روزانه"
            actions={
              <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500">
                {HEATMAP_LEGEND.map(([cls, label]) => (
                  <span key={label} className="inline-flex items-center gap-1">
                    <span className={`h-2.5 w-2.5 rounded-sm ${cls}`} /> {label}
                  </span>
                ))}
              </div>
            }
          >
            <p className="num px-4 pt-3 text-xs text-slate-500">
              {formatCount(calendar.length)} روز معاملاتی ({formatJalali(calendar[0])} تا {formatJalali(calendar[calendar.length - 1])}) ·
              میانگین پوشش {formatPercent(summary.avgCoverage)} · {formatCount(summary.passed)} از {formatCount(results.length)} نماد موفق
            </p>
            <CoverageHeatmap items={results} months={months} />
          </Card>

          <Card title="بررسی‌ها به تفکیک نماد">
            <div className="scroll-thin overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>نماد</th>
                    <th>insCode</th>
                    <th>ردیف</th>
                    <th>بازه داده</th>
                    <th>پوشش</th>
                    <th title="ردیف تکراری برای یک روز">تکراری</th>
                    <th title="خارج از ترتیب زمانی">ترتیب</th>
                    <th title="کمترین ≤ اولین/پایانی ≤ بیشترین">OHLC نامعتبر</th>
                    <th>روز گمشده</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.underlying.id}>
                      <td>
                        <Link to={routes.underlying(r.underlying.symbol_fa)} className="font-semibold text-slate-900 hover:text-indigo-600">
                          {r.underlying.symbol_fa}
                        </Link>
                      </td>
                      <td><CodeChip value={r.underlying.tsetmc_id} /></td>
                      <td className="num">{formatCount(r.rows)}</td>
                      <td className="num text-xs text-slate-600">{r.firstDate ? `${formatJalali(r.firstDate)} – ${formatJalali(r.lastDate)}` : '—'}</td>
                      <td className="num font-semibold">{formatPercent(r.coveragePct)}</td>
                      <td><Count value={r.duplicates} /></td>
                      <td><Count value={r.orderViolations} /></td>
                      <td><Count value={r.ohlcViolations} /></td>
                      <td><Count value={r.missingDays.length} /></td>
                      <td><Badge tone={STATUS_UI[r.status].tone}>{STATUS_UI[r.status].label}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="شکاف‌ها">
            <div className="grid gap-6 p-4 text-sm md:grid-cols-2">
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-slate-500">بدون داده روزانه</dt>
                  <dd>{gaps.noData.join('، ') || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">شروع داده دیرتر از ابتدای بازه</dt>
                  <dd className="num">
                    {gaps.lateStart.length
                      ? gaps.lateStart.map((r) => `${r.underlying.symbol_fa} (${formatJalali(r.firstDate)})`).join('، ')
                      : '—'}
                  </dd>
                </div>
              </dl>
              <div>
                <p className="mb-1 text-xs text-slate-500">بزرگ‌ترین شکاف‌ها</p>
                {gaps.biggest.length === 0 ? (
                  <p>—</p>
                ) : (
                  <ul className="num divide-y divide-slate-100 text-xs">
                    {gaps.biggest.map((g) => (
                      <li key={`${g.symbol}-${g.from}`} className="flex justify-between py-1.5">
                        <span>
                          <b className="text-slate-800">{g.symbol}</b> <span className="text-slate-500">{gapText(g.from, g.to)}</span>
                        </span>
                        <span className="text-slate-700">{toPersianDigits(g.days)} روز</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
