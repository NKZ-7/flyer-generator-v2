import type { LayoutId } from '../types';

export type Rect = { x: number; y: number; width: number; height: number };
export type Align = 'left' | 'center' | 'right';

export type LayoutZones = { headline: Rect; name: Rect; body: Rect; signoff: Rect };

export type Layout = {
  id: LayoutId;
  description: string;
  computeZones: (width: number, height: number) => LayoutZones;
  computeGptZoneInstructions: (width: number, height: number) => string;
  computeDecorationSampleZone: (width: number, height: number) => Rect;
  text_alignment: { headline: Align; name: Align; body: Align; signoff: Align };
};

function rect(xFrac: number, yFrac: number, wFrac: number, hFrac: number, w: number, h: number): Rect {
  return {
    x:      Math.round(xFrac * w),
    y:      Math.round(yFrac * h),
    width:  Math.round(wFrac * w),
    height: Math.round(hFrac * h),
  };
}

function clampRect(r: Rect, canvasW: number, canvasH: number): Rect {
  const x = Math.max(0, Math.min(r.x, canvasW - 1));
  const y = Math.max(0, Math.min(r.y, canvasH - 1));
  return {
    x,
    y,
    width:  Math.min(r.width,  canvasW - x),
    height: Math.min(r.height, canvasH - y),
  };
}

// Combines rect() + clampRect() — use everywhere inside computeZones
function cr(xFrac: number, yFrac: number, wFrac: number, hFrac: number, w: number, h: number): Rect {
  return clampRect(rect(xFrac, yFrac, wFrac, hFrac, w, h), w, h);
}

