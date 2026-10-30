import axios from 'axios';
import type { Underlying } from '../types/underlying';
import { normalizePersianText } from '../utils/normalizePersian';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface HealthCheckResponse {
  status: string;
  app?: string;
  database?: string;
  timestamp?: string;
}

/**
 * Checks backend health against /health endpoint.
 * Accepts "healthy" (QuantBackend FastAPI standard), "ok", or HTTP 200.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get<HealthCheckResponse>('/health');
    const status = response.data?.status?.toLowerCase();
    return (
      status === 'healthy' ||
      status === 'ok' ||
      status === 'degraded' ||
      response.status === 200
    );
  } catch {
    return false;
  }
}

/**
 * Normalizes market type from English or Persian to frontend union type
 */
function normalizeMarket(marketType?: string, symbol?: string): 'بورس' | 'فرابورس' | 'صندوق' {
  if (marketType) {
    const lower = marketType.toLowerCase();
    if (lower.includes('farabourse') || lower.includes('فرابورس')) return 'فرابورس';
    if (lower.includes('fund') || lower.includes('صندوق') || lower.includes('etf')) return 'صندوق';
    if (lower.includes('bourse') || lower.includes('بورس')) return 'بورس';
  }
  if (symbol && (symbol.includes('اهرم') || symbol.includes('طلا') || symbol.includes('عیار') || symbol.includes('کهربا') || symbol.includes('زر') || symbol.includes('گوهر') || symbol.includes('ناب') || symbol.includes('زرفام'))) {
    return 'صندوق';
  }
  return 'بورس';
}

/**
 * Maps pure backend item (UnderlyingAssetResponse) to frontend Underlying interface.
 */
function mapBackendItemToUnderlying(item: any): Underlying {
  const symbol = normalizePersianText(item.symbol_fa || item.symbol || '');
  const name = normalizePersianText(item.name_fa || item.name || symbol);
  const insCode = String(item.tsetmc_id || item.insCode || item.isin || item.id || symbol);
  const market = normalizeMarket(item.market_type || item.market, symbol);

  return {
    symbol,
    name,
    insCode,
    market,
    last_price: Number(item.last_price || item.close_price || 0),
    price_change: Number(item.price_change || 0),
    active_options_count: Number(item.active_options_count || 0),
    call_count: Number(item.call_count || 0),
    put_count: Number(item.put_count || 0),
    discovered_by: item.discovered_by || '_',
  };
}

/**
 * Fetches list of underlyings purely from backend API.
 * Calls /api/v1/underlyings (with fallback to /underlyings).
 * Throws error if backend is unreachable or returns invalid data.
 */
export async function fetchUnderlyings(): Promise<Underlying[]> {
  try {
    const response = await apiClient.get<any>('/api/v1/underlyings');
    const rawItems = Array.isArray(response.data)
      ? response.data
      : response.data?.items || [];

    if (Array.isArray(rawItems) && rawItems.length > 0) {
      return rawItems.map(mapBackendItemToUnderlying);
    }
  } catch (primaryErr) {
    // Attempt fallback to legacy /underlyings
    try {
      const fallbackResp = await apiClient.get<any>('/underlyings');
      const rawFallback = Array.isArray(fallbackResp.data)
        ? fallbackResp.data
        : fallbackResp.data?.items || [];

      if (Array.isArray(rawFallback) && rawFallback.length > 0) {
        return rawFallback.map(mapBackendItemToUnderlying);
      }
    } catch {
      // Both attempts failed, propagate error
      throw primaryErr;
    }
  }

  throw new Error('هیچ داده‌ای از سرور بک‌اند دریافت نشد.');
}

/**
 * Fetches a single underlying asset by its Persian symbol from backend.
 */
export async function fetchUnderlyingBySymbol(
  symbol: string
): Promise<Underlying | null> {
  try {
    const response = await apiClient.get<any>(
      `/api/v1/underlyings/${encodeURIComponent(symbol)}`
    );
    if (response.data) {
      return mapBackendItemToUnderlying(response.data);
    }
    return null;
  } catch {
    return null;
  }
}
