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
    <div className="flex flex-col h-dvh overflow-hidden font-sans" style={{ background: '#16110C', color: '#F1E8DB' }}>
      {/* ── Header ────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-5 shrink-0"
        style={{ height: 60, background: '#1C160F', borderBottom: '1px solid #2E2418' }}
      >
        <div className="flex items-center gap-2.5">
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(150deg,#E3A93C,#B47C2A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1C160F', fontSize: 15, fontWeight: 700 }}>
            ◈
          </div>
          <div className="flex flex-col leading-none">
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#F1E8DB' }}>
              CARDONICA
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8A7560', marginTop: 2 }}>
              AI CARDS &amp; FLYERS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-4 mr-1">
            <Link href="/history" className="hover:text-[#E3A93C] transition-colors" style={{ fontSize: 12, color: '#9A8472' }}>
              Your cards
            </Link>
            <Link href="/privacy" className="hover:text-[#E3A93C] transition-colors" style={{ fontSize: 12, color: '#9A8472' }}>
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#E3A93C] transition-colors" style={{ fontSize: 12, color: '#9A8472' }}>
              Terms
            </Link>
          </div>
          <UsageCounter data={usageData} loading={usageLoading} />
          <AuthButton />
        </div>
      </header>

      {/* ── Main panels ───────────────────────────────────────── */}
      <div className="studio-body flex flex-1 min-h-0">
        {/* Canvas */}
        <div className="canvas-panel min-w-0" style={{ flex: '1.55' }}>
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
        <div
          className="control-panel min-w-0 min-h-0 flex flex-col overflow-hidden"
          style={{ flex: 1, minWidth: 380, maxWidth: 440, display: 'flex', flexDirection: 'column' }}
        >
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
            <div className="h-52 shrink-0" style={{ borderTop: '1px solid #2A2014' }}>
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
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-[#241C13] border border-[#33281B] text-[#C4B49E] rounded-xl shadow-2xl text-sm whitespace-nowrap">
          Your account and data have been deleted.
        </div>
      )}
    </div>
  );
}
