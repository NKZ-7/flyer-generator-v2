'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { JobMeta } from '@/lib/types';
import { POLL_INTERVAL_MS, JOB_TIMEOUT_MS } from '@/lib/constants';

interface UsePollingOptions {
  jobId: string | null;
  /** Called with the dataUrl and full meta when rendering completes. */
  onComplete: (dataUrl: string, meta: JobMeta) => void;
  onError: (message: string) => void;
  intervalMs?: number;
  timeoutMs?: number;
}

export function usePolling({
  jobId,
  onComplete,
  onError,
  intervalMs = POLL_INTERVAL_MS,
  timeoutMs = JOB_TIMEOUT_MS,
}: UsePollingOptions) {
  // Use setTimeout (not setInterval) so only one request is in-flight at a time.
  // With a ~25s OpenAI render inside the status route, setInterval would fire
  // 8+ concurrent polls that each trigger a separate OpenAI call.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<number>(0);
  const completedRef = useRef(false);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!jobId) return;

    completedRef.current = false;
    startedAtRef.current = Date.now();

    const poll = async () => {
      if (Date.now() - startedAtRef.current > timeoutMs) {
        stop();
        onError('Generation timed out after 3 minutes. Please try again.');
        return;
      }

      try {
        const res = await fetch(`/api/flyer/status/${jobId}`);
        if (!res.ok) {
          timerRef.current = setTimeout(poll, intervalMs);
          return;
        }

        const data = await res.json();
        const { meta, render, dataUrl } = data;

        if (meta?.status === 'error') {
          stop();
          onError(meta.error ?? 'Generation failed');
          return;
        }

        if (render?.status === 'error') {
          stop();
          onError(render.error ?? 'Render failed');
          return;
        }

        if (dataUrl && !completedRef.current) {
          completedRef.current = true;
          stop();
          onComplete(dataUrl, meta);
          return;
        }
      } catch {
        // Network error — keep trying until timeout
      }

      // Schedule next poll only after this response has been processed
      timerRef.current = setTimeout(poll, intervalMs);
    };

    poll(); // immediate first check
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);
}
