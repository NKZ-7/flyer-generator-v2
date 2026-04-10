'use client';

import { useState } from 'react';
import type { DownloadFormat } from '@/lib/types';

interface DownloadModalProps {
  jobId: string;
  imageDataUrl: string;
  onClose: () => void;
  onNewFlyer: () => void;
}

const FORMATS: Array<{ value: DownloadFormat; label: string; desc: string }> = [
  { value: 'jpg', label: 'JPG', desc: 'Best for sharing — small file, great quality' },
  { value: 'png', label: 'PNG', desc: 'Lossless — ideal for further editing' },
  { value: 'pdf', label: 'PDF', desc: 'Print-ready — professional output' },
];

const SIZES = [
  { value: 'A4', label: 'A4', desc: '2480 × 3508 px' },
  { value: 'US_Letter', label: 'US Letter', desc: '2550 × 3300 px' },
  { value: 'Square', label: 'Square', desc: '3000 × 3000 px' },
];

export function DownloadModal({
  jobId,
  imageDataUrl,
  onClose,
  onNewFlyer,
}: DownloadModalProps) {
  const [format, setFormat] = useState<DownloadFormat>('jpg');
  const [size, setSize] = useState('A4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/flyer/render-hires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, format, size }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Download failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flyer.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#111113] border border-zinc-800 rounded-lg w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Download Flyer</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Print-resolution export</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Preview */}
          <div className="flex gap-4 items-start">
            <div className="shrink-0 w-20 rounded overflow-hidden border border-zinc-700">
              <img
                src={imageDataUrl}
                alt="Flyer preview"
                className="w-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-3">
              {/* Format */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-2">
                  Format
                </label>
                <div className="flex gap-2">
                  {FORMATS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFormat(f.value)}
                      className={`flex-1 py-2 text-xs rounded border transition-all ${
                        format === f.value
                          ? 'bg-amber-400/10 border-amber-400/50 text-amber-300 font-semibold'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  {FORMATS.find((f) => f.value === format)?.desc}
                </p>
              </div>

              {/* Size */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-2">
                  Print Size
                </label>
                <div className="flex gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSize(s.value)}
                      className={`flex-1 py-2 text-xs rounded border transition-all ${
                        size === s.value
                          ? 'bg-amber-400/10 border-amber-400/50 text-amber-300 font-semibold'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <div>{s.label}</div>
                      <div className="text-[9px] font-mono opacity-70 mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
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
              `Download ${format.toUpperCase()}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
