import sharp from 'sharp';
import Color from 'color';
import type { Rect } from './layouts';
import { CONTRAST_RATIOS } from './render-config';

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
 * Given the background zone color and a saturated accent color from the
 * decoration, return a harmonized set of text colors that all pass WCAG AA
 * contrast against the zone background.
 */
export function harmonizeColors(zoneColor: string, accentColor: string): TextColors {
  return {
    headline: ensureContrast(accentColor,              zoneColor, CONTRAST_RATIOS.large_headline),
    name:     ensureContrast(darken(accentColor, 15),  zoneColor, CONTRAST_RATIOS.large_headline),
    body:     ensureContrast(darken(zoneColor, 60),    zoneColor, CONTRAST_RATIOS.body_text),
    signoff:  ensureContrast(desaturate(accentColor, 30), zoneColor, CONTRAST_RATIOS.signoff),
  };
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
