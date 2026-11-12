import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DailyChartPanel } from '../components/DailyChartPanel';
import { IntradayPanel } from '../components/IntradayPanel';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { ErrorState, Loading } from '../components/ui/States';
import { useInstrumentDaily } from '../hooks/useInstrumentDaily';
import { useQuery } from '../hooks/useQuery';
import { api, fetchAllOptions } from '../services/api';
import type { OptionResponse } from '../types/api';
import { formatJalali, formatPrice } from '../utils/formatters';
import { capAtExpiry, isExpired } from '../utils/market';
import { routes } from '../utils/routes';

/** Groups active contracts by expiry (nearest first), sorted by type then strike inside each group. */
function groupByExpiry(contracts: OptionResponse[]): [string, OptionResponse[]][] {
  const groups = new Map<string, OptionResponse[]>();
  for (const c of contracts) {
    const exp = c.expiration_date.slice(0, 10);
    groups.set(exp, [...(groups.get(exp) ?? []), c]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([exp, list]) => [
      exp,
      list.sort((a, b) => a.contract_type.localeCompare(b.contract_type) || a.strike_price - b.strike_price),
    ]);
}

/** One place to see candles for any instrument: pick an underlying (and optionally one of its contracts). */
export function ChartsPage() {
  const [params, setParams] = useSearchParams();
  const underlyings = useQuery('underlyings', () => api.underlyings(), { ttl: 300_000 });
  const list = underlyings.data?.items ?? [];

  const uaSymbol = params.get('u') || list[0]?.symbol_fa;
  const optSymbol = params.get('o') || '';

  const contracts = useQuery(
    uaSymbol ? `active-options:${uaSymbol}` : null,
    async () => (await fetchAllOptions({ symbol_ua: uaSymbol!, is_active: true })).filter((c) => !isExpired(c)),
    { ttl: 300_000 }
  );
  const groups = useMemo(() => groupByExpiry(contracts.data ?? []), [contracts.data]);
  const contract = contracts.data?.find((c) => c.symbol_fa === optSymbol);

  const type = optSymbol ? 'OPTION' : 'UNDERLYING';
  const symbol = optSymbol || uaSymbol;
  const daily = useInstrumentDaily(type, symbol);
  const rawItems = daily.data?.items ?? [];
  const items = contract ? capAtExpiry(rawItems, contract.expiration_date) : rawItems;
  const detailPath = symbol && (optSymbol ? routes.option(symbol) : routes.underlying(symbol));

  if (underlyings.error) {
    return (
      <div className="card">
        <ErrorState error={underlyings.error} onRetry={underlyings.reload} />
      </div>
    );
  }
  if (!underlyings.data || !symbol) return <Loading />;

  return (
    <>
      <PageHeader
        title={`نمودار ${symbol}`}
        subtitle={contract ? `اختیار ${contract.contract_type === 'CALL' ? 'خرید' : 'فروش'} روی ${uaSymbol}` : 'دارایی پایه'}
        actions={
          <>
            <select
              value={uaSymbol}
              onChange={(e) => setParams({ u: e.target.value })}
              className="input w-40"
              aria-label="دارایی پایه"
            >
              {list.map((u) => (
                <option key={u.id} value={u.symbol_fa}>
                  {u.symbol_fa}
                </option>
              ))}
            </select>
            <select
              value={optSymbol}
              onChange={(e) => setParams(e.target.value ? { u: uaSymbol!, o: e.target.value } : { u: uaSymbol! })}
              className="input w-64"
              aria-label="قرارداد اختیار"
              disabled={!contracts.data?.length}
            >
              <option value="">{contracts.data?.length === 0 ? 'قرارداد فعالی ثبت نشده' : 'خود دارایی پایه'}</option>
              {groups.map(([exp, list]) => (
                <optgroup key={exp} label={`سررسید ${formatJalali(exp)}`}>
                  {list.map((c) => (
                    <option key={c.id} value={c.symbol_fa}>
                      {c.symbol_fa} · {c.contract_type === 'CALL' ? 'خرید' : 'فروش'} · {formatPrice(c.strike_price)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </>
        }
      />

      <Card
        title="نمودار روزانه"
        actions={
          detailPath && (
            <Link to={detailPath} className="link text-xs">
              صفحه نماد
            </Link>
          )
        }
      >
        {daily.error ? (
          <ErrorState error={daily.error} onRetry={daily.reload} />
        ) : !daily.data ? (
          <Loading />
        ) : (
          <DailyChartPanel items={items} mode={optSymbol ? 'line' : 'candles'} />
        )}
      </Card>

      <Card title="درون‌روزی (از معاملات تیک)">
        {daily.error ? (
          <ErrorState error={daily.error} onRetry={daily.reload} />
        ) : !daily.data ? (
          <Loading />
        ) : (
          // key resets the panel's selected day when the instrument changes
          <IntradayPanel
            key={`${type}:${symbol}`}
            type={type}
            symbol={symbol}
            daily={items}
            contractSize={contract?.contract_size}
          />
        )}
      </Card>
    </>
  );
}
