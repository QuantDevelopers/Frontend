import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { EmptyState, ErrorState, Loading } from '../components/ui/States';
import { useMarketOverview } from '../hooks/useMarketOverview';
import { useQuery } from '../hooks/useQuery';
import { api } from '../services/api';
import { daysUntil, formatCompact, formatCount, formatJalali, formatJalaliLong, toPersianDigits } from '../utils/formatters';
import { routes } from '../utils/routes';

export function DashboardPage() {
  const overview = useMarketOverview();
  const status = useQuery('crawl-status', () => api.crawlStatus(), { ttl: 30_000 });
  const rows = overview.data?.rows ?? [];
  const db = status.data?.database;

  const byOptions = useMemo(
    () => rows.filter((r) => r.activeOptions > 0).sort((a, b) => b.activeOptions - a.activeOptions),
    [rows]
  );
  const maxOptions = byOptions[0]?.activeOptions ?? 0;

  const expiries = useMemo(() => {
    const map = new Map<string, { calls: number; puts: number }>();
    for (const o of overview.data?.activeOptions ?? []) {
      const day = o.expiration_date.slice(0, 10);
      const e = map.get(day) ?? { calls: 0, puts: 0 };
      if (o.contract_type === 'CALL') e.calls++;
      else e.puts++;
      map.set(day, e);
    }
    return [...map.entries()].filter(([day]) => daysUntil(day) >= 0).sort(([a], [b]) => a.localeCompare(b));
  }, [overview.data]);

  return (
    <>
      <PageHeader
        title="داشبورد"
        subtitle={overview.data?.latestTradeDate && `آخرین روز معاملاتی: ${formatJalaliLong(overview.data.latestTradeDate)}`}
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
            label="قراردادهای فعال"
            value={formatCount(overview.data?.activeOptions.length)}
            loading={!overview.data}
            hint={db && `از ${formatCount(db.options_total)} قرارداد ثبت‌شده`}
          />
          <StatCard label="ردیف‌های تاریخچه روزانه" value={formatCompact(db?.daily_history_rows)} loading={!db} />
          <StatCard label="تیک‌های خام" value={formatCompact(db?.tick_raw_rows)} loading={!db} />
        </div>
      )}

      {overview.error && !overview.data ? (
        <div className="card">
          <ErrorState error={overview.error} onRetry={overview.reload} />
        </div>
      ) : !overview.data ? (
        <div className="card">
          <Loading />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-5">
          <Card
            className="lg:col-span-3"
            title="قراردادهای فعال هر دارایی پایه"
            actions={<Link to={routes.instruments} className="link text-xs">همه ابزارها</Link>}
          >
            {byOptions.length === 0 ? (
              <EmptyState title="قرارداد فعالی ثبت نشده است" />
            ) : (
              <ul className="space-y-3 p-4">
                {byOptions.map((r) => (
                  <li key={r.underlying.id}>
                    <Link to={routes.optionChain(r.underlying.symbol_fa)} className="block hover:opacity-80">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-semibold text-slate-800">{r.underlying.symbol_fa}</span>
                        <span className="num text-slate-500">
                          {toPersianDigits(r.calls)} خرید · {toPersianDigits(r.puts)} فروش
                        </span>
                      </div>
                      <div className="flex h-2 overflow-hidden rounded bg-slate-100" style={{ width: `${(r.activeOptions / maxOptions) * 100}%` }}>
                        <span className="h-full bg-emerald-500" style={{ width: `${(r.calls / r.activeOptions) * 100}%` }} />
                        <span className="h-full bg-rose-500" style={{ width: `${(r.puts / r.activeOptions) * 100}%` }} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="lg:col-span-2" title="سررسیدهای پیش‌رو">
            {expiries.length === 0 ? (
              <EmptyState title="سررسیدی یافت نشد" />
            ) : (
              <table className="table-base">
                <thead>
                  <tr>
                    <th>تاریخ</th>
                    <th>مانده</th>
                    <th>خرید</th>
                    <th>فروش</th>
                  </tr>
                </thead>
                <tbody>
                  {expiries.map(([day, e]) => (
                    <tr key={day}>
                      <td className="num">{formatJalali(day)}</td>
                      <td className="num text-slate-500">{toPersianDigits(daysUntil(day))} روز</td>
                      <td className="num text-emerald-700">{toPersianDigits(e.calls)}</td>
                      <td className="num text-rose-700">{toPersianDigits(e.puts)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
