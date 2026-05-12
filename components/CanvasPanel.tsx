'use client';

import type { GeneratorPhase, VersionEntry, FlyerPreferences } from '@/lib/types';
import { StylePreview } from './StylePreview';

interface CanvasPanelProps {
  phase: GeneratorPhase;
  currentVersion: VersionEntry | null;
  errorMsg: string | null;
  onDownload: () => void;
  onReset: () => void;
  prefs: FlyerPreferences;
}

export function CanvasPanel({
  phase,
  currentVersion,
  errorMsg,
  onDownload,
  onReset,
  prefs,
}: CanvasPanelProps) {
  return (
    <div
      className="relative h-full flex flex-col"
      style={{ background: 'linear-gradient(to bottom, #F2EBDE 0%, #D9CBB3 100%)' }}
    >
      {/* Dot-grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(140,110,80,0.14) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Canvas area */}
      <div className="relative flex-1 flex items-center justify-center p-4 md:p-8 min-h-0">
        {(phase === 'idle' || phase === 'generating') && (
          <StylePreview prefs={prefs} generating={phase === 'generating'} />
        )}
        {phase === 'done' && currentVersion && (
          <FlyerPreview imageDataUrl={currentVersion.imageDataUrl} />
        )}
        {phase === 'error' && (
          <ErrorState message={errorMsg} onRetry={onReset} />
        )}
      </div>

      {/* Bottom toolbar — only when a flyer is ready */}
      {phase === 'done' && currentVersion && (
        <div className="relative shrink-0 flex items-center justify-between px-5 py-3 border-t border-cream-border bg-[#CCBCA6]">
          <span className="text-xs text-[#8B7355] font-mono">
            1024 × 1024 px
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="px-3 py-1.5 text-xs text-[#8B7355] border border-cream-border rounded hover:border-[#8B7355] hover:text-warm-800 transition-colors"
            >
              New card
            </button>
            <button
              onClick={onDownload}
              className="px-4 py-1.5 text-xs font-semibold bg-amber-400 text-zinc-950 rounded hover:bg-amber-300 transition-colors"
            >
              Download ↓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function FlyerPreview({ imageDataUrl }: { imageDataUrl: string }) {
  return (
    <div className="relative">
      {/* Shadow glow */}
      <div className="absolute -inset-4 bg-amber-400/5 rounded-lg blur-2xl pointer-events-none" />
      <img
        src={imageDataUrl}
        alt="Generated card"
        className="relative max-h-[calc(100vh-220px)] max-w-full object-contain rounded-sm shadow-2xl shadow-black/60 ring-1 ring-[#C0AE98]/50"
        style={{ imageRendering: 'crisp-edges' }}
      />
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
    <div className="flex flex-col items-center gap-4 max-w-xs text-center">
      <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 text-lg">
        ✕
      </div>
      <div>
        <p className="text-[#2A211A] text-sm font-medium">Generation failed</p>
        <p className="text-[#8B7355] text-xs mt-1">
          {message ?? 'Something went wrong. Please try again.'}
        </p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 text-xs font-semibold bg-cream-dim text-warm-800 border border-cream-border rounded hover:bg-cream-border transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
