'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { FlyerPreferences } from '@/lib/types';

interface StylePreviewProps {
  prefs: FlyerPreferences;
  generating?: boolean;
}

type MoodPalette = { shapes: string[] };

const MOOD_PALETTES: Record<string, MoodPalette> = {
  'birthday-playful': { shapes: ['#ec4899', '#f97316', '#fbbf24', '#fb923c', '#e11d48'] },
  'birthday-warm':    { shapes: ['#f59e0b', '#ea580c', '#fcd34d', '#c2410c', '#f97316'] },
  'birthday-bold':    { shapes: ['#ef4444', '#f59e0b', '#3b82f6', '#ec4899', '#fbbf24'] },
  'birthday-elegant': { shapes: ['#d4af70', '#c9a85e', '#f0e4c0', '#e8d5a0', '#b8964a'] },
  birthday:           { shapes: ['#f59e0b', '#f97316', '#fbbf24', '#fb923c', '#fcd34d'] },
  'sympathy-warm':    { shapes: ['#c4a882', '#b09070', '#d4b896', '#a87850', '#e0c8a8'] },
  'sympathy-elegant': { shapes: ['#c4b5a0', '#a89580', '#d6c8b8', '#b8a898', '#e2d5c8'] },
  'sympathy-minimal': { shapes: ['#9ca3af', '#d1d5db', '#6b7280', '#e5e7eb', '#4b5563'] },
  sympathy:           { shapes: ['#c4b5a0', '#a89580', '#d6c8b8', '#b8a898', '#e2d5c8'] },
  'congrats-bold':    { shapes: ['#ef4444', '#f59e0b', '#fbbf24', '#f97316', '#e11d48'] },
  'congrats-playful': { shapes: ['#10b981', '#3b82f6', '#ec4899', '#f59e0b', '#6366f1'] },
  'congrats-elegant': { shapes: ['#d4af70', '#c9a85e', '#a8c5a0', '#7fb874', '#f0e4c0'] },
  congrats:           { shapes: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#fbbf24'] },
  'business-minimal': { shapes: ['#a8a29e', '#d6d3d1', '#78716c', '#b4b0ac', '#9ca3af'] },
  'business-bold':    { shapes: ['#1d4ed8', '#3b82f6', '#e0f2fe', '#93c5fd', '#bfdbfe'] },
  'business-elegant': { shapes: ['#78716c', '#a8a29e', '#d4cfc8', '#c4bdb8', '#e2ddd8'] },
  business:           { shapes: ['#78716c', '#a8a29e', '#d4cfc8', '#57534e', '#b8b4b0'] },
  'invitation-elegant': { shapes: ['#c9a85e', '#d4af70', '#a88740', '#e8d5a0', '#f0e4c0'] },
  'invitation-warm':    { shapes: ['#f59e0b', '#ea580c', '#d4af70', '#fbbf24', '#c9a85e'] },
  'invitation-playful': { shapes: ['#ec4899', '#f97316', '#f59e0b', '#a855f7', '#fb923c'] },
  invitation:           { shapes: ['#d4af70', '#c9a85e', '#e8d5a0', '#b8964a', '#f0e4c0'] },
  default:              { shapes: ['#c4a882', '#d4b896', '#b8a070', '#e2d0b8', '#a89060'] },
};

function getMood(prefs: FlyerPreferences): MoodPalette {
  const occ = prefs.occasion ?? '';
  const vibe = prefs.vibe ?? '';
  return (
    MOOD_PALETTES[`${occ}-${vibe}`] ??
    MOOD_PALETTES[occ] ??
    MOOD_PALETTES.default
  );
}

// ── SVG Line Drawing paths ────────────────────────────────────────────────────

type LineDrawing = { viewBox: string; paths: string[]; name: string };

const LINE_DRAWINGS: LineDrawing[] = [
  {
    name: 'rose',
    viewBox: '0 0 80 80',
    paths: [
      'M40,40 C40,40 30,30 30,20 C30,14 35,10 40,10 C45,10 50,14 50,20 C50,30 40,40 40,40',
      'M40,40 C40,40 50,30 58,23 C62,18 60,12 55,10 C50,8 46,12 46,18',
      'M40,40 C40,40 28,34 22,26 C18,20 20,14 25,12 C30,10 35,14 35,20',
      'M40,40 C40,40 30,50 22,52 C16,54 12,50 14,44 C16,38 22,36 28,40',
      'M40,40 C40,40 50,50 58,52 C64,54 66,48 64,42 C62,36 56,35 52,40',
      'M40,40 Q40,55 40,68',
    ],
  },
  {
    name: 'bouquet',
    viewBox: '0 0 80 90',
    paths: [
      'M30,50 L26,20 M26,20 C26,14 22,10 18,12 C14,14 14,20 18,22 C22,24 26,20 26,20 C26,20 22,16 24,12',
      'M40,50 L40,15 M40,15 C40,9 36,6 33,8 C30,10 31,16 35,17 C39,18 40,15 40,15 C40,15 37,10 40,7',
      'M50,50 L54,22 M54,22 C54,16 58,12 62,14 C66,16 65,22 61,23 C57,24 54,22 54,22 C54,22 58,17 56,13',
      'M28,52 C28,52 40,58 52,52',
      'M26,55 C30,65 50,65 54,55',
    ],
  },
  {
    name: 'wreath',
    viewBox: '0 0 100 100',
    paths: [
      'M50,10 C72,10 90,28 90,50 C90,72 72,90 50,90 C28,90 10,72 10,50 C10,28 28,10 50,10',
      'M42,10 C38,15 40,20 44,18 C40,22 36,20 38,14',
      'M58,10 C62,15 60,20 56,18 C60,22 64,20 62,14',
      'M88,42 C83,38 78,40 80,44 C76,40 78,36 84,38',
      'M88,58 C83,62 78,60 80,56 C76,60 78,64 84,62',
      'M58,90 C62,85 60,80 56,82 C60,78 64,80 62,86',
      'M42,90 C38,85 40,80 44,82 C40,78 36,80 38,86',
      'M12,58 C17,62 22,60 20,56 C24,60 22,64 16,62',
      'M12,42 C17,38 22,40 20,44 C24,40 22,36 16,38',
    ],
  },
  {
    name: 'leaf',
    viewBox: '0 0 60 100',
    paths: [
      'M30,5 C50,20 55,50 45,70 C38,85 22,85 15,70 C5,50 10,20 30,5',
      'M30,5 L30,95',
      'M30,30 C22,35 16,42 15,50',
      'M30,30 C38,35 44,42 45,50',
      'M30,50 C22,54 17,60 17,65',
      'M30,50 C38,54 43,60 43,65',
      'M30,65 C24,68 21,73 22,77',
      'M30,65 C36,68 39,73 38,77',
    ],
  },
  {
    name: 'vine',
    viewBox: '0 0 120 80',
    paths: [
      'M5,70 C20,55 35,60 45,45 C55,30 65,35 80,20 C90,10 105,15 115,10',
      'M25,58 C20,50 22,44 28,44 C24,48 26,54 32,52',
      'M50,44 C45,36 47,30 53,30 C49,34 51,40 57,38',
      'M78,24 C73,16 75,10 81,10 C77,14 79,20 85,18',
      'M38,60 C42,54 40,48 36,50 C40,46 44,50 42,56',
    ],
  },
  {
    name: 'heart-floral',
    viewBox: '0 0 90 90',
    paths: [
      'M45,75 C20,55 10,40 10,28 C10,18 18,10 28,10 C36,10 42,14 45,20 C48,14 54,10 62,10 C72,10 80,18 80,28 C80,40 70,55 45,75',
      'M45,22 C45,18 42,16 40,18 C38,14 40,12 44,13',
      'M45,22 C45,18 48,16 50,18 C52,14 50,12 46,13',
      'M16,26 C14,22 16,18 20,19 C16,23 18,27 22,26',
      'M74,26 C76,22 74,18 70,19 C74,23 72,27 68,26',
    ],
  },
  {
    name: 'geometric',
    viewBox: '0 0 100 100',
    paths: [
      'M15,15 L85,15 L85,85 L15,85 Z',
      'M15,15 C10,10 5,12 5,17 C5,22 10,22 15,15',
      'M85,15 C90,10 95,12 95,17 C95,22 90,22 85,15',
      'M85,85 C90,90 95,88 95,83 C95,78 90,78 85,85',
      'M15,85 C10,90 5,88 5,83 C5,78 10,78 15,85',
      'M30,15 L15,30',
      'M70,15 L85,30',
      'M85,70 L70,85',
      'M15,70 L30,85',
    ],
  },
  {
    name: 'ribbon',
    viewBox: '0 0 100 60',
    paths: [
      'M10,30 C20,15 35,10 50,20 C65,30 80,25 90,30',
      'M10,30 C20,45 35,50 50,40 C65,30 80,35 90,30',
      'M48,18 C44,22 44,28 48,32 C52,36 56,32 56,28 C56,22 52,18 48,18',
    ],
  },
  {
    name: 'envelope',
    viewBox: '0 0 100 80',
    paths: [
      'M10,20 L90,20 L90,70 L10,70 Z',
      'M10,20 L50,48 L90,20',
      'M50,55 C47,52 47,48 50,46 C53,44 56,46 56,50 C56,54 53,57 50,55',
      'M46,46 C44,42 45,38 48,37',
      'M54,46 C56,42 55,38 52,37',
    ],
  },
  {
    name: 'hand-card',
    viewBox: '0 0 100 100',
    paths: [
      'M25,55 L25,90 C25,92 27,94 30,94 L70,94 C73,94 75,92 75,90 L75,55 Z',
      'M25,55 L75,55 L70,44 L30,44 Z',
      'M35,68 L65,68',
      'M35,76 L55,76',
      'M35,84 L50,84',
      'M60,30 C58,20 62,14 68,16 C70,10 76,10 78,16 C82,14 85,18 83,24 L78,40 C76,46 72,48 68,46 L58,38 C54,36 54,30 60,30',
      'M68,46 L72,56',
    ],
  },
];

// ── Particle text ─────────────────────────────────────────────────────────────

const PHRASES = [
  'for someone special',
  'warm wishes',
  'with love',
  'a little joy',
  'thinking of you',
  'celebrate',
  'from your heart',
  'share the moment',
  'make it personal',
];

type TextPhase = 'drift' | 'forming' | 'formed' | 'dispersing';
type Particle = { id: number; x: number; y: number; tx: number; ty: number };

function rasterizePhrase(phrase: string, w: number, h: number, count: number): { x: number; y: number }[] {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    const fontSize = Math.max(14, Math.floor(h * 0.18));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(phrase, w / 2, h / 2);
    const data = ctx.getImageData(0, 0, w, h).data;
    const pts: { x: number; y: number }[] = [];
    const step = 3;
    for (let y = 0; y < h; y += step)
      for (let x = 0; x < w; x += step)
        if (data[(y * w + x) * 4 + 3] > 100) pts.push({ x, y });
    return pts.sort(() => Math.random() - 0.5).slice(0, count);
  } catch {
    return [];
  }
}

