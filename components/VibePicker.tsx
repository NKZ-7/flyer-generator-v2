'use client';

import type { FlyerPreferences } from '@/lib/types';

export const VIBES = [
  { value: 'elegant',  label: 'Elegant & Classy',     icon: '✨' },
  { value: 'warm',     label: 'Warm & Heartfelt',     icon: '💛' },
  { value: 'playful',  label: 'Fun & Playful',        icon: '🎈' },
  { value: 'bold',     label: 'Bold & Energetic',     icon: '🔥' },
  { value: 'church',   label: 'Church / Traditional', icon: '⛪' },
  { value: 'minimal',  label: 'Minimal & Clean',      icon: '⚪' },
] as const;

interface VibePickerProps {
  value?: FlyerPreferences['vibe'];
  onChange: (v: FlyerPreferences['vibe']) => void;
  disabled?: boolean;
}

export function VibePicker({ value, onChange, disabled }: VibePickerProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {VIBES.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value as FlyerPreferences['vibe'])}
            disabled={disabled}
            className="disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 9,
              minHeight: 44,
              padding: '8px 12px',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: selected ? 'rgba(227,169,60,0.10)' : '#241C13',
              border: selected ? '1px solid rgba(227,169,60,0.50)' : '1px solid #33281B',
              color: selected ? '#E9D9BF' : '#A8957F',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 16 }}>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
