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

export const LAYOUTS: Record<LayoutId, Layout> = {
  centered_framed: {
    id: 'centered_framed',
    description: 'Decorative elements frame all four edges; clean cream center for text.',
    computeZones: (w, h) => ({
      headline: rect(0.117, 0.091, 0.766, 0.065, w, h),
      name:     rect(0.117, 0.169, 0.766, 0.091, w, h),
      body:     rect(0.156, 0.286, 0.688, 0.286, w, h),
      signoff:  rect(0.117, 0.599, 0.766, 0.052, w, h),
    }),
    computeGptZoneInstructions: (w, h) => {
      const [x1, x2, y1, y2] = [Math.round(0.195*w), Math.round(0.805*w), Math.round(0.228*h), Math.round(0.772*h)];
      return `The rectangle from pixel coordinates (x: ${x1}-${x2}, y: ${y1}-${y2}) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns, no lines, no shapes. Only the soft cream wash. Decorative elements are welcome OUTSIDE this rectangle, framing the four edges of the canvas. Be creative with the framing decoration: vary placement, density, and motifs to feel intentional and balanced.`;
    },
    computeDecorationSampleZone: (w, h) => rect(0, 0, 0.117, 0.195, w, h),
    text_alignment: { headline: 'center', name: 'center', body: 'center', signoff: 'center' },
  },

  asymmetric_diagonal: {
    id: 'asymmetric_diagonal',
    description: 'Decoration in upper-right and lower-left corners; text in upper-left and lower-right zones.',
    computeZones: (w, h) => ({
      headline: rect(0.059, 0.078, 0.566, 0.059, w, h),
      name:     rect(0.059, 0.150, 0.566, 0.085, w, h),
      body:     rect(0.059, 0.260, 0.566, 0.273, w, h),
      signoff:  rect(0.059, 0.560, 0.566, 0.052, w, h),
    }),
    computeGptZoneInstructions: (w, h) => {
      const midX = Math.round(0.5 * w);
      const midY = Math.round(0.5 * h);
      return `Two empty rectangles must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns: (x: 0-${midX}, y: 0-${midY}) the upper-left zone, and (x: ${midX}-${w}, y: ${midY}-${h}) the lower-right zone. Only the soft cream wash in those zones. Place decoration freely in the upper-right zone (x: ${midX}-${w}, y: 0-${midY}) and the lower-left zone (x: 0-${midX}, y: ${midY}-${h}). Aim for a balanced diagonal flow.`;
    },
    computeDecorationSampleZone: (w, h) => rect(0.605, 0, 0.395, 0.260, w, h),
    text_alignment: { headline: 'left', name: 'left', body: 'left', signoff: 'left' },
  },

  top_heavy: {
    id: 'top_heavy',
    description: 'Decoration across the upper portion; clean lower area for text.',
    computeZones: (w, h) => ({
      headline: rect(0.078, 0.326, 0.844, 0.065, w, h),
      name:     rect(0.078, 0.404, 0.844, 0.091, w, h),
      body:     rect(0.078, 0.521, 0.844, 0.247, w, h),
      signoff:  rect(0.078, 0.794, 0.844, 0.052, w, h),
    }),
    computeGptZoneInstructions: (w, h) => {
      const [x1, x2, y1, y2] = [Math.round(0.078*w), Math.round(0.922*w), Math.round(0.378*h), Math.round(0.948*h)];
      return `The rectangle from (x: ${x1}-${x2}, y: ${y1}-${y2}) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns. Only the soft cream wash. Decoration belongs in the upper area (y: 0-${y1}), spreading across the top with rich detail that gradually fades downward toward the empty zone.`;
    },
    computeDecorationSampleZone: (w, h) => rect(0.078, 0, 0.844, 0.300, w, h),
    text_alignment: { headline: 'left', name: 'left', body: 'left', signoff: 'left' },
  },

  magazine_split: {
    id: 'magazine_split',
    description: 'Decoration on the right portion; text occupies the left portion.',
    computeZones: (w, h) => ({
      headline: rect(0.059, 0.104, 0.547, 0.059, w, h),
      name:     rect(0.059, 0.176, 0.547, 0.085, w, h),
      body:     rect(0.059, 0.286, 0.547, 0.273, w, h),
      signoff:  rect(0.059, 0.586, 0.547, 0.052, w, h),
    }),
    computeGptZoneInstructions: (w, h) => {
      const [x1, x2] = [Math.round(0.059*w), Math.round(0.566*w)];
      return `The rectangle from (x: ${x1}-${x2}, y: 0-${h}) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns. Only the soft cream wash. Decoration covers the right portion (x: ${x2}-${w}, y: 0-${h}) with full-bleed visual weight. Use this side to make a strong statement.`;
    },
    computeDecorationSampleZone: (w, h) => rect(0.605, 0, 0.395, 1.0, w, h),
    text_alignment: { headline: 'left', name: 'left', body: 'left', signoff: 'left' },
  },

  vignette_center: {
    id: 'vignette_center',
    description: 'Soft decoration fades inward from all edges; clean center for text.',
    computeZones: (w, h) => ({
      headline: rect(0.158, 0.130, 0.684, 0.059, w, h),
      name:     rect(0.158, 0.202, 0.684, 0.085, w, h),
      body:     rect(0.158, 0.313, 0.684, 0.247, w, h),
      signoff:  rect(0.158, 0.586, 0.684, 0.052, w, h),
    }),
    computeGptZoneInstructions: (w, h) => {
      const [x1, x2, y1, y2] = [Math.round(0.195*w), Math.round(0.805*w), Math.round(0.247*h), Math.round(0.753*h)];
      return `The rectangle from (x: ${x1}-${x2}, y: ${y1}-${y2}) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns, no medallions, no wreaths. Only the soft cream wash. Decoration appears softly around all four edges of the canvas, fading inward toward the empty center. The vignette should feel atmospheric, not heavy.`;
    },
    computeDecorationSampleZone: (w, h) => rect(0, 0, 0.146, 0.260, w, h),
    text_alignment: { headline: 'center', name: 'center', body: 'center', signoff: 'center' },
  },

  banner_horizontal: {
    id: 'banner_horizontal',
    description: 'Decoration as horizontal bands at top and bottom; clean middle for text.',
    computeZones: (w, h) => ({
      headline: rect(0.078, 0.247, 0.844, 0.059, w, h),
      name:     rect(0.078, 0.319, 0.844, 0.091, w, h),
      body:     rect(0.078, 0.443, 0.844, 0.234, w, h),
      signoff:  rect(0.078, 0.710, 0.844, 0.052, w, h),
    }),
    computeGptZoneInstructions: (w, h) => {
      const [x1, x2, y1, y2] = [Math.round(0.059*w), Math.round(0.941*w), Math.round(0.208*h), Math.round(0.792*h)];
      return `The rectangle from (x: ${x1}-${x2}, y: ${y1}-${y2}) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns, no lines. Only the soft cream wash. Decoration appears as horizontal bands across the top (y: 0-${y1}) and the bottom (y: ${y2}-${h}). The bands should feel like deliberate bookends.`;
    },
    computeDecorationSampleZone: (w, h) => rect(0, 0, 1.0, 0.195, w, h),
    text_alignment: { headline: 'center', name: 'center', body: 'center', signoff: 'center' },
  },

  hero_name_radial: {
    id: 'hero_name_radial',
    description: 'A reverent layout where the recipient name is the centerpiece, with a soft radial composition surrounding it. Best for celebratory cards with short names and short body text.',
    computeZones: (w, h) => ({
      headline: rect(0.078, 0.052, 0.844, 0.059, w, h),
      name:     rect(0.256, 0.130, 0.488, 0.091, w, h),
      body:     rect(0.078, 0.443, 0.844, 0.234, w, h),
      signoff:  rect(0.078, 0.716, 0.844, 0.052, w, h),
    }),
    computeGptZoneInstructions: (w, h) => {
      const [x1, x2, y1, y2] = [Math.round(0.078*w), Math.round(0.922*w), Math.round(0.456*h), Math.round(0.948*h)];
      const [cx, cy] = [Math.round(0.5*w), Math.round(0.247*h)];
      const [ix1, ix2, iy1, iy2] = [Math.round(0.313*w), Math.round(0.688*w), Math.round(0.156*h), Math.round(0.339*h)];
      return `The rectangle from (x: ${x1}-${x2}, y: ${y1}-${y2}) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns. Only the soft cream wash. In the upper area (y: 0-${y1}), place a soft radial composition centered around (x: ${cx}, y: ${cy}): scattered light decorative accents radiating outward, with an inner clear area (x: ${ix1}-${ix2}, y: ${iy1}-${iy2}) that also remains empty for the recipient name to be overlaid later. Do NOT use heavy central elements, medallions, or wreaths — keep this layout airy and reverent of the central name space.`;
    },
    computeDecorationSampleZone: (w, h) => rect(0, 0.247, 0.254, 0.195, w, h),
    text_alignment: { headline: 'center', name: 'center', body: 'center', signoff: 'center' },
  },
};
