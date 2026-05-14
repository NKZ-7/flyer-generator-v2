import sharp from 'sharp';
import Color from 'color';
import type { Rect } from './layouts';
import {
  CONTRAST_RATIOS,
  LEGIBILITY_TEXT_COLOR,
  LEGIBILITY_TEXT_COLOR_LIGHT,
  LEGIBILITY_LUMINANCE_THRESHOLD,
} from './render-config';

const MAX_DARKEN_BEFORE_SWAP = 3;

// Swap map: for each color family, ordered candidates that typically pass contrast
// with ≤2 darken iterations. Preserves the spirit of the original while avoiding mud.
const SWAP_MAP: Record<string, string[]> = {
  'warm-pink':     ['#e85d75', '#c44d58'],
  'cool-pink':     ['#db4b8a', '#c2376f'],
  'warm-orange':   ['#c2410c', '#9a3412'],
  'bright-yellow': ['#d97706', '#a67c00'],
  'bright-cyan':   ['#0e7490', '#155e75'],
  'bright-lime':   ['#3f6212', '#65735c'],
  'bright-purple': ['#7e22ce', '#581c87'],
};

export type TextColors = {
  headline: string;
  name: string;
  body: string;
  signoff: string;
};

/**
 * Crop `zone` from the canvas, resize to 1×1, return the average hex color.
 * Falls back to warm cream if sampling fails.
 */
