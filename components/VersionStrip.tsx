'use client';

import type { VersionEntry } from '@/lib/types';

interface VersionStripProps {
  versions: VersionEntry[];
  currentVersion: VersionEntry | null;
  onSelect: (entry: VersionEntry) => void;
}

export function VersionStrip({ versions, currentVersion, onSelect }: VersionStripProps) {
  if (versions.length === 0) return null;

  return (
    <div className="shrink-0" style={{ borderTop: '1px solid #2E2418', background: '#1C160F' }}>
      <div className="flex items-center px-4 py-2 gap-3 overflow-x-auto">
        <span className="shrink-0" style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6B5742', fontWeight: 600 }}>
          Versions
        </span>

        {versions.map((entry, i) => {
          const isActive = currentVersion?.jobId === entry.jobId;
          return (
            <button
              key={entry.jobId}
              onClick={() => onSelect(entry)}
              title={`Version ${versions.length - i}`}
              className="relative shrink-0 rounded overflow-hidden transition-all"
              style={{
                width: 44,
                height: 60,
                border: isActive ? '1px solid #E3A93C' : '1px solid #33281B',
                boxShadow: isActive ? '0 0 0 1px rgba(227,169,60,0.30)' : 'none',
                opacity: isActive ? 1 : 0.6,
              }}
            >
              <img
                src={entry.imageDataUrl}
                alt={`Version ${versions.length - i}`}
                className="w-full h-full object-cover"
              />
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: '#E3A93C' }} />
              )}
              <div className="absolute top-0.5 right-0.5 text-[8px] font-mono bg-black/60 text-zinc-300 px-0.5 rounded-sm leading-tight">
                v{versions.length - i}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
