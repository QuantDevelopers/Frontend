/**
 * TypeScript mirrors of the QuantBackend (Go/Echo) REST API v1 DTOs.
 * Source of truth: trade-backend/Backend/internal/application/dto/**
 * Every response is wrapped in the envelope {statusCode, message, data}.
 */

export type InstrumentType = 'UNDERLYING' | 'OPTION';
export type ContractType = 'CALL' | 'PUT';
export type Moneyness = 'ITM' | 'ATM' | 'OTM';
export type ContractStatus = 'ACTIVE' | 'EXPIRED' | 'DELISTED';

export interface ApiEnvelope<T> {
  statusCode: number;
  message?: string;
  messages?: Record<string, Record<string, string>>;
  data: T;
}

export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/* ---------- health ---------- */
export interface HealthResponse {
  status: 'healthy' | 'degraded' | string;
  app: string;
  database: 'connected' | 'disconnected' | string;
  timestamp: string;
}

/* ---------- underlyings ---------- */
export interface UnderlyingResponse {
  id: number;
  symbol_fa: string;
  name_fa: string;
  tsetmc_id: string | null;
  market_type: string; // "Bourse" | "Farabourse" | ...
  is_active: boolean;
  created_at: string;
}

export interface UnderlyingListResponse {
  total: number;
  items: UnderlyingResponse[];
}

/* ---------- options ---------- */
export interface OptionResponse {
  id: number;
  underlying_asset_id: number;
  symbol_fa: string;
  name_fa: string;
  contract_type: ContractType;
  strike_price: number;
  contract_size: number;
  expiration_date: string;
  begin_date: string | null;
  tsetmc_id: string | null;
  isin: string | null;
  is_active: boolean;
  status: ContractStatus | string;
  created_at: string;
}

export interface OptionListPaginatedResponse {
  items: OptionResponse[];
  pagination: PaginationMeta;
}

export interface ListOptionsParams {
  underlying_id?: number;
  symbol_ua?: string;
  contract_type?: ContractType;
  is_active?: boolean;
  expiration_date?: string;
  q?: string;
  page?: number;
  page_size?: number;
}

export interface OptionChainRow {
  expiration_date: string;
  strike_price: number;
  contract_size: number;
  call_moneyness?: Moneyness;
  put_moneyness?: Moneyness;
  call?: OptionResponse;
  put?: OptionResponse;
}

export interface OptionChainResponse {
  underlying: UnderlyingResponse;
  spot_price?: number;
  expirations: string[];
  total_rows: number;
  rows: OptionChainRow[];
}

/* ---------- market data ---------- */
export interface InstrumentSearchItem {
  instrument_type: InstrumentType;
  id: number;
  symbol_fa: string;
  name_fa: string;
  tsetmc_id?: string;
  isin?: string;
  market_type?: string;
  contract_type?: ContractType;
  strike_price?: number;
  is_active: boolean;
}

export interface InstrumentSearchResponse {
  query: string;
  total: number;
  items: InstrumentSearchItem[];
}

export interface DailyHistoryItem {
  id: number;
  trade_date: string; // YYYY-MM-DD
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  yesterday_price?: number;
  settlement_price?: number;
  volume: number;
  value: number;
  trade_count: number;
  open_interest?: number;
}

export interface DailyHistoryResponse {
  instrument_type: InstrumentType;
  instrument_id: number;
  symbol_fa: string;
  tsetmc_id?: string;
  total: number;
  items: DailyHistoryItem[]; // newest first
}

export interface DailyHistoryParams {
  from?: string;
  to?: string;
  limit?: number;
}

export interface TickItem {
  id: number;
  trade_date: string;
  trade_time: string;
  sequence_number?: number;
  price: number;
  volume: number;
}

export interface TicksPaginatedResponse {
  instrument_type: InstrumentType;
  instrument_id: number;
  symbol_fa: string;
  trade_date?: string;
  items: TickItem[];
  pagination: PaginationMeta;
}

export interface TicksParams {
  date?: string;
  page?: number;
  page_size?: number;
}

/* ---------- crawler status ---------- */
export interface ProductionCrawlReport {
  job_id: string;
  started_at: string;
  finished_at: string;
  workers: number;
  total_queued: number;
  skipped_resume: number;
  succeeded: number;
  empty_days: number;
  failed: number;
  total_records: number;
  db_rows_saved: number;
  circuit_broken: boolean;
  errors?: string[];
}

export interface CrawlStatusResponse {
  checked_at: string;
  database: {
    underlyings_total: number;
    underlyings_with_tsetmc_id: number;
    options_total: number;
    options_active: number;
    daily_history_rows: number;
    tick_raw_rows: number;
  };
  manifests: {
    manifests_total: number;
    manifests_ok: number;
    manifests_empty: number;
    raw_bytes_total: number;
    last_fetched_at?: string;
  };
  latest_job?: ProductionCrawlReport;
  safe_max_rps: number;
}
