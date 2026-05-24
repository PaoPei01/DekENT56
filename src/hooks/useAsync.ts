import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../utils/error';

type UseAsyncConfig = {
  keepPreviousData?: boolean;
  initialLoading?: boolean;
};

export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = [], config: UseAsyncConfig = {}) {
  const { keepPreviousData = true, initialLoading = true } = config;
  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);
    if (!keepPreviousData) {
      setData(null);
    }
    try {
      const result = await loader();
      if (mountedRef.current && requestIdRef.current === requestId) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current && requestIdRef.current === requestId) {
        setError(errorMessage(err, 'เกิดข้อผิดพลาด'));
      }
    } finally {
      if (mountedRef.current && requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
    // Callers pass the same dependency list they would give to useEffect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keepPreviousData, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    void run();
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [run]);

  return { data, loading, error, reload: run };
}
