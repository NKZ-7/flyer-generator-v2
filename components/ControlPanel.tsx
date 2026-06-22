'use client';

import { useState, useRef, useEffect, Fragment } from 'react';
import { FloatingField } from './FloatingField';
import { AssetUploader } from './AssetUploader';
import { OccasionPicker, OCCASIONS } from './OccasionPicker';
import { VibePicker, VIBES } from './VibePicker';
import { FONT_STYLE_MAP } from '@/lib/design-constants';
import type { FlyerPreferences, UserAsset, GeneratorPhase } from '@/lib/types';

// Flip to true to restore the photo-upload section when post-launch photo support ships.
const SHOW_PHOTO_UPLOAD = false;

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
  motivation: { tagline: 'e.g. You have what it takes',                 venue: 'e.g. —' },
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
  { value: 'script_romance',  label: 'Script Romance',   hint: 'Great Vibes script · romantic, elegant' },
  { value: 'editorial_serif', label: 'Editorial Serif',  hint: 'Cormorant · magazine, luxury, refined' },
  { value: 'playful_display', label: 'Playful Display',  hint: 'Dancing Script · fun, modern-vintage' },
  { value: 'bold_geometric',  label: 'Bold Geometric',   hint: 'Raleway · brand-forward, strong, clean' },
  { value: 'warm_personal',   label: 'Warm Personal',    hint: 'Caveat script · handwritten, personal' },
  { value: 'urban_modern',    label: 'Urban Modern',     hint: 'Bebas Neue · poster, sharp, contemporary' },
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
    if (currentStep === 1) {
      if (!(prefs.additionalContext ?? '').trim()) {
        setTitleError(true);
        return;
      }
    }
    setTitleError(false);
    navigate((currentStep + 1) as 1 | 2 | 3);
  }

  function goBack() {
    navigate((currentStep - 1) as 1 | 2 | 3);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isGenerating) return;                   // guard 1: no double-submit
    if (currentStep !== 3 && !isDone) return;   // guard 2: only from step 3 or re-generate
    if (!(prefs.additionalContext ?? '').trim()) return;
    onGenerate(prefs);
  }

  function surpriseMe() {
    if (surpriseSpinning) return;
    setSurpriseSpinning(true);
    const finalColor = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)].value;
    const finalFont  = FONT_OPTIONS[Math.floor(Math.random() * FONT_OPTIONS.length)].value;
    let cycles = 0;
    surpriseTimerRef.current = setInterval(() => {
      onPrefsChange('colorScheme', COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)].value as FlyerPreferences['colorScheme']);
      onPrefsChange('fontStyle',   FONT_OPTIONS[Math.floor(Math.random() * FONT_OPTIONS.length)].value as FlyerPreferences['fontStyle']);
      if (++cycles >= 5) {
        clearInterval(surpriseTimerRef.current!);
        onPrefsChange('colorScheme', finalColor as FlyerPreferences['colorScheme']);
        onPrefsChange('fontStyle',   finalFont as FlyerPreferences['fontStyle']);
        setSurpriseSpinning(false);
      }
    }, 60);
  }

  // ── Step label strings ──────────────────────────────────────
  const STEP_LABELS = ['Content', 'Style', 'Review'];

  function ProgressIndicator({ current }: { current: 1 | 2 | 3 }) {
    return (
      <div
        className="shrink-0"
        style={{ padding: '18px 24px', borderBottom: '1px solid #2A2014', display: 'flex', alignItems: 'center', gap: 0 }}
      >
        {([1, 2, 3] as const).map((n, i) => {
          const isDone = current > n;
          const isCurrent = current === n;
          const circleStyle: React.CSSProperties = isDone
            ? { background: '#E3A93C', color: '#1C160F', border: '1px solid #E3A93C' }
            : isCurrent
            ? { background: 'rgba(227,169,60,0.16)', color: '#E9B547', border: '1px solid #E3A93C' }
            : { background: '#241C13', color: '#6B5742', border: '1px solid #33281B' };
          const labelStyle: React.CSSProperties = isDone
            ? { color: '#9A8472', fontWeight: 600 }
            : isCurrent
            ? { color: '#E9D9BF', fontWeight: 600 }
            : { color: '#6B5742' };
          return (
            <Fragment key={n}>
              <button
                type="button"
                onClick={() => current > n && navigate(n)}
                disabled={isGenerating}
                aria-label={`Go to step ${n}: ${STEP_LABELS[n - 1]}`}
                aria-current={isCurrent ? 'step' : undefined}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: isDone ? 'pointer' : 'default', padding: '0 4px' }}
              >
                <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, ...circleStyle }}>
                  {isDone ? '✓' : n}
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', ...labelStyle }}>{STEP_LABELS[i]}</span>
              </button>
              {i < 2 && (
                <div style={{ flex: 1, height: 1, background: current > n + 1 ? '#7A5D2A' : '#2E2418', marginBottom: 14 }} />
              )}
            </Fragment>
          );
        })}
      </div>
    );
  }

  function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
      <div className="flex justify-between items-center text-xs py-0.5">
        <span className="shrink-0" style={{ color: '#8A7560' }}>{label}</span>
        <span className="text-right ml-2" style={{ color: '#D8C9B4' }}>{value}</span>
      </div>
    );
  }

  const hints = OCCASION_PLACEHOLDERS[prefs.occasion ?? 'business'] ?? OCCASION_PLACEHOLDERS.business;
  const showFlierFields = prefs.occasion === 'business' || prefs.occasion === 'invitation';

  function renderStepContent(step: 1 | 2 | 3): React.ReactNode {
    if (step === 1) {
      return (
        <div className="space-y-4">
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 21, fontWeight: 600, color: '#F1E8DB', marginBottom: 6 }}>
            Tell us about this card
          </p>

          {/* Unified description */}
          <div>
            <textarea
              value={prefs.additionalContext ?? ''}
              onChange={(e) => {
                onPrefsChange('additionalContext', e.target.value);
                if (e.target.value.trim()) setTitleError(false);
              }}
              disabled={isGenerating}
              rows={6}
              placeholder="Describe your card here..."
              onFocus={(e) => { if (!titleError) { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(227,169,60,0.13)'; e.currentTarget.style.borderColor = '#E3A93C'; } }}
              onBlur={(e) => { if (!titleError) { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#34281A'; } }}
              className="w-full placeholder-[#5A4C40] focus:outline-none disabled:opacity-40"
              style={{
                width: '100%',
                background: '#241C13',
                border: titleError ? '1px solid #ef4444' : '1px solid #34281A',
                borderRadius: 10,
                padding: 13,
                color: '#C4B49E',
                fontSize: 13,
                lineHeight: 1.5,
                resize: 'none',
                outline: 'none',
              }}
            />
            {titleError && (
              <p className="mt-1 text-[11px] text-red-400">Describe the card so we know what to make</p>
            )}
            <p className="mt-2 text-[11px] italic leading-snug" style={{ color: 'rgba(123,107,91,0.7)' }}>
              💡 Tip: Mention a name, relationship, or who&rsquo;s signing
              (e.g. &ldquo;birthday card for Ada&rdquo;, &ldquo;from his sister&rdquo;)
            </p>
          </div>

          <div style={{ borderTop: '1px solid #2A2014', margin: '16px 0' }} />

          {/* Occasion */}
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A7560', marginBottom: 10, display: 'block' }}>
            Occasion
          </p>
          <p className="text-[10px] -mt-3" style={{ color: '#6B5742' }}>optional — AI infers if blank</p>
          <OccasionPicker
            value={prefs.occasion}
            onChange={(v) => onPrefsChange('occasion', v)}
            disabled={isGenerating}
          />

          {/* Vibe */}
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A7560', marginBottom: 10, marginTop: 18, display: 'block' }}>
            Vibe
          </p>
          <p className="text-[10px] -mt-3" style={{ color: '#6B5742' }}>optional — AI infers if blank</p>
          <VibePicker
            value={prefs.vibe}
            onChange={(v) => onPrefsChange('vibe', v)}
            disabled={isGenerating}
          />

          {/* Event details — only visible for Business Promo or Invitation */}
          <div
            className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
              showFlierFields ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="space-y-4 pt-3">
              <div style={{ borderTop: '1px solid #2A2014' }} />
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A7560', display: 'block' }}>
                Event Details
                <span style={{ color: '#6B5742', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal', marginLeft: 4 }}>
                  — optional
                </span>
              </p>

              <FloatingField
                label="Tagline"
                value={prefs.tagline ?? ''}
                onChange={(v) => onPrefsChange('tagline', v)}
                placeholder={hints.tagline}
                disabled={isGenerating}
              />

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

              <FloatingField
                label="Contact / URL"
                value={prefs.contactInfo ?? ''}
                onChange={(v) => onPrefsChange('contactInfo', v)}
                placeholder="e.g. tickets@festival.com"
                disabled={isGenerating}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #2A2014', margin: '16px 0' }} />

          {/* Region */}
          <FloatingField
            label="Where you're from (optional)"
            value={prefs.region ?? ''}
            onChange={(v) => onPrefsChange('region', v)}
            placeholder="e.g. Nigeria, Ghana, UK, USA"
            disabled={isGenerating}
          />

          {/* Photos & Assets — hidden until post-launch photo support ships */}
          {SHOW_PHOTO_UPLOAD && (
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A7560', marginBottom: 4, display: 'block' }}>
                Your Photos & Assets
                <span style={{ color: '#6B5742', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal', marginLeft: 4 }}>
                  — optional
                </span>
              </p>
              <p className="text-[10px] text-[#7B6B5B]mb-2 leading-relaxed">
                Upload photos of people, products, or logos you want in your card.
                We&rsquo;ll blend them into the design seamlessly.
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
          )}
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-5">
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 21, fontWeight: 600, color: '#F1E8DB', marginBottom: 6 }}>
            Choose your style
          </p>

          {/* Surprise Me */}
          <button
            type="button"
            onClick={surpriseMe}
            disabled={isGenerating || surpriseSpinning}
            style={{
              width: '100%',
              background: '#241C13',
              border: '1px dashed #45371F',
              borderRadius: 9,
              padding: '10px 0',
              color: '#C4B49E',
              fontSize: 13,
              cursor: isGenerating || surpriseSpinning ? 'not-allowed' : 'pointer',
              marginBottom: 8,
              transition: 'all 0.15s',
            }}
          >
            <span className={surpriseSpinning ? 'animate-spin inline-block' : ''}>✦</span>{' '}
            Surprise me
          </button>

          {/* Color scheme */}
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A7560', marginBottom: 10, display: 'block' }}>
              Color Scheme
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {COLOR_OPTIONS.map((opt) => {
                const strips = COLOR_STRIPS[opt.value] ?? [];
                const selected = prefs.colorScheme === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => !isGenerating && onPrefsChange('colorScheme', opt.value as FlyerPreferences['colorScheme'])}
                    style={{
                      background: selected ? 'rgba(227,169,60,0.08)' : '#241C13',
                      border: selected ? '1px solid rgba(227,169,60,0.50)' : '1px solid #33281B',
                      borderRadius: 12,
                      overflow: 'hidden',
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      transform: selected ? 'translateY(-1px)' : 'none',
                      boxShadow: selected ? '0 0 0 1px #E3A93C,0 8px 22px -10px rgba(227,169,60,0.6)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', height: 44 }}>
                      {strips.map((c, i) => (
                        <div key={i} style={{ flex: 1, background: c }} />
                      ))}
                    </div>
                    <div style={{ background: '#1F1810', padding: '6px 10px', fontSize: 10, fontWeight: 500, color: '#A8957F' }}>
                      {opt.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Font style */}
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A7560', marginBottom: 10, display: 'block' }}>
              Font Style
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {FONT_OPTIONS.map((opt) => {
                const selected = prefs.fontStyle === opt.value;
                const fontMeta = FONT_STYLE_MAP[opt.value];
                if (!fontMeta) return null;
                return (
                  <div
                    key={opt.value}
                    onClick={() => !isGenerating && onPrefsChange('fontStyle', opt.value as FlyerPreferences['fontStyle'])}
                    style={{
                      background: selected ? 'rgba(227,169,60,0.08)' : '#241C13',
                      border: selected ? '1px solid rgba(227,169,60,0.50)' : '1px solid #33281B',
                      borderRadius: 12,
                      padding: '14px 10px',
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      textAlign: 'center',
                      transform: selected ? 'translateY(-1px)' : 'none',
                      boxShadow: selected ? '0 0 0 1px #E3A93C,0 8px 22px -10px rgba(227,169,60,0.6)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    <p className={fontMeta.className} style={{ fontSize: 22, color: '#D8C9B4', marginBottom: 4, ...fontMeta.style }}>{fontMeta.label}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: '#73604D', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{opt.label}</p>
                  </div>
                );
              })}
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
        <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 21, fontWeight: 600, color: '#F1E8DB', marginBottom: 6 }}>
          Review & Generate
        </p>

        {/* Content card */}
        <div style={{ background: '#241C13', border: '1px solid #33281B', borderRadius: 12, padding: 16 }} className="space-y-1">
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A7560' }}>
              Content
            </span>
            <button
              type="button"
              onClick={() => navigate(1)}
              style={{ color: '#E3A93C', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Edit
            </button>
          </div>
          <SummaryRow label="Occasion" value={occasionLabel} />
          <SummaryRow label="Vibe"     value={vibeLabel} />
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
              label="Description"
              value={
                <span className="italic text-zinc-400 truncate max-w-[140px] block">
                  &ldquo;{prefs.additionalContext.slice(0, 40)}
                  {prefs.additionalContext.length > 40 ? '…' : ''}&rdquo;
                </span>
              }
            />
          )}
          {prefs.region && <SummaryRow label="Region" value={prefs.region} />}
        </div>

        {/* Style card */}
        <div style={{ background: '#241C13', border: '1px solid #33281B', borderRadius: 12, padding: 16 }} className="space-y-1">
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8A7560' }}>
              Style
            </span>
            <button
              type="button"
              onClick={() => navigate(2)}
              style={{ color: '#E3A93C', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Edit
            </button>
          </div>
          <SummaryRow label="Colors"  value={colorLabel} />
          <SummaryRow label="Fonts"   value={fontLabel} />
        </div>

        {/* Hero generate button */}
        <button
          type="submit"
          disabled={isGenerating}
          className={isGenerating ? '' : 'btn-gold'}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            marginTop: 16,
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            ...(isGenerating ? { background: 'rgba(227,169,60,0.2)', color: 'rgba(227,169,60,0.6)', border: '1px solid rgba(227,169,60,0.2)' } : {}),
          }}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              Creating your card...
            </span>
          ) : (
            'Create My Card →'
          )}
        </button>
      </div>
    );
  }

  const enterClass = direction === 'forward' ? 'step-enter-forward' : 'step-enter-backward';
  const exitClass  = direction === 'forward' ? 'step-exit-forward'  : 'step-exit-backward';

  return (
    <form
      onSubmit={handleSubmit}
      className="h-full flex flex-col"
      style={{ background: '#1C160F', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* Progress indicator — hidden when done */}
      {!isDone && <ProgressIndicator current={currentStep} />}

      {/* Step transition container */}
      <div className="relative overflow-hidden flex-1 min-h-0" style={{ flex: 1 }}>
        {/* Exiting step — absolute, overflow-hidden to prevent scrollbar during animation */}
        {prevStep && (
          <div className={`absolute inset-0 overflow-hidden ${exitClass}`}>
            <div className="h-full" style={{ overflowY: 'auto', overflowX: 'hidden', padding: '20px 24px' }}>
              {renderStepContent(prevStep)}
            </div>
          </div>
        )}
        {/* Current step — normal flow with its own scroll */}
        <div className={`h-full ${transitioning ? enterClass : ''}`} style={{ overflowY: 'auto', overflowX: 'hidden', padding: '20px 24px' }}>
          {renderStepContent(currentStep)}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="shrink-0" style={{ borderTop: '1px solid #2A2014', padding: '14px 20px', display: 'flex', gap: 10 }}>
        {isDone ? (
          <div className="flex gap-2" style={{ width: '100%' }}>
            <button
              type="button"
              onClick={onReset}
              style={{ border: '1px solid #33281B', color: '#C4B49E', background: 'transparent', borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer' }}
            >
              New card
            </button>
            <button
              type="submit"
              style={{ flex: 1, background: '#2E2417', border: '1px solid #3D2F1D', color: '#E9D9BF', borderRadius: 8, padding: '10px 0', fontSize: 13, cursor: 'pointer' }}
            >
              Regenerate
            </button>
          </div>
        ) : currentStep < 3 ? (
          <div className="flex gap-2" style={{ width: '100%' }}>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={goBack}
                disabled={isGenerating}
                className="disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ border: '1px solid #33281B', color: '#C4B49E', background: 'transparent', borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer' }}
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={isGenerating}
              className="btn-gold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ flex: 1, borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
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
            className="disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ width: '100%', border: '1px solid #33281B', color: '#C4B49E', background: 'transparent', borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer' }}
          >
            ← Back to Style
          </button>
        )}
      </div>
    </form>
  );
}
