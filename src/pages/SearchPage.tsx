import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CodeChip, ContractTypeBadge, MarketBadge, StatusBadge } from '../components/Badges';
import { instrumentPath } from '../components/GlobalSearch';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { EmptyState, ErrorState, Loading } from '../components/ui/States';
import { useDebounce } from '../hooks/useDebounce';
import { useQuery } from '../hooks/useQuery';
import { api } from '../services/api';
import type { InstrumentType } from '../types/api';
import { formatCount, formatPrice } from '../utils/formatters';
import { normalizePersianText } from '../utils/normalizePersian';
import { routes } from '../utils/routes';

type Filter = 'ALL' | InstrumentType;
const SEARCH_LIMIT = 100; // backend maximum

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const urlQuery = params.get('q') ?? '';
  const [text, setText] = useState(urlQuery);
  const [filter, setFilter] = useState<Filter>('ALL');
  const debounced = useDebounce(text.trim(), 300);
  const q = normalizePersianText(debounced);

  // Keep URL and input in sync: the navbar search navigates here with ?q=,
  // and typing here updates ?q= so results are shareable. Each effect depends
  // on one side only to avoid a sync loop.
  useEffect(() => {
    if (urlQuery !== text.trim()) setText(urlQuery);
  }, [urlQuery]);
  useEffect(() => {
    if (debounced !== urlQuery) setParams(debounced ? { q: debounced } : {}, { replace: true });
  }, [debounced]);

  const { data, error, loading, reload } = useQuery(q ? `search:${q}:${SEARCH_LIMIT}` : null, () => api.search(q, SEARCH_LIMIT), {
    ttl: 30_000,
  });

  const items = useMemo(
    () => (data?.items ?? []).filter((i) => filter === 'ALL' || i.instrument_type === filter),
    [data, filter]
  );

  return (
    <>
      <PageHeader title="جستجو" />

      <input
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="نماد، نام، insCode یا ISIN"
        className="input py-2.5 text-base"
      />

      {q && (
        <Card
          title={data ? `${formatCount(data.total)} نتیجه` : 'نتایج'}
          actions={
            <SegmentedControl<Filter>
              value={filter}
              onChange={setFilter}
              ariaLabel="نوع ابزار"
              options={[
                { value: 'ALL', label: 'همه' },
                { value: 'UNDERLYING', label: 'دارایی پایه' },
                { value: 'OPTION', label: 'اختیار' },
              ]}
            />
          }
        >
          {error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : loading && !data ? (
            <Loading />
          ) : items.length === 0 ? (
            <EmptyState title="نتیجه‌ای یافت نشد" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((item) => (
                <li key={`${item.instrument_type}-${item.id}`}>
                  <Link to={instrumentPath(item)} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{item.symbol_fa}</p>
                      <p className="truncate text-xs text-slate-500">{item.name_fa}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.instrument_type === 'OPTION' ? (
                        <>
                          {item.contract_type && <ContractTypeBadge type={item.contract_type} />}
                          {item.strike_price !== undefined && (
                            <span className="num text-xs text-slate-500">اعمال {formatPrice(item.strike_price)}</span>
                          )}
                          <StatusBadge isActive={item.is_active} />
                        </>
                      ) : (
                        <MarketBadge marketType={item.market_type ?? ''} />
                      )}
                      <CodeChip value={item.tsetmc_id} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {!q && (
        <p className="text-sm text-slate-500">
          یا از <Link to={routes.instruments} className="link">فهرست ابزارها</Link> انتخاب کنید.
        </p>
      )}
    </>
  );
}
