'use client';

import type { FlyerPreferences } from '@/lib/types';

export const OCCASIONS = [
  { value: 'birthday',   label: 'Birthday',            icon: '🎂' },
  { value: 'sympathy',   label: 'Sympathy / Memorial', icon: '🕊️' },
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
  return (
    <div className="grid grid-cols-1 gap-1.5">
      {OCCASIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value as FlyerPreferences['occasion'])}
          disabled={disabled}
          className={`flex items-center gap-2.5 px-3 py-2.5 text-xs rounded border transition-all min-h-[44px] text-left ${
            value === opt.value
              ? 'bg-amber-400/10 border-amber-400/50 text-amber-300'
              : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <span className="text-base leading-none">{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
