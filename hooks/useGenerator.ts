'use client';

import { useState, useCallback, useRef } from 'react';
import { usePolling } from './usePolling';
import type {
  FlyerPreferences,
  GeneratorPhase,
  VersionEntry,
  JobMeta,
  UserAsset,
  TemplateCopy,
} from '@/lib/types';
import { MAX_VERSION_HISTORY } from '@/lib/constants';

export function useGenerator() {
  const [phase, setPhase] = useState<GeneratorPhase>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [versionHistory, setVersionHistory] = useState<VersionEntry[]>([]);
  const [currentVersion, setCurrentVersion] = useState<VersionEntry | null>(null);
  const [isRefining, setIsRefining] = useState(false);

  // Keep jobId in a ref so the polling callbacks always see the latest value
  const jobIdRef = useRef<string | null>(null);
  // Store last used preferences so refine() can pass context back to n8n
  const lastPrefsRef = useRef<FlyerPreferences | null>(null);

  const handleComplete = useCallback((dataUrl: string, meta: JobMeta) => {
    if (!meta.copy && !meta.legacyCopy && !meta.copyV2) {
      setPhase('error');
      setErrorMsg('Received incomplete result from workflow');
      setIsRefining(false);
      return;
    }

    const entry: VersionEntry = {
      jobId: jobIdRef.current!,
      imageDataUrl: dataUrl,
      copy: meta.copy ?? meta.copyV2 ?? meta.legacyCopy!,
      templateId: meta.templateId,
      paletteIndex: meta.paletteIndex,
      createdAt: Date.now(),
    };

    setCurrentVersion(entry);
    setVersionHistory((prev) => [entry, ...prev].slice(0, MAX_VERSION_HISTORY));
    setPhase('done');
    setIsRefining(false);
  }, []);

  const handleError = useCallback((msg: string) => {
    setPhase('error');
    setErrorMsg(msg);
    setIsRefining(false);
  }, []);

  usePolling({
    jobId,
    onComplete: handleComplete,
    onError: handleError,
  });

  const generate = useCallback(async (preferences: FlyerPreferences, assets: UserAsset[] = []) => {
    setPhase('generating');
    setErrorMsg(null);
    lastPrefsRef.current = preferences;

    try {
      const res = await fetch('/api/flyer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences,
          userAssets: assets.map((a) => ({
            id: a.id,
            image: a.imageBase64,
            mimeType: a.mimeType,
            role: a.role,
            placement_instructions: a.placementInstructions,
            original_filename: a.originalFilename,
          })),
          hasUserAssets: assets.length > 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPhase('error');
        setErrorMsg(data.error ?? 'Failed to start generation');
        return;
      }

      const { jobId: newJobId } = await res.json();
      jobIdRef.current = newJobId;
      setJobId(newJobId);
    } catch {
      setPhase('error');
      setErrorMsg('Network error — please check your connection');
    }
  }, []);

  // REVIEW: refine is no longer called by the frontend — ActionsPanel replaced RefinementChat.
  // Safe to delete refine(), isRefining state, and /api/flyer/refine after MVP confirms stable.
  const refine = useCallback(async (message: string) => {
    if (!currentVersion || !lastPrefsRef.current) return;
    setIsRefining(true);
    setPhase('generating');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/flyer/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentJobId: currentVersion.jobId,
          message,
          preferences: lastPrefsRef.current,
          copy: currentVersion.copy as TemplateCopy, // REVIEW: refinement of composite jobs uses cast — deferred to composite refactor
          templateId: currentVersion.templateId ?? '',
          paletteIndex: currentVersion.paletteIndex ?? 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPhase('error');
        setIsRefining(false);
        setErrorMsg(data.error ?? 'Refinement failed');
        return;
      }

      const body = await res.json();
      const newJobId = body.jobId;
      if (!newJobId) {
        setPhase('error');
        setIsRefining(false);
        setErrorMsg(body.error ?? 'Refinement failed — no job ID returned');
        return;
      }
      jobIdRef.current = newJobId;
      setJobId(newJobId);
    } catch {
      setPhase('error');
      setIsRefining(false);
      setErrorMsg('Network error — please check your connection');
    }
  }, [currentVersion]);

  const reset = useCallback(() => {
    setPhase('idle');
    setJobId(null);
    jobIdRef.current = null;
    setErrorMsg(null);
    setCurrentVersion(null);
    setIsRefining(false);
  }, []);

  const selectVersion = useCallback((entry: VersionEntry) => {
    setCurrentVersion(entry);
  }, []);

  return {
    phase,
    jobId,
    errorMsg,
    versionHistory,
    currentVersion,
    generate,
    reset,
    selectVersion,
  };
}
