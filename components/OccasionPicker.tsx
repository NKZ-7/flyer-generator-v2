'use client';

import { useState } from 'react';
import type { FlyerPreferences } from '@/lib/types';

export const OCCASIONS = [
  { value: 'birthday',   label: 'Birthday',            icon: '🎂' },
  { value: 'sympathy',   label: 'Sympathy / Memorial', icon: '🕊️' },
  { value: 'motivation', label: 'Motivation',           icon: '🌅' },
  { value: 'congrats',   label: 'Congratulations',     icon: '🎉' },
  { value: 'business',   label: 'Business Promo',      icon: '💼' },
  { value: 'invitation', label: 'Invitation',           icon: '📩' },
] as const;

interface OccasionPickerProps {
  value?: FlyerPreferences['occasion'];
  onChange: (v: FlyerPreferences['occasion']) => void;
  disabled?: boolean;
}

export function OccasionPicker({ value, onChange, disabled }: OccasionPickerProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {OCCASIONS.map((opt) => {
        const selected = value === opt.value;
        const isHovered = !selected && hovered === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value as FlyerPreferences['occasion'])}
            disabled={disabled}
            className="disabled:opacity-40 disabled:cursor-not-allowed"
            onMouseEnter={() => setHovered(opt.value)}
            onMouseLeave={() => setHovered(null)}
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
              background: selected ? 'rgba(227,169,60,0.10)' : isHovered ? 'rgba(227,169,60,0.05)' : '#241C13',
              border: selected ? '1px solid rgba(227,169,60,0.50)' : isHovered ? '1px solid rgba(227,169,60,0.35)' : '1px solid #33281B',
              color: selected ? '#E9D9BF' : isHovered ? '#D8C9B4' : '#A8957F',
              transform: isHovered ? 'translateY(-1px)' : 'none',
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
