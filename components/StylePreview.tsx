'use client';

import type { FlyerPreferences } from '@/lib/types';
import { COLOR_SCHEME_THEMES, FONT_STYLE_MAP, SHOWCASE } from '@/lib/design-constants';

interface StylePreviewProps {
  prefs: FlyerPreferences;
  generating?: boolean;
}

/**
 * Thin idle/preview card used by CanvasPanel's showcase reel.
 * The animated reel and generating skeleton now live in CanvasPanel;
 * this component renders a single static "Warm Atelier" preview card
 * and remains exported for any consumer that needs a standalone preview.
 */
export function StylePreview({ prefs }: StylePreviewProps) {
  const theme =
    COLOR_SCHEME_THEMES[prefs.colorScheme ?? 'warm'] ?? COLOR_SCHEME_THEMES.warm;
  const fontEntry =
    FONT_STYLE_MAP[prefs.fontStyle ?? 'modern'] ?? FONT_STYLE_MAP.modern;
  const entry = SHOWCASE[0];

  return (
    <div
      style={{
        width: 340,
        height: 430,
        borderRadius: 8,
        padding: 30,
        background: theme.bg,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow:
          '0 36px 70px -18px rgba(40,26,12,0.62), inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: 'rgba(227,169,60,0.10)', filter: 'blur(36px)', zIndex: -1, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 14, border: `1px solid ${theme.frame}`, borderRadius: 4, pointerEvents: 'none' }} />
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.accent }}>{entry.label}</p>
        <div>
          <p className={fontEntry.className} style={{ ...fontEntry.style, fontSize: 38, color: theme.ink, lineHeight: 1.1, marginBottom: 8 }}>{entry.title}</p>
          <p style={{ fontSize: 10, color: theme.sub, marginBottom: 6, letterSpacing: '0.08em' }}>— ◈ —</p>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 16, fontStyle: 'italic', color: theme.sub }}>{entry.tagline}</p>
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: theme.sub, letterSpacing: '0.1em' }}>{entry.detail}</p>
      </div>
    </div>
  );
}
