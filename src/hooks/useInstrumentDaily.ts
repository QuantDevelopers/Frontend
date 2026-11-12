import { DAILY_HISTORY_MAX_LIMIT, DATA_START_DATE } from '../config';
import { api } from '../services/api';
import type { InstrumentType } from '../types/api';
import { useQuery } from './useQuery';

/** Full daily history (from 1402/01/01, newest first) for one instrument; shared by all detail tabs. */
export function useInstrumentDaily(type: InstrumentType, symbol: string | undefined) {
  return useQuery(
    symbol ? `daily:${type}:${symbol}` : null,
    () => api.dailyHistory(type, symbol!, { from: DATA_START_DATE, limit: DAILY_HISTORY_MAX_LIMIT }),
    { ttl: 120_000 }
  );
}
