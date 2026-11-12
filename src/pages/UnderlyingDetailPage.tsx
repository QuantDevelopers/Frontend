import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CodeChip, MarketBadge } from '../components/Badges';
import { DailyChartPanel } from '../components/DailyChartPanel';
import { DailyHistoryTable } from '../components/DailyHistoryTable';
import { BackLink, KpiTile } from '../components/DetailParts';
import { InstrumentTabs } from '../components/InstrumentTabs';
import { IntradayPanel } from '../components/IntradayPanel';
import { OptionsBrowser } from '../components/OptionsBrowser';
import { ErrorState, Loading, Skeleton } from '../components/ui/States';
import { useInstrumentDaily } from '../hooks/useInstrumentDaily';
import { useQuery } from '../hooks/useQuery';
import { api, fetchLiveOptions } from '../services/api';
import { formatCompact, formatCount, formatJalali, formatPrice, formatPriceChange, toPersianDigits } from '../utils/formatters';
import { tsetmcUrl } from '../utils/market';
import { routes } from '../utils/routes';

type Tab = 'chart' | 'intraday' | 'history' | 'options';

export function UnderlyingDetailPage() {
  const { symbol = '' } = useParams();
  const [tab, setTab] = useState<Tab>('chart');

  const asset = useQuery(`underlying:${symbol}`, () => api.underlying(symbol), { ttl: 300_000 });
  const daily = useInstrumentDaily('UNDERLYING', symbol);
  const counts = useQuery(`option-counts:${symbol}`, async () => {
    const live = await fetchLiveOptions({ symbol_ua: symbol });
    const calls = live.filter((o) => o.contract_type === 'CALL').length;
    return { calls, puts: live.length - calls };
  });

  if (asset.error) {
    return (
      <>
        <BackLink to={routes.instruments} label="ابزارها" />
        <div className="card">
          <ErrorState
            error={asset.error}
            title={asset.error.isNotFound ? `دارایی پایه «${symbol}» یافت نشد` : undefined}
            onRetry={asset.error.isNotFound ? undefined : asset.reload}
          />
        </div>
      </>
    );
  }
  if (!asset.data) return <Loading />;

  const u = asset.data;
  const items = daily.data?.items ?? [];
  const last = items[0];
  const base = items[1]?.close_price || last?.yesterday_price;
  const change = formatPriceChange(last && base ? ((last.close_price - base) / base) * 100 : undefined);

  return (
    <>
      <BackLink to={routes.instruments} label="ابزارها" />

      <section className="card">
        <div className="flex flex-wrap items-start justify-between gap-4 p-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{u.symbol_fa}</h1>
              <MarketBadge marketType={u.market_type} />
            </div>
            <p className="text-sm text-slate-600">{u.name_fa}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <CodeChip value={u.tsetmc_id} />
              {u.tsetmc_id && (
                <a href={tsetmcUrl(u.tsetmc_id)} target="_blank" rel="noopener noreferrer" className="link">
                  TSETMC
                </a>
              )}
              <Link to={routes.optionChain(u.symbol_fa)} className="link">
                زنجیره اختیار
              </Link>
            </div>
          </div>

          <div className="text-left">
            {daily.loading && !daily.data ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <p className="num text-2xl font-bold text-slate-900">
                  {formatPrice(last?.close_price)}
                  <span className={`mr-2 text-sm font-semibold ${change.colorClass}`}>{change.text}</span>
                </p>
                <p className="num text-xs text-slate-400">{last ? `پایانی ${formatJalali(last.trade_date)}` : 'بدون داده روزانه'}</p>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-slate-200 sm:grid-cols-3 lg:grid-cols-5">
          <KpiTile label="بازه روز" value={last ? `${formatPrice(last.low_price)} – ${formatPrice(last.high_price)}` : '—'} />
          <KpiTile label="حجم" value={last ? formatCount(last.volume) : '—'} />
          <KpiTile label="ارزش (ریال)" value={last ? formatCompact(last.value) : '—'} />
          <KpiTile label="تعداد معاملات" value={last ? formatCount(last.trade_count) : '—'} />
          <KpiTile
            label="قراردادهای فعال"
            value={counts.data ? `${toPersianDigits(counts.data.calls)} خرید · ${toPersianDigits(counts.data.puts)} فروش` : '—'}
          />
        </div>
      </section>

      <InstrumentTabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'chart', label: 'نمودار روزانه' },
          { value: 'intraday', label: 'درون‌روزی' },
          { value: 'history', label: 'تاریخچه' },
          { value: 'options', label: 'قراردادها' },
        ]}
      >
        {tab === 'options' ? (
          <OptionsBrowser underlyingSymbol={u.symbol_fa} />
        ) : daily.error ? (
          <ErrorState error={daily.error} onRetry={daily.reload} />
        ) : !daily.data ? (
          <Loading />
        ) : tab === 'chart' ? (
          <DailyChartPanel items={items} />
        ) : tab === 'intraday' ? (
          <IntradayPanel type="UNDERLYING" symbol={u.symbol_fa} daily={items} />
        ) : (
          <DailyHistoryTable items={items} />
        )}
      </InstrumentTabs>
    </>
  );
}
