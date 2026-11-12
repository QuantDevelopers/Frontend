import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../services/http';

interface CacheEntry {
  data: unknown;
  at: number;
}

/** Module-level cache shared by all components (keyed by query key). */
const cache = new Map<string, CacheEntry>();
/** In-flight requests, so concurrent consumers (and StrictMode double effects) share one request. */
const inflight = new Map<string, Promise<unknown>>();

interface QueryState<T> {
  data: T | undefined;
  error: ApiError | null;
  loading: boolean;
  /** Re-fetches ignoring the cache. */
  reload: () => void;
}

interface QueryOptions {
  /** Cache lifetime in ms (default 60s). */
  ttl?: number;
}

function run<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = fetcher()
    .then((data) => {
      cache.set(key, { data, at: Date.now() });
      return data;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

/**
 * Minimal data-fetching hook with caching and request de-duplication.
 * Pass `key = null` to skip fetching (e.g. until a dependency is known).
 */
export function useQuery<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  { ttl = 60_000 }: QueryOptions = {}
): QueryState<T> {
  const cached = key ? cache.get(key) : undefined;
  const [data, setData] = useState<T | undefined>(cached?.data as T | undefined);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState<boolean>(!!key && !cached);
  const [nonce, setNonce] = useState(0);

  // Latest fetcher without making it an effect dependency (callers pass inline closures).
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const forceRef = useRef(false);

  useEffect(() => {
    if (!key) {
      setData(undefined);
      setLoading(false);
      setError(null);
      return;
    }
    let active = true;
    const hit = cache.get(key);
    const fresh = hit && Date.now() - hit.at < ttl;

    if (hit) setData(hit.data as T);
    if (fresh && !forceRef.current) {
      setLoading(false);
      setError(null);
      return;
    }
    if (forceRef.current) {
      cache.delete(key);
      forceRef.current = false;
    }
    if (!hit) setData(undefined);
    setLoading(true);
    setError(null);

    run(key, () => fetcherRef.current())
      .then((result) => {
        if (!active) return;
        setData(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof ApiError ? err : new ApiError(String(err), null));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [key, ttl, nonce]);

  const reload = useCallback(() => {
    forceRef.current = true;
    setNonce((n) => n + 1);
  }, []);

  return { data, error, loading, reload };
}
