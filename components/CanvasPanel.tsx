'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { GeneratorPhase, RateLimitInfo, VersionEntry, FlyerPreferences } from '@/lib/types';
import { SignInPrompt } from './SignInPrompt';
import { COLOR_SCHEME_THEMES, FONT_STYLE_MAP, SHOWCASE } from '@/lib/design-constants';

interface CanvasPanelProps {
  phase: GeneratorPhase;
  currentVersion: VersionEntry | null;
  errorMsg: string | null;
  rateLimitInfo: RateLimitInfo | null;
  onDownload: () => void;
  onReset: () => void;
  prefs: FlyerPreferences;
}

const STATUS_MSGS = [
  'Sketching the layout…',
  'Choosing your palette…',
  'Setting the type…',
  'Adding final touches…',
];

export function CanvasPanel({
  phase,
  currentVersion,
  errorMsg,
  rateLimitInfo,
  onDownload,
  onReset,
  prefs,
}: CanvasPanelProps) {
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Showcase reel (idle) ────────────────────────────────────
  const [showcaseIdx, setShowcaseIdx] = useState(0);
  const [showcaseVisible, setShowcaseVisible] = useState(true);
  useEffect(() => {
    if (phase !== 'idle' || reducedMotion) return;
    const interval = setInterval(() => {
      setShowcaseVisible(false);
      setTimeout(() => {
        setShowcaseIdx((i) => (i + 1) % SHOWCASE.length);
        setShowcaseVisible(true);
      }, 520);
    }, 3600);
    return () => clearInterval(interval);
  }, [phase, reducedMotion]);

  // ── Generating status cycling ───────────────────────────────
  const [genMsgIdx, setGenMsgIdx] = useState(0);
  useEffect(() => {
    if (phase !== 'generating') return;
    const t = setInterval(() => setGenMsgIdx((i) => (i + 1) % STATUS_MSGS.length), 760);
    return () => clearInterval(t);
  }, [phase]);

  return (
    <div className="relative h-full overflow-hidden">
      {phase === 'idle' && (
        <IdleShowcase
          prefs={prefs}
          entry={SHOWCASE[showcaseIdx]}
          showcaseVisible={showcaseVisible}
        />
      )}

      {phase === 'generating' && (
        <GeneratingState genMsgIdx={genMsgIdx} />
      )}

      {phase === 'done' && currentVersion && (
        <DoneState
          imageDataUrl={currentVersion.imageDataUrl}
          onDownload={onDownload}
          onReset={onReset}
        />
      )}

      {phase === 'error' && (
        <CenteredCanvas>
          <ErrorState message={errorMsg} onRetry={onReset} />
        </CenteredCanvas>
      )}

      {phase === 'rate_limited' && rateLimitInfo && (
        <CenteredCanvas>
          <RateLimitState info={rateLimitInfo} onReset={onReset} />
        </CenteredCanvas>
      )}

      {/* Sign-in nudge — only for anonymous users after card is ready */}
      {phase === 'done' && currentVersion && <SignInPrompt />}
    </div>
  );
}

// ── Shared warm canvas background ──────────────────────────────
function CanvasBackground() {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(120% 120% at 50% 0%, #F6F0E5 0%, #E7DAC4 70%, #DCCDB2 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(140,110,80,0.13) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />
    </>
  );
}

function CenteredCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full overflow-hidden">
      <CanvasBackground />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}

