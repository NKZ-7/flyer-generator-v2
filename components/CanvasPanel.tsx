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
    <div className="relative h-full flex flex-col bg-[#0d0d0f]">
      {/* Dot-grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, #27272a 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Canvas area */}
      <div className="relative flex-1 flex items-center justify-center p-4 md:p-8 min-h-0">
        {phase === 'idle' && <StylePreview prefs={prefs} />}
        {phase === 'generating' && <GeneratingState />}
        {phase === 'done' && currentVersion && (
          <FlyerPreview imageDataUrl={currentVersion.imageDataUrl} />
        )}
        {phase === 'error' && (
          <ErrorState message={errorMsg} onRetry={onReset} />
        )}
      </div>

      {/* Bottom toolbar — only when a flyer is ready */}
      {phase === 'done' && currentVersion && (
        <div className="relative shrink-0 flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-[#0d0d0f]">
          <span className="text-xs text-zinc-500 font-mono">
            1024 × 1024 px
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="px-3 py-1.5 text-xs text-zinc-400 border border-zinc-700 rounded hover:border-zinc-500 hover:text-zinc-200 transition-colors"
            >
              New flyer
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

function GeneratingState() {
  const stages = [
    'Sending to AI…',
    'Crafting your copy…',
    'Designing layout…',
    'Almost ready…',
  ];

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Animated frame */}
      <div
        className="relative rounded-sm overflow-hidden border border-zinc-700"
        style={{ width: 200, height: 200 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-800">
          {/* Shimmer stripes */}
          {[0.08, 0.2, 0.36, 0.52, 0.65, 0.78].map((top, i) => (
            <div
              key={i}
              className="absolute left-6 right-6 h-2 rounded-full bg-zinc-700/60 animate-pulse"
              style={{
                top: `${top * 100}%`,
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
        {/* Scanning line */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80"
          style={{ animation: 'scan 2s ease-in-out infinite' }}
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <p className="text-zinc-400 text-xs font-mono animate-pulse">
          {stages[Math.floor(Date.now() / 2000) % stages.length]}
        </p>
        <p className="text-zinc-600 text-xs">This can take 30–90 seconds</p>
      </div>
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
        alt="Generated flyer"
        className="relative max-h-[calc(100vh-220px)] max-w-full object-contain rounded-sm shadow-2xl shadow-black/60 ring-1 ring-white/10"
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
        <p className="text-zinc-300 text-sm font-medium">Generation failed</p>
        <p className="text-zinc-500 text-xs mt-1">
          {message ?? 'Something went wrong. Please try again.'}
        </p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 text-xs font-semibold bg-zinc-800 text-zinc-200 border border-zinc-700 rounded hover:bg-zinc-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
