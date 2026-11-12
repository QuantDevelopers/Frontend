import type {
  CrawlStatusResponse,
  DailyHistoryParams,
  DailyHistoryResponse,
  HealthResponse,
  InstrumentSearchResponse,
  InstrumentType,
  ListOptionsParams,
  OptionChainResponse,
  OptionListPaginatedResponse,
  OptionResponse,
  TickItem,
  TicksParams,
  TicksPaginatedResponse,
  UnderlyingListResponse,
  UnderlyingResponse,
} from '../types/api';
import { normalizePersianText } from '../utils/normalizePersian';
import { apiGet } from './http';

/** Path segment for daily-history / ticks routes. */
const typeSegment = (t: InstrumentType) => (t === 'OPTION' ? 'option' : 'underlying');
const seg = (s: string) => encodeURIComponent(normalizePersianText(s));

/** Drops empty values so they are not sent as `?key=`. */
function clean<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ) as Partial<T>;
}

export const api = {
  /** GET /health */
  health: (signal?: AbortSignal) => apiGet<HealthResponse>('/health', undefined, signal),

  /** GET /api/v1/underlyings */
  underlyings: (signal?: AbortSignal) =>
    apiGet<UnderlyingListResponse>('/api/v1/underlyings', undefined, signal),

  /** GET /api/v1/underlyings/{symbol_fa} */
  underlying: (symbol: string, signal?: AbortSignal) =>
    apiGet<UnderlyingResponse>(`/api/v1/underlyings/${seg(symbol)}`, undefined, signal),

  /** GET /api/v1/underlyings/{symbol_fa}/option-chain */
  optionChain: (symbol: string, signal?: AbortSignal) =>
    apiGet<OptionChainResponse>(`/api/v1/underlyings/${seg(symbol)}/option-chain`, undefined, signal),

  /** GET /api/v1/options (paginated, page_size max 200) */
  options: (params: ListOptionsParams = {}, signal?: AbortSignal) =>
    apiGet<OptionListPaginatedResponse>(
      '/api/v1/options',
      clean({ ...params, q: params.q ? normalizePersianText(params.q) : undefined }),
      signal
    ),

  /** GET /api/v1/options/{symbol_fa} */
  option: (symbol: string, signal?: AbortSignal) =>
    apiGet<OptionResponse>(`/api/v1/options/${seg(symbol)}`, undefined, signal),

  /** GET /api/v1/instruments/search?q=&limit= (limit max 100) */
  search: (q: string, limit = 20, signal?: AbortSignal) =>
    apiGet<InstrumentSearchResponse>(
      '/api/v1/instruments/search',
      { q: normalizePersianText(q.trim()), limit },
      signal
    ),

  /** GET /api/v1/daily-history/{type}/{symbol_fa} — newest first, limit max 1000 */
  dailyHistory: (
    type: InstrumentType,
    symbol: string,
    params: DailyHistoryParams = {},
    signal?: AbortSignal
  ) =>
    apiGet<DailyHistoryResponse>(
      `/api/v1/daily-history/${typeSegment(type)}/${seg(symbol)}`,
      clean(params),
      signal
    ),

  /** GET /api/v1/ticks/{type}/{symbol_fa} — chronological, page_size max 500 */
  ticks: (type: InstrumentType, symbol: string, params: TicksParams = {}, signal?: AbortSignal) =>
    apiGet<TicksPaginatedResponse>(
      `/api/v1/ticks/${typeSegment(type)}/${seg(symbol)}`,
      clean(params),
      signal
    ),

  /** GET /api/v1/crawl/status */
  crawlStatus: (signal?: AbortSignal) =>
    apiGet<CrawlStatusResponse>('/api/v1/crawl/status', undefined, signal),
};

/** Max page sizes enforced by the backend. */
const OPTIONS_MAX_PAGE_SIZE = 200;
const TICKS_MAX_PAGE_SIZE = 500;

/**
 * Fetches every page of a paginated options query.
 * Used for aggregates (e.g. active contracts per underlying) the backend has no endpoint for.
 */
export async function fetchAllOptions(
  params: Omit<ListOptionsParams, 'page' | 'page_size'>,
  signal?: AbortSignal
): Promise<OptionResponse[]> {
  const first = await api.options({ ...params, page: 1, page_size: OPTIONS_MAX_PAGE_SIZE }, signal);
  const all = [...first.items];
  for (let page = 2; page <= first.pagination.totalPages; page++) {
    const next = await api.options({ ...params, page, page_size: OPTIONS_MAX_PAGE_SIZE }, signal);
    all.push(...next.items);
  }
  return all;
}

/** Upper bound of tick pages fetched for one day (40 × 500 = 20k ticks) to stay polite to the API. */
const MAX_TICK_PAGES = 40;

interface DayTicks {
  tradeDate?: string;
  items: TickItem[];
  totalItems: number;
  truncated: boolean;
}

/** Fetches every tick of one trading day (all pages), in chronological order. */
export async function fetchAllTicks(
  type: InstrumentType,
  symbol: string,
  date: string | undefined,
  signal?: AbortSignal
): Promise<DayTicks> {
  const first = await api.ticks(type, symbol, { date, page: 1, page_size: TICKS_MAX_PAGE_SIZE }, signal);
  const items = [...first.items];
  const lastPage = Math.min(first.pagination.totalPages, MAX_TICK_PAGES);
  for (let page = 2; page <= lastPage; page++) {
    const next = await api.ticks(type, symbol, { date, page, page_size: TICKS_MAX_PAGE_SIZE }, signal);
    items.push(...next.items);
  }
  return {
    tradeDate: first.trade_date,
    items,
    totalItems: first.pagination.totalItems,
    truncated: first.pagination.totalPages > MAX_TICK_PAGES,
  };
}
