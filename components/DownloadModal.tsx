'use client';

import { useState, useEffect } from 'react';
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
      className="inline-block rounded-sm shrink-0"
      style={{ width: boxW, height: boxH, border: '1px solid #4A3C2C', background: '#2E2417' }}
    />
  );
}

export function DownloadModal({ jobId, imageDataUrl, onClose, onNewFlyer, onEdit }: DownloadModalProps) {
  const [mode, setMode] = useState<Mode>('digital');
  const [preset, setPreset] = useState('social');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  const content = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #34281A' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 23, fontWeight: 600, color: '#F1E8DB', marginBottom: 2 }}>Export</h2>
          <p style={{ fontSize: 12, color: '#8A7560' }}>Choose how you want to share your card</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded"
          style={{ color: '#6B5742', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
        >
          ✕
        </button>
      </div>

      {/* Quick Save — JPEG direct download */}
      <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid #34281A' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A7560', marginBottom: 12 }}>
          Quick Save
        </p>
        <button
          onClick={handleJpegDownload}
          className="w-full flex items-center justify-between px-4 py-3"
          style={{ background: '#241C13', border: '1px solid #33281B', borderRadius: 11, fontSize: 13, color: '#D8C9B4', cursor: 'pointer', transition: 'border-color 0.15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#E3A93C')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#33281B')}
        >
          <span className="flex items-center gap-2.5">
            <span style={{ fontSize: 18 }}>🖼️</span>
            <span>
              <span style={{ fontWeight: 500 }}>Save as JPEG</span>
              <span className="block" style={{ fontSize: 11, color: '#6B5742', marginTop: 2 }}>
                1024 × 1024 px — saves directly to your device
              </span>
            </span>
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B5742' }}>JPG</span>
        </button>
      </div>

      {/* Edit / Refine */}
      {onEdit && (
        <div className="px-6 pt-4 pb-4" style={{ borderBottom: '1px solid #34281A' }}>
          <button
            onClick={onEdit}
            className="w-full flex items-center justify-between px-4 py-3"
            style={{ background: '#241C13', border: '1px solid #33281B', borderRadius: 11, fontSize: 13, color: '#C4B49E', cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#5A4C40')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#33281B')}
          >
            <span className="flex items-center gap-2.5">
              <span style={{ fontSize: 18 }}>✏️</span>
              <span>
                <span style={{ fontWeight: 500 }}>Edit / Refine</span>
                <span className="block" style={{ fontSize: 11, color: '#6B5742', marginTop: 2 }}>
                  Go back and describe changes in plain English
                </span>
              </span>
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B5742' }}>AI</span>
          </button>
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Flyer thumbnail */}
        <div className="flex gap-4 items-start">
          <div className="shrink-0 w-16 overflow-hidden" style={{ borderRadius: 6, border: '1px solid #33281B' }}>
            <img src={imageDataUrl} alt="Flyer preview" className="w-full object-cover" />
          </div>

          {/* Mode toggle */}
          <div className="flex-1">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A7560', marginBottom: 8 }}>
              What do you want to do?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {([['digital', '📱', 'Share Online'], ['print', '🖨️', 'Print It']] as const).map(([m, icon, label]) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className="flex flex-col items-center gap-1.5 py-3"
                  style={{
                    borderRadius: 11,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: mode === m ? 'rgba(227,169,60,0.10)' : '#241C13',
                    border: mode === m ? '1px solid rgba(227,169,60,0.50)' : '1px solid #33281B',
                    color: mode === m ? '#E9D9BF' : '#A8957F',
                  }}
                >
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
                  {label}
                </button>
              ))}
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
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                  style={{
                    borderRadius: 11,
                    transition: 'all 0.15s',
                    background: preset === key ? 'rgba(227,169,60,0.08)' : '#241C13',
                    border: preset === key ? '1px solid rgba(227,169,60,0.40)' : '1px solid #33281B',
                  }}
                >
                  <AspectBox w={cfg.width} h={cfg.height} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 600, color: preset === key ? '#E9D9BF' : '#D8C9B4' }}>
                      {cfg.label}
                    </div>
                    <div style={{ fontSize: 10, color: '#6B5742', marginTop: 2 }}>{cfg.desc}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B5742' }} className="shrink-0">
                    {cfg.width}×{cfg.height}
                  </div>
                </button>
              ))}
              <p style={{ fontSize: 10, color: '#6B5742', paddingTop: 4, paddingLeft: 4 }}>
                ℹ Sized perfectly for sharing — no cropping needed
              </p>
            </>
          ) : (
            <>
              {printEntries.map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setPreset(key)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                  style={{
                    borderRadius: 11,
                    transition: 'all 0.15s',
                    background: preset === key ? 'rgba(227,169,60,0.08)' : '#241C13',
                    border: preset === key ? '1px solid rgba(227,169,60,0.40)' : '1px solid #33281B',
                  }}
                >
                  <AspectBox w={cfg.widthMm} h={cfg.heightMm} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 12, fontWeight: 600, color: preset === key ? '#E9D9BF' : '#D8C9B4' }}>
                      {cfg.label}
                    </div>
                    <div style={{ fontSize: 10, color: '#6B5742', marginTop: 2 }}>{cfg.desc}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6B5742' }} className="shrink-0">
                    {cfg.widthMm}×{cfg.heightMm}mm
                  </div>
                </button>
              ))}
              <p style={{ fontSize: 10, color: '#6B5742', paddingTop: 4, paddingLeft: 4 }}>
                ℹ PDF ready for any print shop — just send the file · 300 DPI · 3mm bleed included
              </p>
            </>
          )}
        </div>

        {error && (
          <p className="text-xs px-3 py-2" style={{ color: '#FCA5A5', background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8 }}>
            {error}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 px-5 pb-5">
        <button
          onClick={() => { onClose(); onNewFlyer(); }}
          className="px-4 py-2.5"
          style={{ fontSize: 12, color: '#C4B49E', border: '1px solid #33281B', background: 'transparent', borderRadius: 8, cursor: 'pointer' }}
        >
          New card
        </button>
        <button
          onClick={handleDownload}
          disabled={loading}
          className={loading ? 'flex-1 py-2.5' : 'btn-gold flex-1 py-2.5'}
          style={{
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            ...(loading ? { background: 'rgba(227,169,60,0.2)', color: 'rgba(227,169,60,0.5)' } : {}),
          }}
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
    </>
  );

  if (isMobile) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,9,5,0.7)', backdropFilter: 'blur(6px)', zIndex: 50 }} onClick={onClose}>
        <div
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '92dvh', overflowY: 'auto', background: '#1F1810', borderTop: '1px solid #34281A', borderRadius: '22px 22px 0 0', animation: 'sheet-up 0.3s cubic-bezier(0.32,0.72,0,1) both' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ width: 40, height: 4, borderRadius: 999, background: '#33281B', margin: '12px auto 0' }} />
          {content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,9,5,0.7)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div
        style={{ background: '#1F1810', border: '1px solid #34281A', borderRadius: 18, width: '100%', maxWidth: 420, maxHeight: '92dvh', overflowY: 'auto', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </div>
  );
}