export async function extractZoneColor(imageBuffer: Buffer, zone: Rect): Promise<string> {
  try {
    const { data } = await sharp(imageBuffer)
      .extract({ left: zone.x, top: zone.y, width: zone.width, height: zone.height })
      .resize(1, 1, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return `#${data[0].toString(16).padStart(2, '0')}${data[1].toString(16).padStart(2, '0')}${data[2].toString(16).padStart(2, '0')}`;
  } catch {
    console.warn(`[ColorSampling] Zone extraction failed for zone ${JSON.stringify(zone)}, falling back to default. This breaks contrast enforcement.`);
    return '#F5E6D0'; // warm cream fallback
  }
}

/**
 * Sample the layout's known decorated area, find the most saturated pixel,
 * and return that as the accent color. Falls back to warm gold if everything
 * is near-neutral.
 */
export async function extractAccentColor(imageBuffer: Buffer, sampleZone: Rect): Promise<string> {
  try {
    const { data, info } = await sharp(imageBuffer)
      .extract({
        left:   sampleZone.x,
        top:    sampleZone.y,
        width:  Math.max(sampleZone.width, 1),
        height: Math.max(sampleZone.height, 1),
      })
      .resize(10, 10, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let bestHex = '#8B6914'; // warm gold fallback
    let bestSat = 0;

    for (let i = 0; i < info.width * info.height; i++) {
      const r = data[i * 3];
      const g = data[i * 3 + 1];
      const b = data[i * 3 + 2];
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      try {
        const sat = Color(hex).saturationl();
        if (sat > bestSat) {
          bestSat = sat;
          bestHex = hex;
        }
      } catch { /* skip malformed pixel */ }
    }

    return bestSat < 15 ? '#8B6914' : bestHex;
  } catch {
    return '#8B6914'; // warm gold fallback
  }
}

/**
 * Two-channel color strategy:
 *   Legibility channel (name, body) — fixed near-black/near-white ink chosen by zone luminance,
 *   guaranteed readable without needing accent extraction.
 *   Decorative channel (headline, signoff) — accent-harmonized, still contrast-checked.
 */
export function harmonizeColors(zoneColor: string, accentColor: string): TextColors {
  console.log('[harmonize] IN  zoneColor:', zoneColor, 'accentColor:', accentColor);

  // Legibility channel: pick ink by zone luminance
  const zoneLum      = relativeLuminance(zoneColor);
  const legibilityColor = zoneLum < LEGIBILITY_LUMINANCE_THRESHOLD
    ? LEGIBILITY_TEXT_COLOR_LIGHT
    : LEGIBILITY_TEXT_COLOR;
  console.log('[harmonize] zoneLum:', zoneLum.toFixed(3), '→ legibilityColor:', legibilityColor,
    'cr:', contrastRatio(legibilityColor, zoneColor).toFixed(2));

  // Decorative channel
  const signoffInitial = desaturate(accentColor, 30);

  const accentIter  = countDarkenIterations(accentColor,    zoneColor, CONTRAST_RATIOS.large_headline);
  const signoffIter = countDarkenIterations(signoffInitial, zoneColor, CONTRAST_RATIOS.signoff);

  const headlineBase = accentIter  > MAX_DARKEN_BEFORE_SWAP
    ? findHarmoniousSwap(accentColor,    zoneColor)
    : accentColor;
  const signoffBase  = signoffIter > MAX_DARKEN_BEFORE_SWAP
    ? findHarmoniousSwap(signoffInitial, zoneColor)
    : signoffInitial;

  if (headlineBase !== accentColor) {
    const family = identifyColorFamily(accentColor) ?? 'unknown';
    console.log(`[accent-swap] original=${accentColor} family=${family} swapped=${headlineBase} reason=would-require-${accentIter}-darken-iterations zoneColor=${zoneColor} zoneLum=${zoneLum.toFixed(3)}`);
  }

  const headline = ensureContrast(headlineBase, zoneColor, CONTRAST_RATIOS.large_headline);
  const signoff  = ensureContrast(signoffBase,  zoneColor, CONTRAST_RATIOS.signoff);

  // Legibility channel: name + body — run through ensureContrast as a safety check;
  // legibilityColor is already near-extreme so this returns it unchanged at step 0 in practice
  const name = ensureContrast(legibilityColor, zoneColor, CONTRAST_RATIOS.large_headline);
  const body = ensureContrast(legibilityColor, zoneColor, CONTRAST_RATIOS.body_text);

  console.log('[harmonize] OUT — headline:', headline, 'cr:', contrastRatio(headline, zoneColor).toFixed(2));
  console.log('[harmonize] OUT — name:    ', name,     'cr:', contrastRatio(name,     zoneColor).toFixed(2));
  console.log('[harmonize] OUT — body:    ', body,     'cr:', contrastRatio(body,     zoneColor).toFixed(2));
  console.log('[harmonize] OUT — signoff: ', signoff,  'cr:', contrastRatio(signoff,  zoneColor).toFixed(2));

  return { headline, name, body, signoff };
}

export function darken(hex: string, pct: number): string {
  try {
    return Color(hex).darken(pct / 100).hex();
  } catch {
    return hex;
  }
}

export function desaturate(hex: string, pct: number): string {
  try {
    return Color(hex).desaturate(pct / 100).hex();
  } catch {
    return hex;
  }
}

function countDarkenIterations(textHex: string, bgHex: string, minRatio: number): number {
  let color = textHex;
  for (let step = 0; step < 20; step++) {
    if (contrastRatio(color, bgHex) >= minRatio) return step;
    color = darken(color, 5);
  }
  return 20;
}

function identifyColorFamily(hex: string): string | null {
  try {
    const c = Color(hex);
    const h = c.hue();
    const s = c.saturationl();
    const l = c.lightness();
    if (s < 40 || l < 30 || l > 80) return null;
    if (h >= 345 || h < 15)  return 'warm-pink';
    if (h >= 15  && h < 40)  return 'warm-orange';
    if (h >= 40  && h < 70)  return 'bright-yellow';
    if (h >= 70  && h < 165) return 'bright-lime';
    if (h >= 165 && h < 215) return 'bright-cyan';
    if (h >= 255 && h < 295) return 'bright-purple';
    if (h >= 295 && h < 345) return 'cool-pink';
  } catch { /* ignore */ }
  return null;
}

function findHarmoniousSwap(originalHex: string, bgHex: string): string {
  const family = identifyColorFamily(originalHex);
  if (family) {
    for (const candidate of (SWAP_MAP[family] ?? [])) {
      if (countDarkenIterations(candidate, bgHex, CONTRAST_RATIOS.large_headline) <= 2) {
        return candidate;
      }
    }
  }
  return originalHex;
}

function relativeLuminance(hex: string): number {
  try {
    const c = Color(hex);
    const toLinear = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    return 0.2126 * toLinear(c.red() / 255)
         + 0.7152 * toLinear(c.green() / 255)
         + 0.0722 * toLinear(c.blue() / 255);
  } catch {
    return 0;
  }
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function ensureContrast(textHex: string, bgHex: string, minRatio: number): string {
  let color = textHex;
  for (let step = 0; step < 20; step++) {
    if (contrastRatio(color, bgHex) >= minRatio) return color;
    color = darken(color, 5);
  }
  // Fallback: choose whichever extreme (near-black or near-white) contrasts better
  return contrastRatio('#1a1a1a', bgHex) > contrastRatio('#f5f5f5', bgHex) ? '#1a1a1a' : '#f5f5f5';
}
