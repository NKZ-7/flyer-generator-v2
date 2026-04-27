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
    <div className="grid grid-cols-2 gap-1.5">
      {VIBES.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value as FlyerPreferences['vibe'])}
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
