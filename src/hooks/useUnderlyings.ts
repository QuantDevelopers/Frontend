import { useState, useEffect, useCallback } from 'react';
import type { Underlying } from '../types/underlying';
import { fetchUnderlyings } from '../services/api';

export function useUnderlyings() {
  const [data, setData] = useState<Underlying[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchUnderlyings();
      setData(result);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      setData([]);
      const errMsg =
        err?.response?.data?.detail ||
        err?.message ||
        'خطا در برقراری ارتباط با سرور بک‌اند (http://localhost:8000). لطفاً اطمینان حاصل کنید سرور بک‌اند اجرا شده است.';
      setError(errMsg);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, lastUpdated, reload: load };
}