export const LAYOUTS: Record<LayoutId, Layout> = {

  // ─────────────────────────────────────────────────────────────────────────
  // centered_framed
  // Empty zone: x:10%-90%, y:18%-82%  →  at 1024×1024: (102,184)→(922,840)
  // Content stack starts at y≈262 (78px top padding inside empty zone)
  // headline(70) + 16 + name(140) + 56 + body(160) + 36 + signoff(60) = 538px
  // ─────────────────────────────────────────────────────────────────────────
  centered_framed: {
    id: 'centered_framed',
    description: 'Decorative elements frame all four edges; clean cream center for text.',
    computeZones: (w, h) => ({
      headline: cr(0.15,  0.255, 0.70, 0.068, w, h),
      name:     cr(0.075, 0.340, 0.85, 0.137, w, h),
      body:     cr(0.15,  0.531, 0.70, 0.156, w, h),
      signoff:  cr(0.20,  0.722, 0.60, 0.058, w, h),
    }),
    computeGptZoneInstructions: (w, h) => {
      const x1 = Math.round(0.10 * w);
      const x2 = Math.round(0.90 * w);
      const y1 = Math.round(0.18 * h);
      const y2 = Math.round(0.82 * h);
      return `The rectangle from pixel coordinates (x: ${x1}-${x2}, y: ${y1}-${y2}) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns, no lines, no shapes. Only the soft cream wash. Decorative elements are welcome OUTSIDE this rectangle, framing the four edges of the canvas. Be creative with the framing decoration: vary placement, density, and motifs to feel intentional and balanced.`;
    },
    computeDecorationSampleZone: (w, h) => cr(0, 0, 0.10, 0.18, w, h),
    text_alignment: { headline: 'center', name: 'center', body: 'center', signoff: 'center' },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // asymmetric_diagonal
  // Empty zones: upper-left (x:0-55%, y:0-55%) and lower-right (x:45%-100%, y:45%-100%)
  // Text content stacks in the upper-left zone
  // Content stack starts at y≈60 (top of upper-left zone with small margin)
  // headline(70) + 20 + name(140) + 40 + body(130) + 20 + signoff(55) = 475px
  // ─────────────────────────────────────────────────────────────────────────
  asymmetric_diagonal: {
    id: 'asymmetric_diagonal',
    description: 'Decoration in upper-right and lower-left corners; text in upper-left zone.',
    computeZones: (w, h) => ({
      headline: cr(0.059, 0.059, 0.47, 0.068, w, h),
      name:     cr(0.059, 0.146, 0.47, 0.137, w, h),
      body:     cr(0.059, 0.322, 0.45, 0.127, w, h),
      signoff:  cr(0.059, 0.469, 0.34, 0.054, w, h),
    }),
    computeGptZoneInstructions: (w, h) => {
      const splitX1 = Math.round(0.45 * w);
      const splitX2 = Math.round(0.55 * w);
      const splitY1 = Math.round(0.45 * h);
      const splitY2 = Math.round(0.55 * h);
      return `Two zones must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns: (x: 0-${splitX2}, y: 0-${splitY2}) the upper-left zone, and (x: ${splitX1}-${w}, y: ${splitY1}-${h}) the lower-right zone. Only the soft cream wash in those zones. Place decoration in the upper-right zone (x: ${splitX1}-${w}, y: 0-${splitY2}) and the lower-left zone (x: 0-${splitX2}, y: ${splitY1}-${h}). Aim for a balanced diagonal flow of decoration across the canvas.`;
    },
    computeDecorationSampleZone: (w, h) => cr(0.55, 0, 0.45, 0.45, w, h),
    text_alignment: { headline: 'left', name: 'left', body: 'left', signoff: 'left' },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // top_heavy
  // Empty zone: x:8%-92%, y:42%-92%  →  at 1024×1024: (82,430)→(942,942)
  // Stack vertically centered inside the empty zone (height 512px)
  // headline(70) + 16 + name(140) + 36 + body(130) + 20 + signoff(55) = 467px
  // Stack starts at y≈452 (22px top padding inside empty zone)
  // ─────────────────────────────────────────────────────────────────────────
  top_heavy: {
    id: 'top_heavy',
    description: 'Decoration across the upper portion; clean lower area for text.',
    computeZones: (w, h) => ({
      headline: cr(0.10,  0.441, 0.80, 0.068, w, h),
      name:     cr(0.09,  0.525, 0.82, 0.137, w, h),
      body:     cr(0.10,  0.697, 0.75, 0.127, w, h),
      signoff:  cr(0.20,  0.844, 0.60, 0.054, w, h),
    }),
    computeGptZoneInstructions: (w, h) => {
      const x1 = Math.round(0.08 * w);
      const x2 = Math.round(0.92 * w);
      const y1 = Math.round(0.42 * h);
      const y2 = Math.round(0.92 * h);
      return `The rectangle from (x: ${x1}-${x2}, y: ${y1}-${y2}) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns. Only the soft cream wash. Decoration belongs in the upper area (y: 0-${y1}), spreading across the top with rich detail that gradually fades downward. The upper area should feel abundant and vibrant.`;
    },
    computeDecorationSampleZone: (w, h) => cr(0.08, 0, 0.84, 0.35, w, h),
    text_alignment: { headline: 'left', name: 'left', body: 'left', signoff: 'left' },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // magazine_split
  // Empty zone: x:6%-55%, y:10%-90%  →  at 1024×1024: (61,102)→(563,922)
  // Text column width 502px; stack vertically centered (height 820px available)
  // headline(70) + 16 + name(140) + 36 + body(130) + 20 + signoff(55) = 467px
  // Stack starts at y≈278 (176px top padding — generous vertical center)
  // ─────────────────────────────────────────────────────────────────────────
  magazine_split: {
    id: 'magazine_split',
    description: 'Decoration on the right portion; text occupies the left portion.',
    computeZones: (w, h) => ({
      headline: cr(0.059, 0.271, 0.47, 0.068, w, h),
      name:     cr(0.059, 0.355, 0.47, 0.137, w, h),
      body:     cr(0.059, 0.527, 0.45, 0.127, w, h),
      signoff:  cr(0.059, 0.674, 0.34, 0.054, w, h),
    }),
    computeGptZoneInstructions: (w, h) => {
      const x1 = Math.round(0.06 * w);
      const x2 = Math.round(0.55 * w);
      const y1 = Math.round(0.10 * h);
      const y2 = Math.round(0.90 * h);
      return `The rectangle from (x: ${x1}-${x2}, y: ${y1}-${y2}) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns. Only the soft cream wash. Decoration covers the right portion (x: ${x2}-${w}, y: 0-${h}) with full-bleed visual weight. Use this side to make a strong statement with rich color and detail.`;
    },
    computeDecorationSampleZone: (w, h) => cr(0.55, 0.10, 0.40, 0.80, w, h),
    text_alignment: { headline: 'left', name: 'left', body: 'left', signoff: 'left' },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // vignette_center
  // Empty zone: x:15%-85%, y:20%-80%  →  at 1024×1024: (154,205)→(870,819)
  // Stack vertically centered inside the empty zone (height 614px)
  // headline(70) + 16 + name(140) + 36 + body(130) + 20 + signoff(55) = 467px
  // Stack starts at y≈279 (74px top padding inside empty zone)
  // ─────────────────────────────────────────────────────────────────────────
  vignette_center: {
    id: 'vignette_center',
    description: 'Soft decoration fades inward from all edges; clean center for text.',
    computeZones: (w, h) => ({
      headline: cr(0.15,  0.272, 0.70, 0.068, w, h),
      name:     cr(0.15,  0.356, 0.70, 0.137, w, h),
      body:     cr(0.16,  0.528, 0.68, 0.127, w, h),
      signoff:  cr(0.23,  0.675, 0.54, 0.054, w, h),
    }),
    computeGptZoneInstructions: (w, h) => {
      const x1 = Math.round(0.15 * w);
      const x2 = Math.round(0.85 * w);
      const y1 = Math.round(0.20 * h);
      const y2 = Math.round(0.80 * h);
      return `The rectangle from (x: ${x1}-${x2}, y: ${y1}-${y2}) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns, no medallions, no wreaths. Only the soft cream wash. Decoration appears softly around all four edges of the canvas, fading inward toward the empty center. The vignette should feel atmospheric and delicate, not heavy or overloaded.`;
    },
    computeDecorationSampleZone: (w, h) => cr(0, 0, 0.15, 0.20, w, h),
    text_alignment: { headline: 'center', name: 'center', body: 'center', signoff: 'center' },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // banner_horizontal
  // Empty zone: x:6%-94%, y:22%-78%  →  at 1024×1024: (61,225)→(962,799)
  // Stack vertically centered inside the empty zone (height 574px)
  // headline(70) + 16 + name(140) + 36 + body(130) + 20 + signoff(55) = 467px
  // Stack starts at y≈279 (54px top padding inside empty zone)
  // ─────────────────────────────────────────────────────────────────────────
  banner_horizontal: {
    id: 'banner_horizontal',
    description: 'Decoration as horizontal bands at top and bottom; clean middle for text.',
    computeZones: (w, h) => ({
      headline: cr(0.10,  0.272, 0.80, 0.068, w, h),
      name:     cr(0.075, 0.356, 0.85, 0.137, w, h),
      body:     cr(0.15,  0.528, 0.70, 0.127, w, h),
      signoff:  cr(0.20,  0.675, 0.60, 0.054, w, h),
    }),
    computeGptZoneInstructions: (w, h) => {
      const x1 = Math.round(0.06 * w);
      const x2 = Math.round(0.94 * w);
      const y1 = Math.round(0.22 * h);
      const y2 = Math.round(0.78 * h);
      return `The rectangle from (x: ${x1}-${x2}, y: ${y1}-${y2}) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns, no lines. Only the soft cream wash. Decoration appears as horizontal bands across the top (y: 0-${y1}) and the bottom (y: ${y2}-${h}). The bands should feel like deliberate bookends — rich and full-bleed, not thin borders.`;
    },
    computeDecorationSampleZone: (w, h) => cr(0.06, 0, 0.88, 0.20, w, h),
    text_alignment: { headline: 'center', name: 'center', body: 'center', signoff: 'center' },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // hero_name_radial
  // Name: inner radial clear area (x:31%-69%, y:18%-32%)
  //   → at 1024×1024: (320,184)→(703,327)
  // Lower empty zone: x:8%-92%, y:36%-95%  →  at 1024×1024: (80,369)→(944,971)
  // Gap name→headline: ~83px (8.1%) ✓  headline→body: ~53px (5.2%) ✓
  // body→signoff: ~115px (11.2%) ✓  signoff bottom: y≈833, breathing room 191px ✓
  // ─────────────────────────────────────────────────────────────────────────
  hero_name_radial: {
    id: 'hero_name_radial',
    description: 'Recipient name is the radial centerpiece in the upper area; supporting text stacks below.',
    computeZones: (w, h) => ({
      headline: cr(0.10,  0.40,  0.80,  0.068, w, h),
      name:     cr(0.313, 0.18,  0.374, 0.14,  w, h),
      body:     cr(0.15,  0.52,  0.70,  0.127, w, h),
      signoff:  cr(0.20,  0.76,  0.60,  0.054, w, h),
    }),
    computeGptZoneInstructions: (w, h) => {
      const lx1 = Math.round(0.078 * w);
      const lx2 = Math.round(0.922 * w);
      const ly1 = Math.round(0.36  * h); // tightened from 0.456 — lower zone starts earlier
      const ly2 = Math.round(0.948 * h);
      const cx  = Math.round(0.500 * w);
      const cy  = Math.round(0.247 * h);
      const ix1 = Math.round(0.313 * w);
      const ix2 = Math.round(0.688 * w);
      const iy1 = Math.round(0.156 * h);
      const iy2 = Math.round(0.340 * h);
      return `The rectangle from (x: ${lx1}-${lx2}, y: ${ly1}-${ly2}) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns. Only the soft cream wash. In the upper area (y: 0-${ly1}), place a soft radial composition centered around (x: ${cx}, y: ${cy}): scattered light decorative accents radiating outward, with an inner clear area (x: ${ix1}-${ix2}, y: ${iy1}-${iy2}) that also remains empty for the recipient name to be overlaid later. Do NOT use heavy central elements, medallions, or wreaths — keep this layout airy and reverent of the central name space.`;
    },
    computeDecorationSampleZone: (w, h) => cr(0, 0, 0.28, 0.35, w, h),
    text_alignment: { headline: 'center', name: 'center', body: 'center', signoff: 'center' },
  },
};

// ── Slot-gap invariant ────────────────────────────────────────────────────────
// Warns if consecutive slots (sorted by y) have a vertical gap > 12% of canvas.
// Called from satori-render.ts after computeZones — catches future layout drift early.

const MAX_SLOT_GAP_FRACTION = 0.12;

export function validateSlotGaps(zones: LayoutZones, canvasH: number, layoutId: string): void {
  const slots = [
    { name: 'headline', rect: zones.headline },
    { name: 'name',     rect: zones.name },
    { name: 'body',     rect: zones.body },
    { name: 'signoff',  rect: zones.signoff },
  ].sort((a, b) => a.rect.y - b.rect.y);

  for (let i = 0; i < slots.length - 1; i++) {
    const current = slots[i];
    const next    = slots[i + 1];
    const gap = next.rect.y - (current.rect.y + current.rect.height);
    const gapFraction = gap / canvasH;
    if (gapFraction > MAX_SLOT_GAP_FRACTION) {
      console.warn(
        `[Layout ${layoutId}] Large gap detected between ${current.name} ` +
        `and ${next.name}: ${gap}px (${(gapFraction * 100).toFixed(1)}% of canvas)`
      );
    }
  }
}
