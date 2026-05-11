'use client';

import { useState, useEffect } from 'react';
import type { FlyerPreferences } from '@/lib/types';

interface StylePreviewProps {
  prefs: FlyerPreferences;
  generating?: boolean;
}

type MoodPalette = {
  shapes: string[];
};

// Palette lookup: `${occasion}-${vibe}` → occasion → 'default'
const MOOD_PALETTES: Record<string, MoodPalette> = {
  // Birthday
  'birthday-playful': { shapes: ['#ec4899', '#f97316', '#fbbf24', '#fb923c', '#e11d48'] },
  'birthday-warm':    { shapes: ['#f59e0b', '#ea580c', '#fcd34d', '#c2410c', '#f97316'] },
  'birthday-bold':    { shapes: ['#ef4444', '#f59e0b', '#3b82f6', '#ec4899', '#fbbf24'] },
  'birthday-elegant': { shapes: ['#d4af70', '#c9a85e', '#f0e4c0', '#e8d5a0', '#b8964a'] },
  birthday:           { shapes: ['#f59e0b', '#f97316', '#fbbf24', '#fb923c', '#fcd34d'] },
  // Sympathy
  'sympathy-warm':    { shapes: ['#c4a882', '#b09070', '#d4b896', '#a87850', '#e0c8a8'] },
  'sympathy-elegant': { shapes: ['#c4b5a0', '#a89580', '#d6c8b8', '#b8a898', '#e2d5c8'] },
  'sympathy-minimal': { shapes: ['#9ca3af', '#d1d5db', '#6b7280', '#e5e7eb', '#4b5563'] },
  sympathy:           { shapes: ['#c4b5a0', '#a89580', '#d6c8b8', '#b8a898', '#e2d5c8'] },
  // Congrats
  'congrats-bold':    { shapes: ['#ef4444', '#f59e0b', '#fbbf24', '#f97316', '#e11d48'] },
  'congrats-playful': { shapes: ['#10b981', '#3b82f6', '#ec4899', '#f59e0b', '#6366f1'] },
  'congrats-elegant': { shapes: ['#d4af70', '#c9a85e', '#a8c5a0', '#7fb874', '#f0e4c0'] },
  congrats:           { shapes: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#fbbf24'] },
  // Business
  'business-minimal': { shapes: ['#a8a29e', '#d6d3d1', '#78716c', '#b4b0ac', '#9ca3af'] },
  'business-bold':    { shapes: ['#1d4ed8', '#3b82f6', '#e0f2fe', '#93c5fd', '#bfdbfe'] },
  'business-elegant': { shapes: ['#78716c', '#a8a29e', '#d4cfc8', '#c4bdb8', '#e2ddd8'] },
  business:           { shapes: ['#78716c', '#a8a29e', '#d4cfc8', '#57534e', '#b8b4b0'] },
  // Invitation
  'invitation-elegant': { shapes: ['#c9a85e', '#d4af70', '#a88740', '#e8d5a0', '#f0e4c0'] },
  'invitation-warm':    { shapes: ['#f59e0b', '#ea580c', '#d4af70', '#fbbf24', '#c9a85e'] },
  'invitation-playful': { shapes: ['#ec4899', '#f97316', '#f59e0b', '#a855f7', '#fb923c'] },
  invitation:           { shapes: ['#d4af70', '#c9a85e', '#e8d5a0', '#b8964a', '#f0e4c0'] },
  // Default (no selection)
  default:              { shapes: ['#c4a882', '#d4b896', '#b8a070', '#e2d0b8', '#a89060'] },
};

function getMood(prefs: FlyerPreferences): MoodPalette {
  const occ = prefs.occasion ?? '';
  const vibe = prefs.vibe ?? '';
  const combined = `${occ}-${vibe}`;
  return (
    MOOD_PALETTES[combined] ??
    MOOD_PALETTES[occ] ??
    MOOD_PALETTES.default
  );
}

type ShapeConfig = {
  size: number;
  top: string;
  left: string;
  opacity: number;
  blur: number;
  anim: 'float-a' | 'float-b' | 'float-c';
  dur: number;
  delay: number;
  radius: string;
  cIdx: number;
};

// 9 shapes: 3 large bokeh blobs, 3 medium soft patches, 3 small accent dots
const SHAPE_CONFIGS: ShapeConfig[] = [
  // Large bokeh blobs
  { size: 110, top: '5%',  left: '4%',  opacity: 0.16, blur: 22, anim: 'float-a', dur: 14, delay: 0,   radius: '60% 40% 55% 45%', cIdx: 0 },
  { size: 90,  top: '58%', left: '68%', opacity: 0.14, blur: 20, anim: 'float-b', dur: 17, delay: 2.0, radius: '45% 55% 60% 40%', cIdx: 2 },
  { size: 75,  top: '72%', left: '8%',  opacity: 0.14, blur: 18, anim: 'float-c', dur: 12, delay: 0.5, radius: '55% 45% 40% 60%', cIdx: 1 },
  // Medium soft patches
  { size: 42,  top: '18%', left: '74%', opacity: 0.19, blur: 8,  anim: 'float-b', dur: 10, delay: 1.2, radius: '50%',              cIdx: 3 },
  { size: 38,  top: '48%', left: '44%', opacity: 0.15, blur: 7,  anim: 'float-a', dur: 11, delay: 3.0, radius: '55% 45% 50% 50%', cIdx: 0 },
  { size: 52,  top: '32%', left: '14%', opacity: 0.14, blur: 10, anim: 'float-c', dur: 13, delay: 1.8, radius: '40% 60% 45% 55%', cIdx: 4 },
  // Small accent dots
  { size: 14,  top: '11%', left: '54%', opacity: 0.38, blur: 2,  anim: 'float-a', dur: 7,  delay: 0.3, radius: '50%',              cIdx: 1 },
  { size: 11,  top: '84%', left: '82%', opacity: 0.42, blur: 1,  anim: 'float-b', dur: 8,  delay: 2.5, radius: '50%',              cIdx: 2 },
  { size: 9,   top: '43%', left: '87%', opacity: 0.32, blur: 2,  anim: 'float-c', dur: 6,  delay: 1.0, radius: '50%',              cIdx: 3 },
];

const PROGRESS_STAGES = [
  'Writing your message…',
  'Designing your canvas…',
  'Adding finishing touches…',
];

export function StylePreview({ prefs, generating = false }: StylePreviewProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const mood = getMood(prefs);

  useEffect(() => {
    if (!generating) return;
    setStageIndex(0);
    const timer = setInterval(() => {
      setStageIndex((i) => (i + 1) % PROGRESS_STAGES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [generating]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Floating ambient shapes */}
      {SHAPE_CONFIGS.map((s, i) => (
        <div
          key={i}
          className="absolute pointer-events-none ambient-float"
          style={{
            width: s.size,
            height: s.size,
            top: s.top,
            left: s.left,
            opacity: s.opacity,
            borderRadius: s.radius,
            backgroundColor: mood.shapes[s.cIdx % mood.shapes.length],
            filter: `blur(${s.blur}px)`,
            animation: `${s.anim} ${s.dur}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
            transition: 'background-color 0.9s ease',
          }}
        />
      ))}

      {/* Generating progress overlay */}
      {generating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <p
            key={stageIndex}
            className="text-zinc-400 text-xs font-mono"
            style={{ animation: 'fadeIn 0.4s ease' }}
          >
            {PROGRESS_STAGES[stageIndex]}
          </p>
          <p className="text-zinc-600 text-xs">This can take 30–90 seconds</p>
        </div>
      )}
    </div>
  );
}
