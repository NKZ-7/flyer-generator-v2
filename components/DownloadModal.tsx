'use client';

import { useState } from 'react';
import { DIGITAL_PRESETS, PRINT_PRESETS } from '@/lib/constants';

interface DownloadModalProps {
  jobId: string;
  imageDataUrl: string;
  onClose: () => void;
  onNewFlyer: () => void;
  onEdit?: () => void;
}

type Mode = 'digital' | 'print';

// Aspect-ratio preview: returns width × height in a capped bounding box
function AspectBox({ w, h }: { w: number; h: number }) {
  const MAX = 28;
  const ratio = w / h;
  const boxW = ratio >= 1 ? MAX : Math.round(MAX * ratio);
  const boxH = ratio < 1 ? MAX : Math.round(MAX / ratio);
  return (
    <div
      className="inline-block rounded-sm border border-zinc-500 bg-zinc-700 shrink-0"
      style={{ width: boxW, height: boxH }}
    />
  );
}

export function DownloadModal({ jobId, imageDataUrl, onClose, onNewFlyer, onEdit }: DownloadModalProps) {
  const [mode, setMode] = useState<Mode>('digital');
  const [preset, setPreset] = useState('social');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleJpegDownload() {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/jpeg', 0.92);
      a.download = 'flyer.jpg';
      a.click();
    };
    img.src = imageDataUrl;
  }

  function switchMode(m: Mode) {
    setMode(m);
    setPreset(m === 'digital' ? 'social' : 'a5');
  }

  const digitalEntries = Object.entries(DIGITAL_PRESETS);
  const printEntries = Object.entries(PRINT_PRESETS);

  const downloadLabel =
    mode === 'print'
      ? 'Download Print-Ready PDF'
      : `Download for ${DIGITAL_PRESETS[preset as keyof typeof DIGITAL_PRESETS]?.label ?? 'Social Media'}`;

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/flyer/render-hires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, preset, useCase: mode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Download failed');
      }

      const blob = await res.blob();
      const ext = mode === 'print' ? 'pdf' : (DIGITAL_PRESETS[preset as keyof typeof DIGITAL_PRESETS]?.format ?? 'jpg');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flyer-${preset}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);

      // Web Share API — mobile devices (WhatsApp etc.)
      if (mode === 'digital' && typeof navigator !== 'undefined' && 'canShare' in navigator) {
        const mimeType = ext === 'jpg' ? 'image/jpeg' : 'image/png';
        const file = new File([blob], `flyer-${preset}.${ext}`, { type: mimeType });
        if (navigator.canShare({ files: [file] })) {
          setTimeout(() => {
            navigator.share({ files: [file], title: 'Your Flyer' }).catch(() => {/* user cancelled */});
          }, 500);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#111113] border border-zinc-800 rounded-lg w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Export Flyer</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Choose how you want to use your flyer</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        {/* Quick Save — JPEG direct download */}
        <div className="px-6 pt-5 pb-4 border-b border-zinc-800">
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 font-semibold mb-3">
            Quick Save
          </p>
          <button
            onClick={handleJpegDownload}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-amber-400/50 hover:bg-amber-400/5 transition-all text-sm text-zinc-200"
          >
            <span className="flex items-center gap-2.5">
              <span className="text-base">🖼️</span>
              <span>
                <span className="font-medium">Save as JPEG</span>
                <span className="block text-[11px] text-zinc-500 mt-0.5">
                  1024 × 1024 px — saves directly to your device
                </span>
              </span>
            </span>
            <span className="text-xs text-zinc-500">JPG</span>
          </button>
        </div>

        {/* Edit / Refine */}
        {onEdit && (
          <div className="px-6 pt-4 pb-4 border-b border-zinc-800">
            <button
              onClick={onEdit}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 transition-all text-sm text-zinc-300"
            >
              <span className="flex items-center gap-2.5">
                <span className="text-base">✏️</span>
                <span>
                  <span className="font-medium">Edit / Refine this flyer</span>
                  <span className="block text-[11px] text-zinc-500 mt-0.5">
                    Go back and describe changes in plain English
                  </span>
                </span>
              </span>
              <span className="text-xs text-zinc-500">AI</span>
            </button>
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* Flyer thumbnail */}
          <div className="flex gap-4 items-start">
            <div className="shrink-0 w-16 rounded overflow-hidden border border-zinc-700">
              <img src={imageDataUrl} alt="Flyer preview" className="w-full object-cover" />
            </div>

            {/* Mode toggle */}
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-2">
                What do you want to do?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => switchMode('digital')}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border text-xs font-medium transition-all ${
                    mode === 'digital'
                      ? 'bg-amber-400/10 border-amber-400/50 text-amber-300'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  <span className="text-lg leading-none">📱</span>
                  Share Online
                </button>
                <button
                  onClick={() => switchMode('print')}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border text-xs font-medium transition-all ${
                    mode === 'print'
                      ? 'bg-amber-400/10 border-amber-400/50 text-amber-300'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  <span className="text-lg leading-none">🖨️</span>
                  Print It
                </button>
              </div>
            </div>
          </div>

          {/* Option list */}
          <div className="space-y-1.5">
            {mode === 'digital' ? (
              <>
                {digitalEntries.map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setPreset(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                      preset === key
                        ? 'bg-amber-400/10 border-amber-400/40'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <AspectBox w={cfg.width} h={cfg.height} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold ${preset === key ? 'text-amber-200' : 'text-zinc-200'}`}>
                        {cfg.label}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{cfg.desc}</div>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-600 shrink-0">
                      {cfg.width}×{cfg.height}
                    </div>
                  </button>
                ))}
                <p className="text-[10px] text-zinc-600 pt-1 pl-1">
                  ℹ Sized perfectly for sharing — no cropping needed
                </p>
              </>
            ) : (
              <>
                {printEntries.map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setPreset(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                      preset === key
                        ? 'bg-amber-400/10 border-amber-400/40'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <AspectBox w={cfg.widthMm} h={cfg.heightMm} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold ${preset === key ? 'text-amber-200' : 'text-zinc-200'}`}>
                        {cfg.label}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{cfg.desc}</div>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-600 shrink-0">
                      {cfg.widthMm}×{cfg.heightMm}mm
                    </div>
                  </button>
                ))}
                <p className="text-[10px] text-zinc-600 pt-1 pl-1">
                  ℹ PDF ready for any print shop — just send the file · 300 DPI · 3mm bleed included
                </p>
              </>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={() => { onClose(); onNewFlyer(); }}
            className="px-4 py-2.5 text-xs text-zinc-400 border border-zinc-700 rounded hover:border-zinc-600 hover:text-zinc-200 transition-colors"
          >
            New flyer
          </button>
          <button
            onClick={handleDownload}
            disabled={loading}
            className={`flex-1 py-2.5 text-sm font-semibold rounded transition-all ${
              loading
                ? 'bg-amber-400/20 text-amber-400/50 cursor-not-allowed'
                : 'bg-amber-400 text-zinc-950 hover:bg-amber-300'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-amber-400/30 border-t-amber-400/80 rounded-full animate-spin" />
                Rendering…
              </span>
            ) : (
              downloadLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
