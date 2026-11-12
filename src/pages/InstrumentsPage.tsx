import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OptionsBrowser } from '../components/OptionsBrowser';
import { UnderlyingsTable, sortUnderlyingRows } from '../components/UnderlyingsTable';
import type { SortState, UnderlyingSortField } from '../components/UnderlyingsTable';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { EmptyState, ErrorState, Loading } from '../components/ui/States';
import { useMarketOverview } from '../hooks/useMarketOverview';
import { downloadCsv } from '../utils/csv';
import { marketLabel } from '../utils/market';
import { normalizePersianText } from '../utils/normalizePersian';

type Tab = 'underlyings' | 'options';
type MarketFilter = 'all' | 'بورس' | 'فرابورس';

export function InstrumentsPage() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'options' ? 'options' : 'underlyings';
  const setTab = (t: Tab) => setParams(t === 'options' ? { tab: t } : {}, { replace: true });

  const { data, error, loading, reload } = useMarketOverview();
  const [query, setQuery] = useState('');
  const [market, setMarket] = useState<MarketFilter>('all');
  const [sort, setSort] = useState<SortState>({ field: 'options', dir: 'desc' });

  const rows = useMemo(() => {
    const q = normalizePersianText(query.trim().toLowerCase());
    const filtered = (data?.rows ?? []).filter((r) => {
      const u = r.underlying;
      if (market !== 'all' && marketLabel(u.market_type) !== market) return false;
      if (!q) return true;
      return (
        normalizePersianText(u.symbol_fa).includes(q) ||
        normalizePersianText(u.name_fa).includes(q) ||
        (u.tsetmc_id ?? '').includes(q)
      );
    });
    return sortUnderlyingRows(filtered, sort);
  }, [data, query, market, sort]);

  const onSort = (field: UnderlyingSortField) =>
    setSort((s) => ({ field, dir: s.field === field && s.dir === 'desc' ? 'asc' : 'desc' }));

  const exportCsv = () =>
    downloadCsv(
      `underlyings_${new Date().toISOString().slice(0, 10)}.csv`,
      ['symbol_fa', 'name_fa', 'tsetmc_id', 'market_type', 'last_close', 'last_trade_date', 'change_pct', 'active_options', 'calls', 'puts', 'nearest_expiry'],
      rows.map((r) => [
        r.underlying.symbol_fa,
        r.underlying.name_fa,
        r.underlying.tsetmc_id,
        r.underlying.market_type,
        r.last?.close_price,
        r.last?.trade_date,
        r.changePct?.toFixed(2),
        r.activeOptions,
        r.calls,
        r.puts,
        r.nearestExpiry,
      ])
    );

  return (
    <>
      <PageHeader
        title="ابزارها"
        actions={
          <SegmentedControl<Tab>
            size="md"
            ariaLabel="نوع ابزار"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'underlyings', label: 'دارایی‌های پایه' },
              { value: 'options', label: 'قراردادهای اختیار' },
            ]}
          />
        }
      />

      {tab === 'options' ? (
        <Card>
          <OptionsBrowser underlyings={data?.rows.map((r) => r.underlying)} />
        </Card>
      ) : (
        <Card>
          <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-200 px-4 py-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="نماد، نام یا insCode"
              className="input min-w-[200px] flex-1 py-1.5"
            />
            <SegmentedControl<MarketFilter>
              ariaLabel="بازار"
              value={market}
              onChange={setMarket}
              options={[
                { value: 'all', label: 'همه' },
                { value: 'بورس', label: 'بورس' },
                { value: 'فرابورس', label: 'فرابورس' },
              ]}
            />
            <button type="button" onClick={exportCsv} className="btn-secondary" disabled={rows.length === 0}>
              CSV
            </button>
          </div>

          {error && !data ? (
            <ErrorState error={error} onRetry={reload} />
          ) : loading && !data ? (
            <Loading />
          ) : rows.length === 0 ? (
            <EmptyState title="موردی یافت نشد" />
          ) : (
            <UnderlyingsTable rows={rows} sort={sort} onSort={onSort} />
          )}
        </Card>
      )}
    </>
  );
}