function asyncDelay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ── Sentiment / input reactivity ─────────────────────────────────────────────

const SENTIMENT_KEYS: Record<string, string[]> = {
  somber:  ['loss', 'passed', 'remember', 'miss', 'grief', 'sympathy', 'condolence', 'gone', 'mourn', 'late'],
  joyful:  ['celebrate', 'birthday', 'happy', 'congrats', 'amazing', 'party', 'wild', 'yay', 'hooray', 'excited'],
  formal:  ['respectfully', 'honor', 'sincerely', 'occasion', 'cordially', 'hereby', 'esteemed'],
  casual:  ['buddy', 'mate', 'babe', 'girl', 'homie', 'dude', 'pal', 'bestie', 'fam'],
};

type Sentiment = 'default' | 'somber' | 'joyful' | 'formal' | 'casual';
type MotionTier = 'calm' | 'moderate' | 'lively';

function detectSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  for (const [key, list] of Object.entries(SENTIMENT_KEYS))
    if (list.some((w) => words.includes(w))) return key as Sentiment;
  return 'default';
}

// ── Progress stages ───────────────────────────────────────────────────────────

const PROGRESS_STAGES = [
  'Writing your message…',
  'Designing your canvas…',
  'Adding finishing touches…',
];

// ── Main component ────────────────────────────────────────────────────────────

