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
    <div className="shrink-0 border-t border-zinc-800 bg-[#0d0d0f]">
      <div className="flex items-center px-4 py-2 gap-3 overflow-x-auto">
        <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 font-semibold shrink-0">
          Versions
        </span>

        {versions.map((entry, i) => {
          const isActive = currentVersion?.jobId === entry.jobId;
          return (
            <button
              key={entry.jobId}
              onClick={() => onSelect(entry)}
              title={`Version ${versions.length - i}`}
              className={`relative shrink-0 rounded overflow-hidden border transition-all ${
                isActive
                  ? 'border-amber-400 ring-1 ring-amber-400/30'
                  : 'border-zinc-700 opacity-60 hover:opacity-90 hover:border-zinc-500'
              }`}
              style={{ width: 44, height: 60 }}
            >
              <img
                src={entry.imageDataUrl}
                alt={`Version ${versions.length - i}`}
                className="w-full h-full object-cover"
              />
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
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
