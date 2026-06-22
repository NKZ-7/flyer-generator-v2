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

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: '#241C13',
        border: '1px solid #33281B',
        borderRadius: 999,
        padding: '4px 12px',
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E3A93C', flexShrink: 0 }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#8A7560', whiteSpace: 'nowrap' }}>
        {chipLabel(data)}
      </span>
    </div>
  );
}
