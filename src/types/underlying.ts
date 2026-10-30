export interface Underlying {
  symbol: string;
  name: string;
  insCode: string;
  market: 'بورس' | 'فرابورس' | 'صندوق';
  last_price: number;
  price_change: number;
  active_options_count: number;
  call_count: number;
  put_count: number;
  discovered_by: string;
}

export type MarketFilter = 'همه' | 'بورس' | 'فرابورس' | 'صندوق';

export type SortField =
  | 'symbol'
  | 'name'
  | 'market'
  | 'last_price'
  | 'price_change'
  | 'active_options_count';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
