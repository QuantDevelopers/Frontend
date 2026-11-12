import axios, { AxiosError } from 'axios';
import type { ApiEnvelope } from '../types/api';

const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Shared axios instance. `Accept-Language: fa_IR` makes the backend's
 * localization middleware return Persian error messages.
 */
export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Accept-Language': 'fa_IR',
  },
});

/** Normalized error thrown by every API call. */
export class ApiError extends Error {
  readonly status: number | null;
  readonly isNetworkError: boolean;

  constructor(message: string, status: number | null, isNetworkError = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (axios.isCancel(err)) return new ApiError('درخواست لغو شد', null);

  const axiosErr = err as AxiosError<Partial<ApiEnvelope<unknown>>>;
  if (axiosErr?.isAxiosError) {
    const res = axiosErr.response;
    if (!res) {
      return new ApiError(
        `ارتباط با سرور بک‌اند (${API_BASE_URL}) برقرار نشد.`,
        null,
        true
      );
    }
    const body = res.data;
    // 422 validation errors come back as {messages: {field: {tag: msg}}}
    const validation = body?.messages
      ? Object.values(body.messages)
          .flatMap((tags) => Object.values(tags))
          .join(' · ')
      : '';
    const message = validation || body?.message || `خطای سرور (${res.status})`;
    return new ApiError(message, res.status);
  }
  return new ApiError(err instanceof Error ? err.message : 'خطای ناشناخته', null);
}

/** GET a backend endpoint and unwrap the `{statusCode, message, data}` envelope. */
export async function apiGet<T>(
  url: string,
  params?: object,
  signal?: AbortSignal
): Promise<T> {
  try {
    const res = await http.get<ApiEnvelope<T>>(url, { params, signal });
    return res.data.data;
  } catch (err) {
    throw toApiError(err);
  }
}
