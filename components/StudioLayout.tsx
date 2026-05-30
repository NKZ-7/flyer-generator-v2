'use client';

import { useState } from 'react';
import { useGenerator } from '@/hooks/useGenerator';
import { CanvasPanel } from './CanvasPanel';
import { ControlPanel } from './ControlPanel';
import { VersionStrip } from './VersionStrip';
import { DownloadModal } from './DownloadModal';
import { ActionsPanel } from './RefinementChat';
import { AuthButton } from './AuthButton';
import type { FlyerPreferences, UserAsset } from '@/lib/types';

const defaultPrefs: FlyerPreferences = {
  title: '',
  additionalContext: '',
  tagline: '',
  eventDate: '',
  venue: '',
  contactInfo: '',
  style: 'event',
  colorScheme: 'dark',
  fontStyle: 'modern',
  region: '',
};

interface StudioLayoutProps {
  initialPrefs?: Partial<FlyerPreferences>;
}

export function StudioLayout({ initialPrefs }: StudioLayoutProps = {}) {
  const generator = useGenerator();
  const [showDownload, setShowDownload] = useState(false);
  const [prefs, setPrefs] = useState<FlyerPreferences>({ ...defaultPrefs, ...initialPrefs });
  const [userAssets, setUserAssets] = useState<UserAsset[]>([]);

  function setPrefsKey<K extends keyof FlyerPreferences>(key: K, val: FlyerPreferences[K]) {
    setPrefs((prev) => ({ ...prev, [key]: val }));
  }

  function handleReset() {
    setUserAssets([]);
    generator.reset();
  }

  function handleRegenerate() {
    generator.generate(prefs, userAssets);
  }

  function handleEditInputs() {
    generator.reset(); // returns to idle; prefs and userAssets are preserved in StudioLayout state
  }

  const showActions = generator.phase === 'done';

  return (
    <div className="flex flex-col h-dvh bg-warm-900 text-zinc-100 overflow-hidden font-sans">
      {/* ── Header ────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 h-12 border-b border-warm-600 shrink-0 bg-warm-800">
        <div className="flex items-center gap-2.5">
          <span className="text-amber-400 text-lg leading-none">◈</span>
          <div className="flex flex-col leading-none">
            <span className="font-display text-sm font-semibold tracking-[0.2em] uppercase text-zinc-200">
              Sendly
            </span>
            <span className="text-[9px] text-[#6B5B4E] tracking-widest uppercase mt-0.5">
              AI-POWERED CARDS &amp; FLYERS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[#7B6B5B]">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono hidden sm:inline">AI ready</span>
          </div>
          <AuthButton />
        </div>
      </header>

      {/* ── Main panels ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 divide-y md:divide-y-0 md:divide-x divide-warm-600">
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
        <div className="flex-1 md:flex-[2] min-w-0 min-h-0 flex flex-col overflow-hidden divide-y divide-warm-600">
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

          {/* Actions panel — appears when a flyer is done */}
          {showActions && (
            <div className="h-52 shrink-0">
              <ActionsPanel
                onRegenerate={handleRegenerate}
                onEditInputs={handleEditInputs}
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
