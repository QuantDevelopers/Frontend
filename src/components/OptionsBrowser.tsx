import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { useQuery } from '../hooks/useQuery';
import { api } from '../services/api';
import type { ContractType, ListOptionsParams, UnderlyingResponse } from '../types/api';
import { daysUntil, formatJalali, formatPrice, toPersianDigits } from '../utils/formatters';
import { routes } from '../utils/routes';
import { CodeChip, ContractTypeBadge, StatusBadge } from './Badges';
import { Pagination } from './ui/Pagination';
import { SegmentedControl } from './ui/SegmentedControl';
import { EmptyState, ErrorState, Loading } from './ui/States';

type StatusFilter = 'active' | 'expired' | 'all';
type TypeFilter = 'ALL' | ContractType;

const PAGE_SIZE = 25;

interface OptionsBrowserProps {
  /** Fix the list to one underlying (detail page). */
  underlyingSymbol?: string;
  /** Underlying options for the filter dropdown (instruments page). */
  underlyings?: UnderlyingResponse[];
}

/** Server-side filtered & paginated view over GET /api/v1/options. */
export function OptionsBrowser({ underlyingSymbol, underlyings }: OptionsBrowserProps) {
  const [text, setText] = useState('');
  const [type, setType] = useState<TypeFilter>('ALL');
  const [status, setStatus] = useState<StatusFilter>('active');
  const [ua, setUa] = useState(underlyingSymbol ?? '');
  const [page, setPage] = useState(1);
  const q = useDebounce(text.trim(), 300);

  useEffect(() => {
    setPage(1);
  }, [q, type, status, ua]);

  const params: ListOptionsParams = {
    q: q || undefined,
    contract_type: type === 'ALL' ? undefined : type,
    is_active: status === 'all' ? undefined : status === 'active',
    symbol_ua: ua || undefined,
  };
  const key = `options:${JSON.stringify(params)}:${page}`;
  const { data, error, loading, reload } = useQuery(key, () =>
    api.options({ ...params, page, page_size: PAGE_SIZE })
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-200 px-4 py-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="نماد، نام، insCode یا ISIN"
          className="input min-w-[200px] flex-1 py-1.5"
        />
        {!underlyingSymbol && underlyings && (
          <select value={ua} onChange={(e) => setUa(e.target.value)} className="input w-auto py-1.5" aria-label="دارایی پایه">
            <option value="">همه دارایی‌های پایه</option>
            {underlyings.map((u) => (
              <option key={u.id} value={u.symbol_fa}>
                {u.symbol_fa}
              </option>
            ))}
          </select>
        )}
        <SegmentedControl<TypeFilter>
          ariaLabel="نوع قرارداد"
          value={type}
          onChange={setType}
          options={[
            { value: 'ALL', label: 'همه' },
            { value: 'CALL', label: 'خرید' },
            { value: 'PUT', label: 'فروش' },
          ]}
        />
        <SegmentedControl<StatusFilter>
          ariaLabel="وضعیت"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'active', label: 'فعال' },
            { value: 'expired', label: 'منقضی' },
            { value: 'all', label: 'همه' },
          ]}
        />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <Loading />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="قراردادی یافت نشد" />
      ) : (
        <>
          <div className={`scroll-thin overflow-x-auto transition-opacity ${loading ? 'opacity-60' : ''}`}>
            <table className="table-base">
              <thead>
                <tr>
                  <th>نماد قرارداد</th>
                  <th>نوع</th>
                  <th>قیمت اعمال</th>
                  <th>سررسید</th>
                  <th>اندازه قرارداد</th>
                  <th>insCode</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((o) => {
                  const exp = o.expiration_date.slice(0, 10);
                  const days = daysUntil(exp);
                  return (
                    <tr key={o.id}>
                      <td>
                        <Link to={routes.option(o.symbol_fa)} className="group block">
                          <span className="block font-semibold text-slate-900 group-hover:text-indigo-600">{o.symbol_fa}</span>
                          <span className="block max-w-[260px] truncate text-[11px] text-slate-500" title={o.name_fa}>
                            {o.name_fa}
                          </span>
                        </Link>
                      </td>
                      <td>
                        <ContractTypeBadge type={o.contract_type} />
                      </td>
                      <td className="num font-semibold text-slate-900">{formatPrice(o.strike_price)}</td>
                      <td className="num">
                        <span className="text-slate-700">{formatJalali(exp)}</span>
                        <span className="block text-[11px] text-slate-400">
                          {days >= 0 ? `${toPersianDigits(days)} روز مانده` : 'سررسید شده'}
                        </span>
                      </td>
                      <td className="num text-slate-600">{formatPrice(o.contract_size)}</td>
                      <td>
                        <CodeChip value={o.tsetmc_id} />
                      </td>
                      <td>
                        <StatusBadge contract={o} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination meta={data.pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
