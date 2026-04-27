'use client';

import { useState, useRef, useEffect, Fragment } from 'react';
import { FloatingField } from './FloatingField';
import { AssetUploader } from './AssetUploader';
import { OccasionPicker, OCCASIONS } from './OccasionPicker';
import { VibePicker, VIBES } from './VibePicker';
import type { FlyerPreferences, UserAsset, GeneratorPhase } from '@/lib/types';

interface ControlPanelProps {
  phase: GeneratorPhase;
  onGenerate: (prefs: FlyerPreferences) => void;
  onReset: () => void;
  prefs: FlyerPreferences;
  onPrefsChange: <K extends keyof FlyerPreferences>(key: K, val: FlyerPreferences[K]) => void;
  userAssets: UserAsset[];
  onAssetsChange: (assets: UserAsset[]) => void;
}

const OCCASION_PLACEHOLDERS: Record<string, { tagline: string; venue: string }> = {
  birthday:   { tagline: "e.g. Wishing you all the joy in the world",  venue: 'e.g. The Grand Ballroom, Accra' },
  sympathy:   { tagline: 'e.g. Forever in our hearts',                  venue: 'e.g. Community Chapel' },
  congrats:   { tagline: 'e.g. You made it — we always knew you would', venue: 'e.g. Head Office, Accra' },
  business:   { tagline: 'e.g. Unbeatable deals, every day',            venue: 'e.g. All branches nationwide' },
  invitation: { tagline: "e.g. The night you won't forget",             venue: 'e.g. National Theatre, Accra' },
};

const COLOR_OPTIONS = [
  { value: 'dark',    label: 'Dark & Bold' },
  { value: 'vibrant', label: 'Vibrant' },
  { value: 'warm',    label: 'Warm & Inviting' },
  { value: 'cool',    label: 'Cool & Pro' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'gold',    label: 'Luxury Gold' },
];

const COLOR_STRIPS: Record<string, string[]> = {
  dark:    ['#0d0d1a', '#1a1a2e', '#ffffff', '#ef4444'],
  vibrant: ['#ec4899', '#f59e0b', '#3b82f6', '#7c3aed'],
  warm:    ['#fef3c7', '#ea580c', '#92400e', '#c2410c'],
  cool:    ['#1d4ed8', '#3b82f6', '#e0f2fe', '#ffffff'],
  minimal: ['#ffffff', '#f3f4f6', '#d1d5db', '#111827'],
  gold:    ['#0f0c00', '#b45309', '#f59e0b', '#fef3c7'],
};

const FONT_OPTIONS = [
  { value: 'modern',       label: 'Bold Impact',      hint: 'Oswald · heavy, all-caps, high energy' },
  { value: 'classic',      label: 'Editorial Luxury', hint: 'Playfair · refined, elegant, serif' },
  { value: 'clean',        label: 'Clean Modern',     hint: 'DM Sans · geometric, balanced' },
  { value: 'highContrast', label: 'High Contrast',    hint: 'Oswald headline + body' },
  { value: 'vintage',      label: 'Vintage Press',    hint: 'Playfair · nostalgic, old-style' },
  { value: 'minimalType',  label: 'Minimal Type',     hint: 'DM Sans light · understated' },
];

const FONT_FAMILY_MAP: Record<string, string> = {
  modern:       'var(--font-oswald, Oswald, sans-serif)',
  classic:      'var(--font-playfair, "Playfair Display", serif)',
  clean:        'var(--font-sans, "DM Sans", sans-serif)',
  highContrast: 'var(--font-oswald, Oswald, sans-serif)',
  vintage:      'var(--font-playfair, "Playfair Display", serif)',
  minimalType:  'var(--font-sans, "DM Sans", sans-serif)',
};

const FONT_LABEL_CLS: Record<string, string> = {
  modern:       'font-bold uppercase',
  classic:      'italic',
  clean:        '',
  highContrast: 'font-bold',
  vintage:      'tracking-wide',
  minimalType:  'font-light',
};

// Accent presets — warm top row, cool bottom row
const ACCENT_PRESETS = [
  '#f59e0b', '#f97316', '#ef4444', '#ec4899', '#e11d48', '#d4a76a',
  '#7c3aed', '#3b82f6', '#14b8a6', '#10b981', '#64748b', '#22c55e',
];


