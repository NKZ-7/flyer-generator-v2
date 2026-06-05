'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UsageData {
  isAuthenticated: boolean;
  used:            number;
  limit:           number;
  remaining:       number;
  resetInHours:    number;
  resetWindow:     'daily' | 'rolling_3_days';
}

export function useUsage() {
  const [data, setData]       = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/usage');
      if (res.ok) setData(await res.json() as UsageData);
    } catch {
      // Silent — counter simply shows stale value or nothing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, refetch };
}
