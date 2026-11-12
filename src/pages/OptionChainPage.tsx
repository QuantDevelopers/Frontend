import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { OptionChainTable } from '../components/OptionChainTable';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState, ErrorState, Loading } from '../components/ui/States';
import { useQuery } from '../hooks/useQuery';
import { api } from '../services/api';
import type { DailyHistoryItem, OptionResponse } from '../types/api';
import { mapWithConcurrency } from '../utils/concurrency';
import { daysUntil, formatJalali, formatPrice, toPersianDigits } from '../utils/formatters';
import { routes } from '../utils/routes';

const QUOTE_CONCURRENCY = 6;

export function OptionChainPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const underlyings = useQuery('underlyings', () => api.underlyings(), { ttl: 300_000 });
  const [expiry, setExpiry] = useState<string | undefined>();

  useEffect(() => setExpiry(undefined), [symbol]);

  const chain = useQuery(symbol ? `chain:${symbol}` : null, () => api.optionChain(symbol!), { ttl: 60_000 });

  // default to the nearest non-expired expiry
  const expirations = chain.data?.expirations ?? [];
  const activeExpiry = expiry ?? expirations.find((e) => daysUntil(e) >= 0) ?? expirations[0];
  const rows = useMemo(
    () => (chain.data?.rows ?? []).filter((r) => r.expiration_date === activeExpiry),
    [chain.data, activeExpiry]
  );

  // Last daily bar per contract of the visible expiry (the chain endpoint has no prices).
  const contracts = useMemo(
    () => rows.flatMap((r) => [r.call, r.put]).filter((c): c is OptionResponse => !!c),
    [rows]
  );
  const quotes = useQuery(
    symbol && activeExpiry && contracts.length ? `chain-quotes:${symbol}:${activeExpiry}` : null,
    async () => {
      const bars = await mapWithConcurrency(contracts, QUOTE_CONCURRENCY, (c) =>
        api.dailyHistory('OPTION', c.symbol_fa, { limit: 1 })
      );
      return new Map<string, DailyHistoryItem | undefined>(contracts.map((c, i) => [c.symbol_fa, bars[i]?.items[0]]));
    },
    { ttl: 120_000 }
  );

  const spot = chain.data?.spot_price;

  return (
    <>
      <PageHeader
        title={symbol ? `زنجیره اختیار ${symbol}` : 'زنجیره اختیار'}
        subtitle={chain.data && `قیمت دارایی پایه: ${formatPrice(spot)} ریال`}
        actions={
          <select
            value={symbol ?? ''}
            onChange={(e) => e.target.value && navigate(routes.optionChain(e.target.value))}
            className="input w-48"
            aria-label="دارایی پایه"
          >
            <option value="">انتخاب دارایی پایه</option>
            {underlyings.data?.items.map((u) => (
              <option key={u.id} value={u.symbol_fa}>
                {u.symbol_fa}
              </option>
            ))}
          </select>
        }
      />

      {!symbol ? (
        <Card>
          {underlyings.error ? (
            <ErrorState error={underlyings.error} onRetry={underlyings.reload} />
          ) : !underlyings.data ? (
            <Loading />
          ) : (
            <div className="flex flex-wrap gap-2 p-4">
              {underlyings.data.items.map((u) => (
                <Link key={u.id} to={routes.optionChain(u.symbol_fa)} className="btn-secondary text-sm">
                  {u.symbol_fa}
                </Link>
              ))}
            </div>
          )}
        </Card>
      ) : chain.error ? (
        <div className="card">
          <ErrorState
            error={chain.error}
            title={chain.error.isNotFound ? `دارایی پایه «${symbol}» یافت نشد` : undefined}
            onRetry={chain.reload}
          />
        </div>
      ) : !chain.data ? (
        <div className="card">
          <Loading />
        </div>
      ) : expirations.length === 0 ? (
        <div className="card">
          <EmptyState title="قرارداد فعالی برای این دارایی ثبت نشده است" />
        </div>
      ) : (
        <Card
          actions={
            <div className="scroll-thin flex max-w-full gap-1.5 overflow-x-auto">
              {expirations.map((e) => {
                const active = e === activeExpiry;
                const left = daysUntil(e);
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setExpiry(e)}
                    className={`num shrink-0 rounded-md border px-3 py-1 text-xs ${
                      active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {formatJalali(e)}
                    <span className={active ? 'text-indigo-200' : 'text-slate-400'}>
                      {' '}
                      ({left >= 0 ? `${toPersianDigits(left)} روز` : 'گذشته'})
                    </span>
                  </button>
                );
              })}
            </div>
          }
          title="سررسید"
        >
          <OptionChainTable rows={rows} spot={spot} quotes={quotes.data} quotesLoading={quotes.loading} />
        </Card>
      )}
    </>
  );
}