export function ControlPanel({
  phase,
  onGenerate,
  onReset,
  prefs,
  onPrefsChange,
  userAssets,
  onAssetsChange,
}: ControlPanelProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [prevStep, setPrevStep] = useState<1 | 2 | 3 | null>(null);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [transitioning, setTransitioning] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [occasionError, setOccasionError] = useState(false);
  const [surpriseSpinning, setSurpriseSpinning] = useState(false);
  const surpriseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isGenerating = phase === 'generating';
  const isDone = phase === 'done';

  // Reset step to 1 when user starts fresh
  useEffect(() => {
    if (phase === 'idle') {
      setCurrentStep(1);
      setPrevStep(null);
      setTitleError(false);
      setOccasionError(false);
    }
  }, [phase]);

  // Cleanup surprise timer on unmount
  useEffect(() => {
    return () => {
      if (surpriseTimerRef.current) clearInterval(surpriseTimerRef.current);
    };
  }, []);

  function navigate(to: 1 | 2 | 3) {
    if (transitioning || to === currentStep || isGenerating) return;
    setDirection(to > currentStep ? 'forward' : 'backward');
    setPrevStep(currentStep);
    setCurrentStep(to);
    setTransitioning(true);
    setTimeout(() => {
      setPrevStep(null);
      setTransitioning(false);
    }, 300);
  }

  function goNext() {
    if (currentStep === 1 && !prefs.title.trim()) {
      setTitleError(true);
      return;
    }
    if (currentStep === 1 && !prefs.occasion) {
      setOccasionError(true);
      return;
    }
    setTitleError(false);
    setOccasionError(false);
    navigate((currentStep + 1) as 1 | 2 | 3);
  }

  function goBack() {
    navigate((currentStep - 1) as 1 | 2 | 3);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isGenerating) return;                   // guard 1: no double-submit
    if (currentStep !== 3 && !isDone) return;   // guard 2: only from step 3 or re-generate
    if (!prefs.title.trim()) return;
    onGenerate(prefs);
  }

  function surpriseMe() {
    if (surpriseSpinning) return;
    setSurpriseSpinning(true);
    const finalColor  = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)].value;
    const finalFont   = FONT_OPTIONS[Math.floor(Math.random() * FONT_OPTIONS.length)].value;
    const finalAccent = ACCENT_PRESETS[Math.floor(Math.random() * ACCENT_PRESETS.length)];
    let cycles = 0;
    surpriseTimerRef.current = setInterval(() => {
      onPrefsChange('colorScheme', COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)].value as FlyerPreferences['colorScheme']);
      onPrefsChange('fontStyle',   FONT_OPTIONS[Math.floor(Math.random() * FONT_OPTIONS.length)].value as FlyerPreferences['fontStyle']);
      onPrefsChange('primaryColor', ACCENT_PRESETS[Math.floor(Math.random() * ACCENT_PRESETS.length)]);
      if (++cycles >= 5) {
        clearInterval(surpriseTimerRef.current!);
        onPrefsChange('colorScheme',  finalColor as FlyerPreferences['colorScheme']);
        onPrefsChange('fontStyle',    finalFont as FlyerPreferences['fontStyle']);
        onPrefsChange('primaryColor', finalAccent);
        setSurpriseSpinning(false);
      }
    }, 60);
  }

  // ── Step label strings ──────────────────────────────────────
  const STEP_LABELS = ['Content', 'Style', 'Review'];

  function ProgressIndicator({ current }: { current: 1 | 2 | 3 }) {
    return (
      <div className="flex items-center justify-center gap-2 px-5 py-3 border-b border-zinc-800 shrink-0">
        {([1, 2, 3] as const).map((n, i) => (
          <Fragment key={n}>
            <div
              className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold border ${
                n < current
                  ? 'bg-amber-400 border-amber-400 text-zinc-950'
                  : n === current
                  ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-600'
              }`}
            >
              {n < current ? '✓' : n}
            </div>
            {i < 2 && (
              <div
                className={`h-px w-8 shrink-0 ${n < current ? 'bg-amber-400/50' : 'bg-zinc-700'}`}
              />
            )}
          </Fragment>
        ))}
        <span className="ml-2 text-[10px] text-zinc-500 uppercase tracking-widest">
          {STEP_LABELS[current - 1]}
        </span>
      </div>
    );
  }

  function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
      <div className="flex justify-between items-center text-xs py-0.5">
        <span className="text-zinc-500 shrink-0">{label}</span>
        <span className="text-zinc-200 text-right ml-2">{value}</span>
      </div>
    );
  }

  const hints = OCCASION_PLACEHOLDERS[prefs.occasion ?? 'birthday'] ?? OCCASION_PLACEHOLDERS.birthday;

  function renderStepContent(step: 1 | 2 | 3): React.ReactNode {
    if (step === 1) {
      return (
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 font-semibold">
            What's your flyer about?
          </p>

          {/* ① Title */}
          <FloatingField
            label="Name / Title"
            required
            value={prefs.title}
            onChange={(v) => {
              onPrefsChange('title', v);
              if (v.trim()) setTitleError(false);
            }}
            placeholder="e.g. Summer Music Festival"
            disabled={isGenerating}
            hasError={titleError}
            errorMsg="Give your flyer a name first"
          />

          {/* ② Tell us more textarea */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.12em] text-zinc-500 font-semibold mb-1.5">
              Tell us more
              <span className="text-zinc-600 font-normal normal-case tracking-normal ml-1">
                (optional)
              </span>
            </label>
            <textarea
              value={prefs.additionalContext ?? ''}
              onChange={(e) => onPrefsChange('additionalContext', e.target.value)}
              disabled={isGenerating}
              rows={3}
              placeholder="e.g. The speaker is Pastor Kwame — uploaded photo shows him in a suit. Spiritual, professional vibe."
              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded px-3 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-colors resize-none disabled:opacity-40"
            />
          </div>

          {/* ③ Photos & Assets */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 font-semibold mb-1">
              Your Photos & Assets
              <span className="text-zinc-600 font-normal normal-case tracking-normal ml-1">
                — optional
              </span>
            </p>
            <p className="text-[10px] text-zinc-500 mb-2 leading-relaxed">
              Upload photos of people, products, or logos you want in your flyer.
              We'll blend them into the design seamlessly.
            </p>
            {userAssets.length > 0 && !prefs.additionalContext && (
              <p className="text-[10px] text-amber-400/70 mb-2 leading-relaxed">
                Tip: use the text box above to explain who or what is in your photos.
              </p>
            )}
            <AssetUploader
              assets={userAssets}
              onAssetsChange={onAssetsChange}
              disabled={isGenerating}
            />
          </div>

          {/* ④ Tagline */}
          <FloatingField
            label="Tagline"
            value={prefs.tagline ?? ''}
            onChange={(v) => onPrefsChange('tagline', v)}
            placeholder={hints.tagline}
            disabled={isGenerating}
          />

          {/* ⑤ Date + Venue */}
          <div className="grid grid-cols-2 gap-3">
            <FloatingField
              label="Date"
              value={prefs.eventDate ?? ''}
              onChange={(v) => onPrefsChange('eventDate', v)}
              placeholder="e.g. July 19, 2025"
              disabled={isGenerating}
            />
            <FloatingField
              label="Venue"
              value={prefs.venue ?? ''}
              onChange={(v) => onPrefsChange('venue', v)}
              placeholder={hints.venue}
              disabled={isGenerating}
            />
          </div>

          {/* ⑥ Contact */}
          <FloatingField
            label="Contact / URL"
            value={prefs.contactInfo ?? ''}
            onChange={(v) => onPrefsChange('contactInfo', v)}
            placeholder="e.g. tickets@festival.com"
            disabled={isGenerating}
          />

          <div className="border-t border-zinc-800" />

          {/* ⑦ Occasion */}
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 font-semibold">
            Occasion
          </p>
          {occasionError && (
            <p className="text-[11px] text-red-400 -mt-1">Please select an occasion</p>
          )}
          <OccasionPicker
            value={prefs.occasion}
            onChange={(v) => { onPrefsChange('occasion', v); setOccasionError(false); }}
            disabled={isGenerating}
          />

          {/* ⑧ Vibe */}
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 font-semibold mt-3">
            Vibe
          </p>
          <VibePicker
            value={prefs.vibe}
            onChange={(v) => onPrefsChange('vibe', v)}
            disabled={isGenerating}
          />
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-5">
          {/* Surprise Me */}
          <button
            type="button"
            onClick={surpriseMe}
            disabled={isGenerating || surpriseSpinning}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs border border-zinc-700 text-zinc-400 rounded hover:border-zinc-500 hover:text-zinc-200 transition-all min-h-[44px]"
          >
            <span className={surpriseSpinning ? 'animate-spin inline-block' : ''}>🎲</span>
            Surprise Me — random style
          </button>

          {/* Color scheme */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 font-semibold mb-2">
              Color Scheme
            </p>
            <div className="grid grid-cols-2 gap-2">
              {COLOR_OPTIONS.map((opt) => {
                const strips = COLOR_STRIPS[opt.value] ?? [];
                const isActive = prefs.colorScheme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onPrefsChange('colorScheme', opt.value as FlyerPreferences['colorScheme'])}
                    disabled={isGenerating}
                    className={`rounded-lg border overflow-hidden transition-all ${
                      isActive
                        ? 'border-amber-400 scale-[1.03] shadow-lg shadow-amber-400/20'
                        : 'border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    {/* Gradient strip */}
                    <div className="h-10 flex">
                      {strips.map((c, i) => (
                        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    {/* Label */}
                    <div
                      className={`px-2 py-1.5 text-xs text-center bg-zinc-900 ${
                        isActive ? 'text-amber-300' : 'text-zinc-400'
                      }`}
                    >
                      {opt.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font style */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 font-semibold mb-2">
              Font Style
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {FONT_OPTIONS.map((opt) => {
                const isActive = prefs.fontStyle === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onPrefsChange('fontStyle', opt.value as FlyerPreferences['fontStyle'])}
                    disabled={isGenerating}
                    className={`px-3 py-2.5 text-left rounded border transition-all ${
                      isActive
                        ? 'bg-amber-400/10 border-amber-400/50'
                        : 'bg-zinc-900 border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    <div
                      className={`text-sm ${FONT_LABEL_CLS[opt.value] ?? ''} ${
                        isActive ? 'text-amber-200' : 'text-zinc-200'
                      }`}
                      style={{ fontFamily: FONT_FAMILY_MAP[opt.value] }}
                    >
                      {opt.label}
                    </div>
                    <div
                      className="text-[10px] opacity-60 mt-0.5 leading-tight text-zinc-500"
                      style={{ fontFamily: 'var(--font-sans)' }}
                    >
                      {opt.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accent color */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 font-semibold mb-2">
              Accent Color
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {ACCENT_PRESETS.map((hex) => {
                const isActive = prefs.primaryColor?.toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => onPrefsChange('primaryColor', hex)}
                    disabled={isGenerating}
                    title={hex}
                    className={`swatch-btn w-full aspect-square rounded-full border-2 relative transition-all ${
                      isActive ? 'border-white' : 'border-transparent hover:border-white/50'
                    }`}
                    style={{
                      backgroundColor: hex,
                      '--swatch-color': hex,
                    } as React.CSSProperties}
                  >
                    {isActive && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-zinc-500 mt-3 mb-1">Or enter your brand color</p>
            <div className="flex items-center gap-2">
              <div className="relative w-9 h-9 rounded border border-zinc-700 overflow-hidden shrink-0">
                <input
                  type="color"
                  value={prefs.primaryColor ?? '#f59e0b'}
                  onChange={(e) => onPrefsChange('primaryColor', e.target.value)}
                  disabled={isGenerating}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                  className="absolute inset-0 rounded"
                  style={{ backgroundColor: prefs.primaryColor ?? '#f59e0b' }}
                />
              </div>
              <input
                type="text"
                value={prefs.primaryColor ?? '#f59e0b'}
                onChange={(e) => onPrefsChange('primaryColor', e.target.value)}
                disabled={isGenerating}
                className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-200 font-mono text-[11px] rounded px-3 py-2 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 transition-colors disabled:opacity-40"
              />
            </div>
          </div>
        </div>
      );
    }

    // Step 3: Review
    const colorLabel    = COLOR_OPTIONS.find((o) => o.value === prefs.colorScheme)?.label ?? prefs.colorScheme;
    const fontLabel     = FONT_OPTIONS.find((o) => o.value === prefs.fontStyle)?.label ?? prefs.fontStyle;
    const occasionLabel = OCCASIONS.find((o) => o.value === prefs.occasion)?.label ?? prefs.occasion ?? '—';
    const vibeLabel     = VIBES.find((o) => o.value === prefs.vibe)?.label ?? prefs.vibe ?? '—';

    return (
      <div className="space-y-4">
        <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500 font-semibold">
          Review & Generate
        </p>

        {/* Content card */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg px-4 py-3 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
              Content
            </span>
            <button
              type="button"
              onClick={() => navigate(1)}
              className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors"
            >
              Edit
            </button>
          </div>
          <SummaryRow label="Occasion" value={occasionLabel} />
          <SummaryRow label="Vibe"     value={vibeLabel} />
          <SummaryRow label="Title"   value={prefs.title || <span className="text-zinc-600 italic">—</span>} />
          {prefs.tagline     && <SummaryRow label="Tagline"  value={prefs.tagline} />}
          {prefs.eventDate   && <SummaryRow label="Date"     value={prefs.eventDate} />}
          {prefs.venue       && <SummaryRow label="Venue"    value={prefs.venue} />}
          {prefs.contactInfo && <SummaryRow label="Contact"  value={prefs.contactInfo} />}
          {userAssets.length > 0 && (
            <SummaryRow
              label="Photos"
              value={`${userAssets.length} image${userAssets.length > 1 ? 's' : ''} uploaded`}
            />
          )}
          {prefs.additionalContext && (
            <SummaryRow
              label="Context"
              value={
                <span className="italic text-zinc-400 truncate max-w-[140px] block">
                  &ldquo;{prefs.additionalContext.slice(0, 40)}
                  {prefs.additionalContext.length > 40 ? '…' : ''}&rdquo;
                </span>
              }
            />
          )}
        </div>

        {/* Style card */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg px-4 py-3 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
              Style
            </span>
            <button
              type="button"
              onClick={() => navigate(2)}
              className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors"
            >
              Edit
            </button>
          </div>
          <SummaryRow label="Colors"  value={colorLabel} />
          <SummaryRow label="Fonts"   value={fontLabel} />
          <SummaryRow
            label="Accent"
            value={
              <span className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full border border-white/20 inline-block"
                  style={{ backgroundColor: prefs.primaryColor }}
                />
                {prefs.primaryColor}
              </span>
            }
          />
        </div>

        {/* Hero generate button */}
        <button
          type="submit"
          disabled={isGenerating}
          className={`w-full h-14 text-sm font-semibold rounded transition-colors relative overflow-hidden mt-4 ${
            isGenerating
              ? 'bg-amber-400/20 text-amber-400/60 cursor-not-allowed border border-amber-400/20'
              : 'btn-generate-shimmer text-zinc-950'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              Creating your flyer...
            </span>
          ) : (
            'Create My Flyer →'
          )}
        </button>
      </div>
    );
  }

  const enterClass = direction === 'forward' ? 'step-enter-forward' : 'step-enter-backward';
  const exitClass  = direction === 'forward' ? 'step-exit-forward'  : 'step-exit-backward';

  return (
    <form onSubmit={handleSubmit} className="h-full bg-[#111113] flex flex-col">
      {/* Progress indicator — hidden when done */}
      {!isDone && <ProgressIndicator current={currentStep} />}

      {/* Step transition container */}
      <div className="relative overflow-hidden flex-1 min-h-0">
        {/* Exiting step — absolute, overflow-hidden to prevent scrollbar during animation */}
        {prevStep && (
          <div className={`absolute inset-0 overflow-hidden ${exitClass}`}>
            <div className="h-full overflow-y-auto px-5 py-5">
              {renderStepContent(prevStep)}
            </div>
          </div>
        )}
        {/* Current step — normal flow with its own scroll */}
        <div className={`h-full overflow-y-auto px-5 py-5 ${transitioning ? enterClass : ''}`}>
          {renderStepContent(currentStep)}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 px-5 pb-5 pt-3 border-t border-zinc-800 bg-[#111113]">
        {isDone ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onReset}
              className="flex-1 py-2.5 min-h-[44px] text-sm border border-zinc-700 text-zinc-300 rounded hover:bg-zinc-800 transition-colors"
            >
              New flyer
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 min-h-[44px] text-sm font-semibold bg-zinc-800 text-zinc-200 border border-zinc-700 rounded hover:bg-zinc-700 transition-colors"
            >
              Regenerate
            </button>
          </div>
        ) : currentStep < 3 ? (
          <div className="flex gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={goBack}
                disabled={isGenerating}
                className="flex-1 py-2.5 min-h-[44px] text-sm border border-zinc-700 text-zinc-300 rounded hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={isGenerating}
              className="flex-1 py-2.5 min-h-[44px] text-sm font-semibold bg-amber-400 text-zinc-950 rounded hover:bg-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        ) : (
          /* Step 3 footer: back button only (Generate button lives in step content) */
          <button
            type="button"
            onClick={goBack}
            disabled={isGenerating}
            className="w-full py-2.5 min-h-[44px] text-sm border border-zinc-700 text-zinc-300 rounded hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Back to Style
          </button>
        )}
      </div>
    </form>
  );
}
