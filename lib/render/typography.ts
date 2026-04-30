import { readFileSync } from 'fs';
import { join } from 'path';
import type { TypographyPairingId } from '../types';

export type FontSpec = { font: string; weight: number; sizeRatio: number };

export type SatoriFont = {
  name: string;
  data: Buffer;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: 'normal' | 'italic';
};

export type TypographyPairing = {
  id: TypographyPairingId;
  description: string;
  headline: FontSpec;
  name: FontSpec;
  body: FontSpec;
  signoff: FontSpec;
};

/** Base font size (px) at 1024×1536. sizeRatio multiplies this. */
export const BASE_SIZE = 64;

export const TYPOGRAPHY_PAIRINGS: Record<TypographyPairingId, TypographyPairing> = {
  classical_elegant: {
    id: 'classical_elegant',
    description: 'Playfair Display for structure; signoff in Great Vibes script.',
    headline: { font: 'Playfair Display', weight: 700, sizeRatio: 0.70 },
    name:     { font: 'Playfair Display', weight: 700, sizeRatio: 1.00 },
    body:     { font: 'Playfair Display', weight: 400, sizeRatio: 0.35 },
    signoff:  { font: 'Great Vibes',      weight: 400, sizeRatio: 0.45 },
  },
  modern_clean: {
    id: 'modern_clean',
    description: 'Inter throughout — clean, contemporary, highly legible.',
    headline: { font: 'Inter', weight: 700, sizeRatio: 0.75 },
    name:     { font: 'Inter', weight: 700, sizeRatio: 1.00 },
    body:     { font: 'Inter', weight: 400, sizeRatio: 0.35 },
    signoff:  { font: 'Inter', weight: 500, sizeRatio: 0.42 },
  },
  bold_impact: {
    id: 'bold_impact',
    description: 'Bebas Neue display + Inter body for high energy and legibility.',
    headline: { font: 'Bebas Neue', weight: 400, sizeRatio: 0.80 },
    name:     { font: 'Bebas Neue', weight: 400, sizeRatio: 1.00 },
    body:     { font: 'Inter',      weight: 400, sizeRatio: 0.32 },
    signoff:  { font: 'Inter',      weight: 500, sizeRatio: 0.40 },
  },
  romantic_serif: {
    id: 'romantic_serif',
    description: 'Cormorant Garamond body + Allura script for name and signoff.',
    headline: { font: 'Cormorant Garamond', weight: 700, sizeRatio: 0.70 },
    name:     { font: 'Allura',             weight: 400, sizeRatio: 1.00 },
    body:     { font: 'Cormorant Garamond', weight: 400, sizeRatio: 0.35 },
    signoff:  { font: 'Allura',             weight: 400, sizeRatio: 0.45 },
  },
  warm_handwritten: {
    id: 'warm_handwritten',
    description: 'DM Serif Display for structure; Caveat script for name and signoff.',
    headline: { font: 'DM Serif Display', weight: 400, sizeRatio: 0.72 },
    name:     { font: 'Caveat',           weight: 700, sizeRatio: 1.00 },
    body:     { font: 'DM Serif Display', weight: 400, sizeRatio: 0.34 },
    signoff:  { font: 'Caveat',           weight: 400, sizeRatio: 0.44 },
  },
  minimal_swiss: {
    id: 'minimal_swiss',
    description: 'Inter Tight throughout — tight spacing, clean Swiss grid feel.',
    headline: { font: 'Inter Tight', weight: 700, sizeRatio: 0.75 },
    name:     { font: 'Inter Tight', weight: 500, sizeRatio: 1.00 },
    body:     { font: 'Inter',       weight: 400, sizeRatio: 0.33 },
    signoff:  { font: 'Inter',       weight: 500, sizeRatio: 0.42 },
  },
};

// ── Font loading ──────────────────────────────────────────────────────────────

const nm = join(process.cwd(), 'node_modules', '@fontsource');

function woff(pkg: string, weight: number): Buffer {
  return readFileSync(join(nm, pkg, 'files', `${pkg}-latin-${weight}-normal.woff`));
}

// Cache per pairing ID to avoid repeated disk reads
const _fontCache = new Map<TypographyPairingId, SatoriFont[]>();

export function loadTypographyFonts(pairingId: TypographyPairingId): SatoriFont[] {
  if (_fontCache.has(pairingId)) return _fontCache.get(pairingId)!;

  const sets: SatoriFont[][] = [];

  // Always include Inter (used in bold_impact body, modern_clean, minimal_swiss)
  sets.push([
    { name: 'Inter', data: woff('inter', 400), weight: 400, style: 'normal' },
    { name: 'Inter', data: woff('inter', 700), weight: 700, style: 'normal' },
  ]);
  // Inter 500 for signoff slots
  try {
    sets.push([{ name: 'Inter', data: woff('inter', 500), weight: 500, style: 'normal' }]);
  } catch { /* 500 may not exist as a separate file — 400/700 fallback is fine */ }

  switch (pairingId) {
    case 'classical_elegant':
      sets.push([
        { name: 'Playfair Display', data: woff('playfair-display', 400), weight: 400, style: 'normal' },
        { name: 'Playfair Display', data: woff('playfair-display', 700), weight: 700, style: 'normal' },
        { name: 'Great Vibes',      data: woff('great-vibes',       400), weight: 400, style: 'normal' },
      ]);
      break;

    case 'modern_clean':
      // Inter already loaded above
      break;

    case 'bold_impact':
      sets.push([
        { name: 'Bebas Neue', data: woff('bebas-neue', 400), weight: 400, style: 'normal' },
      ]);
      break;

    case 'romantic_serif':
      sets.push([
        { name: 'Cormorant Garamond', data: woff('cormorant-garamond', 400), weight: 400, style: 'normal' },
        { name: 'Cormorant Garamond', data: woff('cormorant-garamond', 700), weight: 700, style: 'normal' },
        { name: 'Allura',             data: woff('allura',             400), weight: 400, style: 'normal' },
      ]);
      break;

    case 'warm_handwritten':
      sets.push([
        { name: 'DM Serif Display', data: woff('dm-serif-display', 400), weight: 400, style: 'normal' },
        { name: 'Caveat', data: woff('caveat', 400), weight: 400, style: 'normal' },
        { name: 'Caveat', data: woff('caveat', 700), weight: 700, style: 'normal' },
      ]);
      break;

    case 'minimal_swiss':
      sets.push([
        { name: 'Inter Tight', data: woff('inter-tight', 500), weight: 500, style: 'normal' },
        { name: 'Inter Tight', data: woff('inter-tight', 700), weight: 700, style: 'normal' },
      ]);
      break;
  }

  const fonts = sets.flat();
  _fontCache.set(pairingId, fonts);
  return fonts;
}
