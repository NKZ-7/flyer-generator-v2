'use client';

import type { UsageData } from '@/hooks/useUsage';

interface UsageCounterProps {
  data:    UsageData | null;
  loading: boolean;
}

function chipLabel(d: UsageData): string {
  if (d.isAuthenticated) {
    if (d.remaining === 0) return `No cards left today · resets in ${d.resetInHours}h`;
    if (d.remaining === 1) return `1 card left today · resets in ${d.resetInHours}h`;
    return `${d.remaining} cards left today`;
  }
  if (d.remaining === 0) return 'No cards left · sign in for more';
  if (d.remaining === 1) return '1 card left · sign in for more';
  return `${d.remaining} free cards left`;
}

export function UsageCounter({ data, loading }: UsageCounterProps) {
  // Nothing while loading — no skeleton, no reserved space
  if (loading || !data) return null;

  const isZero  = data.remaining === 0;
  const isOne   = data.remaining === 1;

  return (
    <span
      className={`text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-full transition-colors ${
        isZero
          ? 'text-[#9A8A7A] bg-warm-700/40'
          : isOne
          ? 'text-amber-400/90 bg-amber-400/10'
          : 'text-[#6B5B4E]'
      }`}
    >
      {chipLabel(data)}
    </span>
  );
}
