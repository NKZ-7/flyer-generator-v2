'use client';

// REVIEW: This is a stopgap placeholder. Replace with Mood Reel once real canvas examples exist.
// The StylePreview (color/font/title preview) has been retired — it reflected legacy template
// fields (tagline, date, venue) that no longer match the GPT-canvas pipeline output.

import type { FlyerPreferences } from '@/lib/types';

interface StylePreviewProps {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prefs: FlyerPreferences;
}

export function StylePreview(_: StylePreviewProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full w-full select-none">
      <div className="flex flex-col items-center gap-3 opacity-50">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400/60" />
        </span>
        <p className="text-[11px] text-zinc-500 text-center leading-snug">
          Your card preview will appear here
        </p>
      </div>
    </div>
  );
}
