'use client';

import { useState } from 'react';
import { useGenerator } from '@/hooks/useGenerator';
import { CanvasPanel } from './CanvasPanel';
import { ControlPanel } from './ControlPanel';
import { VersionStrip } from './VersionStrip';
import { DownloadModal } from './DownloadModal';
import { RefinementChat } from './RefinementChat';

export function StudioLayout() {
  const generator = useGenerator();
  const [showDownload, setShowDownload] = useState(false);

  const showChat = generator.phase === 'done' || generator.isRefining;

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 h-12 border-b border-zinc-800 shrink-0 bg-[#0d0d0f]">
        <div className="flex items-center gap-2.5">
          <span className="text-amber-400 text-lg leading-none">◈</span>
          <span className="font-display text-sm font-semibold tracking-[0.2em] uppercase text-zinc-200">
            FlyerCraft
          </span>
          <span className="ml-2 text-[10px] font-mono bg-amber-400/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-400/20 uppercase tracking-widest">
            v2
          </span>
        </div>

        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-zinc-500 font-mono">AI ready</span>
        </div>
      </header>

      {/* ── Main panels ───────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 divide-x divide-zinc-800">
        {/* Left: canvas */}
        <div className="flex-[3] min-w-0">
          <CanvasPanel
            phase={generator.phase}
            currentVersion={generator.currentVersion}
            errorMsg={generator.errorMsg}
            onDownload={() => setShowDownload(true)}
            onReset={generator.reset}
          />
        </div>

        {/* Right: controls + optional chat panel */}
        <div className="flex-[2] min-w-0 min-h-0 flex flex-col overflow-hidden divide-y divide-zinc-800">
          {/* Control panel — scrollable, takes remaining space */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <ControlPanel
              phase={generator.phase}
              onGenerate={generator.generate}
              onReset={generator.reset}
              errorMsg={generator.errorMsg}
            />
          </div>

          {/* Refinement chat — appears when a flyer is done (or refining) */}
          {showChat && (
            <div className="h-64 shrink-0">
              <RefinementChat
                onRefine={generator.refine}
                isRefining={generator.isRefining}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Version strip ─────────────────────────────────────── */}
      {generator.versionHistory.length > 0 && (
        <VersionStrip
          versions={generator.versionHistory}
          currentVersion={generator.currentVersion}
          onSelect={generator.selectVersion}
        />
      )}

      {/* ── Download modal ────────────────────────────────────── */}
      {showDownload && generator.currentVersion && (
        <DownloadModal
          jobId={generator.currentVersion.jobId}
          imageDataUrl={generator.currentVersion.imageDataUrl}
          onClose={() => setShowDownload(false)}
          onNewFlyer={generator.reset}
        />
      )}
    </div>
  );
}
