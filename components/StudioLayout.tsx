'use client';

import { useState } from 'react';
import { useGenerator } from '@/hooks/useGenerator';
import { CanvasPanel } from './CanvasPanel';
import { ControlPanel } from './ControlPanel';
import { VersionStrip } from './VersionStrip';
import { DownloadModal } from './DownloadModal';
import { RefinementChat } from './RefinementChat';
import type { FlyerPreferences, UserAsset } from '@/lib/types';

const defaultPrefs: FlyerPreferences = {
  title: '',
  tagline: '',
  eventDate: '',
  venue: '',
  contactInfo: '',
  style: 'event',
  colorScheme: 'dark',
  primaryColor: '#f59e0b',
  fontStyle: 'modern',
};

export function StudioLayout() {
  const generator = useGenerator();
  const [showDownload, setShowDownload] = useState(false);
  const [prefs, setPrefs] = useState<FlyerPreferences>(defaultPrefs);
  const [userAssets, setUserAssets] = useState<UserAsset[]>([]);

  function setPrefsKey<K extends keyof FlyerPreferences>(key: K, val: FlyerPreferences[K]) {
    setPrefs((prev) => ({ ...prev, [key]: val }));
  }

  function handleReset() {
    setUserAssets([]);
    generator.reset();
  }

  const showChat = generator.phase === 'done' || generator.isRefining;

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 h-12 border-b border-zinc-800 shrink-0 bg-[#0d0d0f]">
        <div className="flex items-center gap-2.5">
          <span className="text-amber-400 text-lg leading-none">◈</span>
          <div className="flex flex-col leading-none">
            <span className="font-display text-sm font-semibold tracking-[0.2em] uppercase text-zinc-200">
              FlyerCraft
            </span>
            <span className="text-[9px] text-zinc-600 tracking-widest uppercase mt-0.5">
              AI-powered flyer design
            </span>
          </div>
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
      <div className="flex flex-col md:flex-row flex-1 min-h-0 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
        {/* Canvas — h-80 on mobile for idle/generating, flex-1 when done */}
        <div
          className={`md:flex-[3] min-w-0 ${
            generator.phase === 'done' ? 'flex-1' : 'h-80 md:h-auto'
          }`}
        >
          <CanvasPanel
            phase={generator.phase}
            currentVersion={generator.currentVersion}
            errorMsg={generator.errorMsg}
            onDownload={() => setShowDownload(true)}
            onReset={handleReset}
            prefs={prefs}
          />
        </div>

        {/* Right: controls + optional chat panel */}
        <div className="flex-1 md:flex-[2] min-w-0 min-h-0 flex flex-col overflow-hidden divide-y divide-zinc-800">
          {/* IMPORTANT: overflow-hidden — ControlPanel scrolls internally per step */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ControlPanel
              phase={generator.phase}
              onGenerate={(prefs) => generator.generate(prefs, userAssets)}
              onReset={handleReset}
              prefs={prefs}
              onPrefsChange={setPrefsKey}
              userAssets={userAssets}
              onAssetsChange={setUserAssets}
            />
          </div>

          {/* Refinement chat — appears when a flyer is done (or refining) */}
          {showChat && (
            <div
              className={`h-64 shrink-0 ${
                !generator.isRefining && generator.phase === 'generating' ? 'hidden md:block' : ''
              }`}
            >
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
          onNewFlyer={handleReset}
          onEdit={() => setShowDownload(false)}
        />
      )}
    </div>
  );
}
