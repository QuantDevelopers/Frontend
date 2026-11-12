import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CodeChip, ContractTypeBadge, MoneynessBadge, StatusBadge } from '../components/Badges';
import { DailyChartPanel } from '../components/DailyChartPanel';
import { DailyHistoryTable } from '../components/DailyHistoryTable';
import { BackLink, KpiTile } from '../components/DetailParts';
import { InstrumentTabs } from '../components/InstrumentTabs';
import { IntradayPanel } from '../components/IntradayPanel';
import { ErrorState, Loading } from '../components/ui/States';
import { useInstrumentDaily } from '../hooks/useInstrumentDaily';
import { useQuery } from '../hooks/useQuery';
import { api } from '../services/api';
import { daysUntil, formatCount, formatJalali, formatPrice, toPersianDigits } from '../utils/formatters';
import { classifyMoneyness, tsetmcUrl } from '../utils/market';
import { routes } from '../utils/routes';

type Tab = 'chart' | 'intraday' | 'history';

export function OptionDetailPage() {
  const { symbol = '' } = useParams();
  const [tab, setTab] = useState<Tab>('chart');

  const option = useQuery(`option:${symbol}`, () => api.option(symbol), { ttl: 300_000 });
  const underlyings = useQuery('underlyings', () => api.underlyings(), { ttl: 300_000 });
  const daily = useInstrumentDaily('OPTION', symbol);

  const ua = underlyings.data?.items.find((u) => u.id === option.data?.underlying_asset_id);
  const uaLast = useQuery(ua ? `ua-last:${ua.symbol_fa}` : null, () => api.dailyHistory('UNDERLYING', ua!.symbol_fa, { limit: 1 }));

  const backTo = ua ? routes.optionChain(ua.symbol_fa) : `${routes.instruments}?tab=options`;
  const backLabel = ua ? `زنجیره ${ua.symbol_fa}` : 'قراردادها';

  if (option.error) {
    return (
      <>
        <BackLink to={backTo} label={backLabel} />
        <div className="card">
          <ErrorState
            error={option.error}
            title={option.error.isNotFound ? `قرارداد «${symbol}» یافت نشد` : undefined}
            onRetry={option.error.isNotFound ? undefined : option.reload}
          />
        </div>
      </>
    );
  }
  if (!option.data) return <Loading />;

  const o = option.data;
  const exp = o.expiration_date.slice(0, 10);
  const days = daysUntil(exp);
  const items = daily.data?.items ?? [];
  const last = items[0];
  const spot = uaLast.data?.items[0]?.close_price;
  const moneyness = spot ? classifyMoneyness(o.contract_type, o.strike_price, spot) : null;

  return (
    <>
      <BackLink to={backTo} label={backLabel} />

      <section className="card">
        <div className="flex flex-wrap items-start justify-between gap-4 p-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{o.symbol_fa}</h1>
              <ContractTypeBadge type={o.contract_type} />
              <StatusBadge status={o.status} isActive={o.is_active} />
              {moneyness && <MoneynessBadge value={moneyness} />}
            </div>
            <p className="text-sm text-slate-600">{o.name_fa}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <CodeChip value={o.tsetmc_id} />
              {o.isin && <CodeChip value={o.isin} />}
              {o.tsetmc_id && (
                <a href={tsetmcUrl(o.tsetmc_id)} target="_blank" rel="noopener noreferrer" className="link">
                  TSETMC
                </a>
              )}
              {ua && (
                <Link to={routes.underlying(ua.symbol_fa)} className="link">
                  دارایی پایه: {ua.symbol_fa}
                </Link>
              )}
            </div>
          </div>
          <div className="text-left">
            <p className="num text-2xl font-bold text-slate-900">{formatPrice(last?.close_price)}</p>
            <p className="num text-xs text-slate-400">{last ? `پایانی ${formatJalali(last.trade_date)}` : 'بدون معامله'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-slate-200 sm:grid-cols-3 lg:grid-cols-6">
          <KpiTile label="قیمت اعمال" value={formatPrice(o.strike_price)} />
          <KpiTile label="سررسید" value={formatJalali(exp)} sub={days >= 0 ? `${toPersianDigits(days)} روز مانده` : 'سررسید شده'} />
          <KpiTile label="اندازه قرارداد" value={formatCount(o.contract_size)} />
          <KpiTile label="قیمت دارایی پایه" value={formatPrice(spot)} />
          <KpiTile label="موقعیت‌های باز" value={last?.open_interest !== undefined ? formatCount(last.open_interest) : '—'} />
          <KpiTile label="حجم" value={last ? formatCount(last.volume) : '—'} />
        </div>
      </section>

      <InstrumentTabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'chart', label: 'نمودار روزانه' },
          { value: 'intraday', label: 'درون‌روزی' },
          { value: 'history', label: 'تاریخچه' },
        ]}
      >
        {daily.error ? (
          <ErrorState error={daily.error} onRetry={daily.reload} />
        ) : !daily.data ? (
          <Loading />
        ) : tab === 'chart' ? (
          <DailyChartPanel items={items} mode="line" />
        ) : tab === 'intraday' ? (
          <IntradayPanel type="OPTION" symbol={o.symbol_fa} daily={items} contractSize={o.contract_size} />
        ) : (
          <DailyHistoryTable items={items} showOpenInterest />
        )}
      </InstrumentTabs>
    </>
  );
}
