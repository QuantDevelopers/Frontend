import { useState, useEffect, useCallback } from 'react';
import { checkHealth } from '../services/api';

const POLL_INTERVAL = 30000; // 30 seconds

export function useHealthCheck() {
  const [isOnline, setIsOnline] = useState(false);
  const [checking, setChecking] = useState(true);

  const check = useCallback(async () => {
    setChecking(true);
    const result = await checkHealth();
    setIsOnline(result);
    setChecking(false);
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [check]);

  return { isOnline, checking, recheck: check };
}
