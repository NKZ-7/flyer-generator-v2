'use client';

import type { FlyerPreferences } from '@/lib/types';

interface StylePreviewProps {
  prefs: FlyerPreferences;
}

const COLOR_BG: Record<string, { bg: string; text: string }> = {
  dark:    { bg: 'linear-gradient(135deg,#0d0d1a,#1a1a2e)',  text: '#ffffff' },
  vibrant: { bg: 'linear-gradient(135deg,#4c1d95,#ec4899)',   text: '#ffffff' },
  warm:    { bg: 'linear-gradient(135deg,#7c2d12,#ea580c)',   text: '#fef3c7' },
  cool:    { bg: 'linear-gradient(135deg,#1e3a5f,#3b82f6)',   text: '#e0f2fe' },
  minimal: { bg: 'linear-gradient(135deg,#f9fafb,#e5e7eb)',   text: '#111827' },
  gold:    { bg: 'linear-gradient(135deg,#0f0c00,#1c1700)',   text: '#fef3c7' },
};

const FONT_FAMILY: Record<string, string> = {
  modern:       'var(--font-oswald, Oswald, sans-serif)',
  classic:      'var(--font-playfair, "Playfair Display", serif)',
  clean:        'var(--font-sans, "DM Sans", sans-serif)',
  highContrast: 'var(--font-oswald, Oswald, sans-serif)',
  vintage:      'var(--font-playfair, "Playfair Display", serif)',
  minimalType:  'var(--font-sans, "DM Sans", sans-serif)',
};

export function StylePreview({ prefs }: StylePreviewProps) {
  const colorBg = COLOR_BG[prefs.colorScheme as keyof typeof COLOR_BG] ?? COLOR_BG.dark;
  const fontFamily = FONT_FAMILY[prefs.fontStyle as keyof typeof FONT_FAMILY] ?? FONT_FAMILY.modern;
  const accent = prefs.primaryColor ?? '#f59e0b';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Preview card */}
      <div
        className="relative rounded-sm overflow-hidden shadow-xl shadow-black/40 ring-1 ring-white/10"
        style={{ width: 200, height: 275, background: colorBg.bg }}
      >
        <div className="absolute inset-0 flex flex-col justify-center px-5 py-6 gap-2">
          {/* Title */}
          <div
            className="text-base font-bold leading-tight"
            style={{
              fontFamily,
              color: colorBg.text,
              opacity: prefs.title ? 1 : 0.3,
            }}
          >
            {prefs.title || 'Your event name'}
          </div>

          {/* Accent rule */}
          <div
            className="h-0.5 rounded-full w-10"
            style={{ backgroundColor: accent }}
          />

          {/* Tagline */}
          {(prefs.tagline || !prefs.title) && (
            <div
              className="text-[10px] leading-snug"
              style={{
                fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
                color: colorBg.text,
                opacity: prefs.tagline ? 0.8 : 0.2,
              }}
            >
              {prefs.tagline || 'Your tagline here'}
            </div>
          )}

          {/* Date + Venue */}
          <div
            className="text-[9px] mt-auto pt-2"
            style={{
              fontFamily: 'var(--font-sans, "DM Sans", sans-serif)',
              color: accent,
              opacity: prefs.eventDate || prefs.venue ? 1 : 0.3,
            }}
          >
            {prefs.eventDate && <span>{prefs.eventDate}</span>}
            {prefs.eventDate && prefs.venue && <span className="mx-1">·</span>}
            {prefs.venue && <span>{prefs.venue}</span>}
            {!prefs.eventDate && !prefs.venue && <span>Date · Venue</span>}
          </div>
        </div>
      </div>

      {/* Label */}
      <p className="text-[10px] text-zinc-600 text-center">
        Style preview — your generated flyer will look even better
      </p>
    </div>
  );
}
