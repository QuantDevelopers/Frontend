import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { ApiError } from '../services/http';

const POLL_INTERVAL = 30_000;

/** online = API + DB ok, degraded = API up but DB down (HTTP 503), offline = API unreachable. */
export type HealthState = 'checking' | 'online' | 'degraded' | 'offline';

export function useHealthCheck() {
  const [state, setState] = useState<HealthState>('checking');

  const check = useCallback(async () => {
    try {
      const res = await api.health();
      setState(res.status === 'healthy' ? 'online' : 'degraded');
    } catch (err) {
      setState(err instanceof ApiError && err.status === 503 ? 'degraded' : 'offline');
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [check]);

  return { state, recheck: check };
}
