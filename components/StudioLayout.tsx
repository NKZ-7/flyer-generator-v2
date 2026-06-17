'use client';

import { useState, useEffect, useRef } from 'react';
import { useGenerator } from '@/hooks/useGenerator';
import { useUsage } from '@/hooks/useUsage';
import { CanvasPanel } from './CanvasPanel';
import { ControlPanel } from './ControlPanel';
import { VersionStrip } from './VersionStrip';
import { DownloadModal } from './DownloadModal';
import { ActionsPanel } from './RefinementChat';
import { AuthButton } from './AuthButton';
import { UsageCounter } from './UsageCounter';
import Link from 'next/link';
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
  const { data: usageData, loading: usageLoading, refetch: refetchUsage } = useUsage();
  const [showDownload, setShowDownload] = useState(false);
  const [prefs, setPrefs] = useState<FlyerPreferences>({ ...defaultPrefs, ...initialPrefs });
  const [userAssets, setUserAssets] = useState<UserAsset[]>([]);
  const [deletedToast, setDeletedToast] = useState(false);

  // Refetch usage counter immediately after a card generation completes.
  const prevPhaseRef = useRef(generator.phase);
  useEffect(() => {
    if (prevPhaseRef.current === 'generating' && generator.phase === 'done') {
      refetchUsage();
    }
    prevPhaseRef.current = generator.phase;
  }, [generator.phase, refetchUsage]);

  // Show one-time toast after account deletion redirects here with ?account=deleted.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('account') === 'deleted') {
      setDeletedToast(true);
      window.history.replaceState({}, '', '/');
      const t = setTimeout(() => setDeletedToast(false), 5000);
      return () => clearTimeout(t);
    }
  }, []);

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
              Cardonica
            </span>
            <span className="text-[9px] text-[#6B5B4E] tracking-widest uppercase mt-0.5">
              AI-POWERED CARDS &amp; FLYERS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 mr-1">
            <Link href="/privacy" className="text-[10px] text-[#6B5B4E] hover:text-[#9A8A7A] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-[10px] text-[#6B5B4E] hover:text-[#9A8A7A] transition-colors">
              Terms
            </Link>
          </div>
          <UsageCounter data={usageData} loading={usageLoading} />
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
            rateLimitInfo={generator.rateLimitInfo}
            onDownload={() => setShowDownload(true)}
            onReset={handleReset}
            prefs={prefs}
          />
        </div>

        {/* Right: controls + optional actions panel */}
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

      {/* ── Account deleted toast ─────────────────────────────── */}
      {deletedToast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-warm-800 border border-warm-600 rounded-xl shadow-2xl text-sm text-zinc-200 whitespace-nowrap">
          Your account and data have been deleted.
        </div>
      )}
    </div>
  );
}