export function StylePreview({ prefs, generating = false }: StylePreviewProps) {
  const mood = getMood(prefs);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Generating state ──────────────────────────────────────────────────────
  const [stageIndex, setStageIndex] = useState(0);
  useEffect(() => {
    if (!generating) return;
    setStageIndex(0);
    const t = setInterval(() => setStageIndex((i) => (i + 1) % PROGRESS_STAGES.length), 6500);
    return () => clearInterval(t);
  }, [generating]);

  // ── Element rotation: 0=particles 1=lines ────────────────────────────────
  const [elemIdx, setElemIdx] = useState(0);
  const [elemVisible, setElemVisible] = useState(true);
  useEffect(() => {
    const cycle = () => {
      setElemVisible(false);
      setTimeout(() => {
        setElemIdx((i) => (i + 1) % 2);
        setElemVisible(true);
      }, 1000);
    };
    const t = setInterval(cycle, 16000);
    return () => clearInterval(t);
  }, []);

  // ── Input reactivity ──────────────────────────────────────────────────────
  const [motionTier, setMotionTier] = useState<MotionTier>('moderate');
  const [sentiment, setSentiment] = useState<Sentiment>('default');
  useEffect(() => {
    const t = setTimeout(() => {
      const text = prefs.additionalContext ?? '';
      const len = text.length;
      setMotionTier(len <= 20 ? 'calm' : len <= 80 ? 'moderate' : 'lively');
      setSentiment(detectSentiment(text));
    }, 300);
    return () => clearTimeout(t);
  }, [prefs.additionalContext]);

  const durationScale = motionTier === 'calm' ? 1.6 : motionTier === 'lively' ? 0.7 : 1.0;

  const sentimentFilter =
    sentiment === 'somber' ? 'saturate(0.65) brightness(0.9)' :
    sentiment === 'joyful' ? 'saturate(1.3) brightness(1.05)' :
    sentiment === 'casual' ? 'saturate(1.1)' : '';

  // ── Line drawing rotation: one new drawing per visit ─────────────────────
  const [drawIdx, setDrawIdx] = useState(LINE_DRAWINGS.length - 1);
  useEffect(() => {
    if (elemIdx !== 1) return;
    setDrawIdx((i) => (i + 1) % LINE_DRAWINGS.length);
  }, [elemIdx]);

  // ── Particle text state machine ───────────────────────────────────────────
  const PARTICLE_COUNT = motionTier === 'calm' ? 44 : motionTier === 'lively' ? 90 : 72;
  const [particles, setParticles] = useState<Particle[]>([]);
  const [textPhase, setTextPhase] = useState<TextPhase>('drift');
  const [phraseIdx, setPhraseIdx] = useState(() => Math.floor(Math.random() * PHRASES.length));
  const letterCacheRef = useRef<Map<string, { x: number; y: number }[]>>(new Map());
  const abortRef = useRef(false);

  const runParticleSequence = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;
    const w = container.clientWidth || 400;
    const h = container.clientHeight || 300;

    const initParticles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, id) => ({
      id,
      x: Math.random() * w,
      y: Math.random() * h,
      tx: Math.random() * w,
      ty: Math.random() * h,
    }));
    setParticles(initParticles);
    setTextPhase('drift');

    await asyncDelay(3500);
    if (abortRef.current) return;

    const phrase = PHRASES[phraseIdx];
    let targets = letterCacheRef.current.get(phrase);
    if (!targets) {
      targets = rasterizePhrase(phrase, w, h, PARTICLE_COUNT);
      letterCacheRef.current.set(phrase, targets);
    }

    setParticles((prev) =>
      prev.map((p, i) => ({
        ...p,
        tx: targets![i % targets!.length].x,
        ty: targets![i % targets!.length].y,
      }))
    );
    setTextPhase('forming');

    await asyncDelay(1000);
    if (abortRef.current) return;
    setTextPhase('formed');

    await asyncDelay(2500);
    if (abortRef.current) return;
    setTextPhase('dispersing');
    setParticles((prev) =>
      prev.map((p) => ({
        ...p,
        tx: Math.random() * w,
        ty: Math.random() * h,
      }))
    );

    await asyncDelay(1000);
    if (abortRef.current) return;
    setPhraseIdx((i) => (i + 1) % PHRASES.length);
    setTextPhase('drift');
  }, [phraseIdx, PARTICLE_COUNT]);

  useEffect(() => {
    if (elemIdx !== 0) {
      abortRef.current = true;
      return;
    }
    abortRef.current = false;
    runParticleSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elemIdx, phraseIdx]);

  const particleForming = textPhase === 'forming' || textPhase === 'formed';

  // ── Reduced motion detection ──────────────────────────────────────────────
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none">

      {/* ── Element 0: Particle text ──────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: elemIdx === 0 && elemVisible ? 1 : 0,
          transition: 'opacity 1s ease',
          filter: sentimentFilter,
        }}
      >
        {prefersReduced ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p
              className="text-sm font-medium text-center px-4 italic"
              style={{
                color: mood.shapes[0],
                opacity: 0.5,
                fontFamily: 'Georgia, serif',
                transition: 'color 800ms ease',
              }}
            >
              {PHRASES[phraseIdx]}
            </p>
          </div>
        ) : (
          particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: 3,
                height: 3,
                left: particleForming ? p.tx : p.x,
                top:  particleForming ? p.ty : p.y,
                backgroundColor: mood.shapes[p.id % mood.shapes.length],
                opacity: 0.55,
                transition: 'left 1000ms ease, top 1000ms ease',
              }}
            />
          ))
        )}
      </div>

      {/* ── Element 1: Line drawings ──────────────────────────── */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          opacity: elemIdx === 1 && elemVisible ? 1 : 0,
          transition: 'opacity 1s ease',
        }}
      >
        {LINE_DRAWINGS.map((drawing, i) => {
          const isActive = drawIdx === i;
          const accentColor = mood.shapes[i % mood.shapes.length];
          const drawDur = 11 * durationScale;
          return (
            <svg
              key={isActive ? `${drawing.name}-${drawIdx}` : drawing.name}
              viewBox={drawing.viewBox}
              style={{
                width: '55%',
                maxWidth: 200,
                position: 'absolute',
                fill: 'none',
                stroke: accentColor,
                strokeWidth: 1.5,
                strokeLinecap: 'round' as const,
                strokeLinejoin: 'round' as const,
                opacity: isActive ? (prefersReduced ? 0.35 : undefined) : 0,
                transition: prefersReduced ? 'opacity 1s ease' : undefined,
                animation: isActive && !prefersReduced ? `fade-drawing ${drawDur}s ease forwards` : undefined,
              }}
            >
              {drawing.paths.map((d, pi) => (
                <path
                  key={pi}
                  d={d}
                  pathLength="1000"
                  style={{
                    strokeDasharray: 1000,
                    strokeDashoffset: isActive && !prefersReduced ? undefined : 0,
                    animation: isActive && !prefersReduced
                      ? `draw-offset ${drawDur}s ease forwards`
                      : undefined,
                  }}
                />
              ))}
            </svg>
          );
        })}
      </div>

      {/* ── Generating progress overlay ───────────────────────── */}
      {generating && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-cream/60 backdrop-blur-sm">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <p
            key={stageIndex}
            className="text-[#4A3C30] text-xs font-mono"
            style={{ animation: 'fadeIn 0.4s ease' }}
          >
            {PROGRESS_STAGES[stageIndex]}
          </p>
          <p className="text-[#8B7355] text-xs">This can take 30–90 seconds</p>
        </div>
      )}
    </div>
  );
}