// ── Idle showcase reel ─────────────────────────────────────────
function IdleShowcase({
  prefs,
  entry,
  showcaseVisible,
}: {
  prefs: FlyerPreferences;
  entry: (typeof SHOWCASE)[number];
  showcaseVisible: boolean;
}) {
  const theme =
    COLOR_SCHEME_THEMES[prefs.colorScheme ?? 'warm'] ?? COLOR_SCHEME_THEMES.warm;
  const fontEntry =
    FONT_STYLE_MAP[prefs.fontStyle ?? 'modern'] ?? FONT_STYLE_MAP.modern;
  const fontStyle = fontEntry.style;

  return (
    <div className="relative h-full overflow-hidden">
      <CanvasBackground />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6">
        {/* Caption block */}
        <div style={{ maxWidth: 340, textAlign: 'center', marginBottom: 8 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8A7257', marginBottom: 8 }}>LIVE PREVIEW</p>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 25, fontWeight: 600, color: '#3A2C1C', lineHeight: 1.2, marginBottom: 6 }}>Design a card worth keeping.</p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: '#8A7257', lineHeight: 1.5 }}>Your palette and type, across every occasion — add details on the right to make it yours.</p>
        </div>

        {/* Preview card */}
        <div
          style={{
            width: 340,
            height: 430,
            borderRadius: 8,
            padding: 30,
            background: theme.bg,
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow:
              '0 36px 70px -18px rgba(40,26,12,0.62), inset 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          {/* Gold glow behind card */}
          <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'rgba(227,169,60,0.10)', filter: 'blur(36px)', zIndex: -1, pointerEvents: 'none' }} />
          {/* Inset frame */}
          <div style={{ position: 'absolute', inset: 14, border: `1px solid ${theme.frame}`, borderRadius: 4, pointerEvents: 'none' }} />
          {/* Card content — fade-controlled */}
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
              opacity: showcaseVisible ? 1 : 0,
              transform: showcaseVisible ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}
          >
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.accent }}>{entry.label}</p>
            <div>
              <p className={fontEntry.className} style={{ ...fontStyle, fontSize: 38, color: theme.ink, lineHeight: 1.1, marginBottom: 8 }}>{entry.title}</p>
              <p style={{ fontSize: 10, color: theme.sub, marginBottom: 6, letterSpacing: '0.08em' }}>— ◈ —</p>
              <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 16, fontStyle: 'italic', color: theme.sub }}>{entry.tagline}</p>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: theme.sub, letterSpacing: '0.1em' }}>{entry.detail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Generating skeleton ────────────────────────────────────────
function GeneratingState({ genMsgIdx }: { genMsgIdx: number }) {
  return (
    <div className="relative h-full overflow-hidden">
      <CanvasBackground />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        <div
          style={{
            width: 340,
            height: 430,
            borderRadius: 8,
            position: 'relative',
            overflow: 'hidden',
            background: '#2A2118',
            boxShadow: '0 36px 70px -18px rgba(40,26,12,0.62)',
          }}
        >
          {/* Shimmer overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(100deg,#2A2118 30%,rgba(227,169,60,0.14) 50%,#2A2118 70%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer-gold 1.5s linear infinite',
            }}
          />
          {/* Scan line */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: 2,
              background: '#E3A93C',
              opacity: 0.7,
              filter: 'blur(1px)',
              animation: 'scan 2.1s ease-in-out infinite',
            }}
          />
          {/* Inset frame */}
          <div style={{ position: 'absolute', inset: 14, border: '1px solid rgba(227,169,60,0.25)', borderRadius: 4, pointerEvents: 'none' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <div style={{ width: 22, height: 22, border: '2px solid #E3A93C', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin-slow 1s linear infinite' }} />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#6B5742' }}>{STATUS_MSGS[genMsgIdx]}</p>
        </div>
      </div>
    </div>
  );
}

// ── Done state ─────────────────────────────────────────────────
function DoneState({
  imageDataUrl,
  onDownload,
  onReset,
}: {
  imageDataUrl: string;
  onDownload: () => void;
  onReset: () => void;
}) {
  return (
    <div className="relative h-full overflow-hidden">
      <CanvasBackground />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Gold glow */}
          <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'rgba(227,169,60,0.10)', filter: 'blur(36px)', zIndex: 0 }} />
          {/* Card */}
          <img
            src={imageDataUrl}
            alt="Generated card"
            style={{
              width: 368,
              height: 466,
              borderRadius: 8,
              objectFit: 'cover',
              position: 'relative',
              zIndex: 1,
              boxShadow:
                '0 36px 70px -18px rgba(40,26,12,0.62),inset 0 0 0 1px rgba(255,255,255,0.06)',
              animation: 'fade-up 0.45s ease both',
            }}
          />
        </div>
      </div>

      {/* Bottom toolbar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(207,188,159,0.5)',
          borderTop: '1px solid #CDBC9F',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#7A6347' }}>1024 × 1024 px · PNG</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onReset} style={{ border: '1px solid #B7A585', color: '#C4B49E', background: 'transparent', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>New card</button>
          <button onClick={onDownload} className="btn-gold" style={{ borderRadius: 8, padding: '6px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Download ↓</button>
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center gap-4 max-w-xs text-center"
      style={{ background: '#241C13', border: '1px solid #33281B', borderRadius: 12, padding: 24 }}
    >
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(227,169,60,0.10)', border: '1px solid rgba(227,169,60,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E3A93C', fontSize: 18 }}>
        ✕
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 20, fontWeight: 600, color: '#F1E8DB' }}>Generation failed</p>
        <p style={{ fontSize: 12, color: '#8A7560', marginTop: 4 }}>
          {message ?? 'Something went wrong. Please try again.'}
        </p>
      </div>
      <button
        onClick={onRetry}
        className="btn-gold"
        style={{ borderRadius: 8, padding: '8px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
      >
        Try again
      </button>
    </div>
  );
}

function RateLimitState({
  info,
  onReset,
}: {
  info: RateLimitInfo;
  onReset: () => void;
}) {
  const resetDate = new Date(info.resetAt);

  const friendlyDate = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month:   'long',
    day:     'numeric',
  }).format(resetDate);

  const friendlyDateTime = new Intl.DateTimeFormat(undefined, {
    month:  'long',
    day:    'numeric',
    hour:   'numeric',
    minute: '2-digit',
  }).format(resetDate);

  const cardStyle: React.CSSProperties = {
    background: '#241C13',
    border: '1px solid #33281B',
    borderRadius: 12,
    padding: 24,
  };

  if (info.reason === 'anonymous') {
    return (
      <div className="flex flex-col items-center gap-5 max-w-[280px] text-center" style={cardStyle}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(227,169,60,0.10)', border: '1px solid rgba(227,169,60,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E3A93C', fontSize: 16, lineHeight: 1 }}>
          ◈
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 19, fontWeight: 600, color: '#F1E8DB', lineHeight: 1.3 }}>
            You've made 4 cards in the last few days.
          </p>
          <p style={{ fontSize: 12, color: '#8A7560', marginTop: 8, lineHeight: 1.5 }}>
            Sign in to keep going — I'll save your future cards too.
          </p>
        </div>
        <div className="flex flex-col items-center gap-2.5 w-full">
          <Link
            href="/sign-in?next=/"
            className="btn-gold"
            style={{ width: '100%', borderRadius: 8, padding: '10px 0', fontSize: 12, fontWeight: 600, textAlign: 'center', display: 'block' }}
          >
            Sign in
          </Link>
          <p style={{ fontSize: 11, color: '#8A7560' }}>
            Or come back on {friendlyDate}.
          </p>
          <button
            onClick={onReset}
            style={{ fontSize: 11, color: '#6B5742', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // Signed-in rate limit
  return (
    <div className="flex flex-col items-center gap-5 max-w-[280px] text-center" style={cardStyle}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(227,169,60,0.10)', border: '1px solid rgba(227,169,60,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E3A93C', fontSize: 16, lineHeight: 1 }}>
        ◈
      </div>
      <div>
        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 19, fontWeight: 600, color: '#F1E8DB', lineHeight: 1.3 }}>
          You've made a lot today.
        </p>
        <p style={{ fontSize: 12, color: '#8A7560', marginTop: 8, lineHeight: 1.5 }}>
          Take a breath — you can make more starting {friendlyDateTime}.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2.5">
        <Link
          href="/history"
          style={{ border: '1px solid #33281B', color: '#C4B49E', borderRadius: 8, padding: '8px 18px', fontSize: 12, textDecoration: 'none' }}
        >
          View your cards
        </Link>
        <button
          onClick={onReset}
          style={{ fontSize: 11, color: '#6B5742', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
