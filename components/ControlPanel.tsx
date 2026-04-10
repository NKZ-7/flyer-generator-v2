'use client';

import { useState } from 'react';
import type { FlyerPreferences, GeneratorPhase } from '@/lib/types';

interface ControlPanelProps {
  phase: GeneratorPhase;
  onGenerate: (prefs: FlyerPreferences) => void;
  onReset: () => void;
  errorMsg: string | null;
}

const STYLE_OPTIONS = [
  { value: 'event', label: 'Event / Concert' },
  { value: 'sale', label: 'Sale / Promo' },
  { value: 'hiring', label: 'Hiring / Recruitment' },
  { value: 'food', label: 'Food / Restaurant' },
  { value: 'announcement', label: 'Announcement' },
];

const COLOR_OPTIONS = [
  { value: 'dark', label: 'Dark & Bold', hex: '#1a1a2e' },
  { value: 'vibrant', label: 'Vibrant & Energetic', hex: '#7c3aed' },
  { value: 'warm', label: 'Warm & Inviting', hex: '#c2410c' },
  { value: 'cool', label: 'Cool & Professional', hex: '#1d4ed8' },
  { value: 'minimal', label: 'Minimal & Clean', hex: '#e5e7eb' },
  { value: 'gold', label: 'Luxury & Gold', hex: '#b45309' },
];

const FONT_OPTIONS = [
  { value: 'modern', label: 'Modern (Oswald)' },
  { value: 'classic', label: 'Classic (Playfair)' },
  { value: 'clean', label: 'Clean (Inter)' },
];

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

export function ControlPanel({ phase, onGenerate, onReset }: ControlPanelProps) {
  const [prefs, setPrefs] = useState<FlyerPreferences>(defaultPrefs);

  const isGenerating = phase === 'generating';
  const isDone = phase === 'done';

  function set<K extends keyof FlyerPreferences>(key: K, value: FlyerPreferences[K]) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prefs.title.trim()) return;
    onGenerate(prefs);
  }

  return (
    <div className="h-full bg-[#111113] flex flex-col">
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-zinc-800 shrink-0">
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
          Flyer Setup
        </h2>
      </div>

      {/* Scrollable form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="px-5 py-5 space-y-5">
          {/* Title */}
          <Field label="Event / Brand Title" required>
            <input
              type="text"
              value={prefs.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Summer Music Festival"
              disabled={isGenerating}
              className={inputCls}
              required
            />
          </Field>

          {/* Tagline */}
          <Field label="Tagline">
            <input
              type="text"
              value={prefs.tagline}
              onChange={(e) => set('tagline', e.target.value)}
              placeholder="e.g. Where music meets the night"
              disabled={isGenerating}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <Field label="Date">
              <input
                type="text"
                value={prefs.eventDate}
                onChange={(e) => set('eventDate', e.target.value)}
                placeholder="e.g. July 19, 2025"
                disabled={isGenerating}
                className={inputCls}
              />
            </Field>
            {/* Venue */}
            <Field label="Venue">
              <input
                type="text"
                value={prefs.venue}
                onChange={(e) => set('venue', e.target.value)}
                placeholder="e.g. Madison Square"
                disabled={isGenerating}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Contact */}
          <Field label="Contact / URL">
            <input
              type="text"
              value={prefs.contactInfo}
              onChange={(e) => set('contactInfo', e.target.value)}
              placeholder="e.g. tickets@festival.com"
              disabled={isGenerating}
              className={inputCls}
            />
          </Field>

          {/* Divider */}
          <div className="border-t border-zinc-800" />

          {/* Style */}
          <Field label="Flyer Type">
            <div className="grid grid-cols-2 gap-1.5">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('style', opt.value)}
                  disabled={isGenerating}
                  className={`px-3 py-2 text-xs rounded border transition-all text-left ${
                    prefs.style === opt.value
                      ? 'bg-amber-400/10 border-amber-400/50 text-amber-300'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Color scheme */}
          <Field label="Color Scheme">
            <div className="grid grid-cols-2 gap-1.5">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('colorScheme', opt.value)}
                  disabled={isGenerating}
                  className={`flex items-center gap-2 px-3 py-2 text-xs rounded border transition-all ${
                    prefs.colorScheme === opt.value
                      ? 'bg-amber-400/10 border-amber-400/50 text-amber-300'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-white/10"
                    style={{ backgroundColor: opt.hex }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Primary color + Font row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Accent Color">
              <div className="flex items-center gap-2">
                <div className="relative w-9 h-9 rounded border border-zinc-700 overflow-hidden shrink-0">
                  <input
                    type="color"
                    value={prefs.primaryColor}
                    onChange={(e) => set('primaryColor', e.target.value)}
                    disabled={isGenerating}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div
                    className="absolute inset-0 rounded"
                    style={{ backgroundColor: prefs.primaryColor }}
                  />
                </div>
                <input
                  type="text"
                  value={prefs.primaryColor}
                  onChange={(e) => set('primaryColor', e.target.value)}
                  disabled={isGenerating}
                  className={`${inputCls} font-mono text-[11px]`}
                />
              </div>
            </Field>

            <Field label="Font Style">
              <select
                value={prefs.fontStyle}
                onChange={(e) => set('fontStyle', e.target.value)}
                disabled={isGenerating}
                className={`${inputCls} appearance-none`}
              >
                {FONT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* Sticky generate button */}
        <div className="sticky bottom-0 px-5 pb-5 pt-3 bg-[#111113] border-t border-zinc-800">
          {isDone ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onReset}
                className="flex-1 py-2.5 text-sm border border-zinc-700 text-zinc-300 rounded hover:bg-zinc-800 transition-colors"
              >
                New flyer
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-sm font-semibold bg-zinc-800 text-zinc-200 border border-zinc-700 rounded hover:bg-zinc-700 transition-colors"
              >
                Regenerate
              </button>
            </div>
          ) : (
            <button
              type="submit"
              disabled={isGenerating || !prefs.title.trim()}
              className={`w-full py-3 text-sm font-semibold rounded transition-all ${
                isGenerating
                  ? 'bg-amber-400/20 text-amber-400/60 cursor-not-allowed border border-amber-400/20'
                  : !prefs.title.trim()
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
                  : 'bg-amber-400 text-zinc-950 hover:bg-amber-300 shadow-lg shadow-amber-400/10'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                  Generating…
                </span>
              ) : (
                'Generate Flyer →'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
        {required && <span className="text-amber-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded px-3 py-2 placeholder-zinc-600 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-colors disabled:opacity-40';
