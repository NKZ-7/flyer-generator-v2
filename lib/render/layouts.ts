import type { LayoutId } from '../types';

export type Rect = { x: number; y: number; width: number; height: number };
export type Align = 'left' | 'center' | 'right';

export type Layout = {
  id: LayoutId;
  description: string;
  gpt_zone_instructions: string;
  text_zones: { headline: Rect; name: Rect; body: Rect; signoff: Rect };
  text_alignment: { headline: Align; name: Align; body: Align; signoff: Align };
  /** Known decorated area — sampled to extract accent color. */
  decoration_sample_zone: Rect;
};

export const LAYOUTS: Record<LayoutId, Layout> = {
  centered_framed: {
    id: 'centered_framed',
    description: 'Decorative frame around all four edges; clean cream center for text.',
    gpt_zone_instructions:
      'Place decorative elements as a frame around all four edges of the canvas (occupying roughly the outer 12% on each side). Leave the center area (approximately 60% wide × 70% tall) completely empty with a soft cream wash. No decoration intrudes into the central area. The frame should feel deliberate and balanced.',
    text_zones: {
      headline: { x: 120, y: 140,  width: 784, height: 100 },
      name:     { x: 120, y: 260,  width: 784, height: 140 },
      body:     { x: 160, y: 440,  width: 704, height: 440 },
      signoff:  { x: 120, y: 920,  width: 784, height: 80  },
    },
    text_alignment: { headline: 'center', name: 'center', body: 'center', signoff: 'center' },
    decoration_sample_zone: { x: 0, y: 0, width: 120, height: 300 },
  },

  asymmetric_diagonal: {
    id: 'asymmetric_diagonal',
    description: 'Dense decoration in upper-right and lower-left corners; text in upper-left and lower-right zones.',
    gpt_zone_instructions:
      'Place dense decorative elements in the upper-right corner and lower-left corner, occupying roughly 35% of the canvas total. Leave the upper-left and lower-right zones empty with a soft cream wash. The diagonal flow from upper-left to lower-right should feel intentional.',
    text_zones: {
      headline: { x: 60,  y: 120, width: 580, height: 90  },
      name:     { x: 60,  y: 230, width: 580, height: 130 },
      body:     { x: 60,  y: 400, width: 580, height: 420 },
      signoff:  { x: 60,  y: 860, width: 580, height: 80  },
    },
    text_alignment: { headline: 'left', name: 'left', body: 'left', signoff: 'left' },
    decoration_sample_zone: { x: 620, y: 0, width: 404, height: 400 },
  },

  top_heavy: {
    id: 'top_heavy',
    description: 'Rich decoration across the upper third; clean lower two-thirds for text.',
    gpt_zone_instructions:
      'Place rich decorative elements across the upper third of the canvas, gradually fading downward. Leave the lower two-thirds empty with a soft cream wash. The transition between decoration and clean space should feel natural, like a gradient.',
    text_zones: {
      headline: { x: 80,  y: 500,  width: 864, height: 100 },
      name:     { x: 80,  y: 620,  width: 864, height: 140 },
      body:     { x: 80,  y: 800,  width: 864, height: 380 },
      signoff:  { x: 80,  y: 1220, width: 864, height: 80  },
    },
    text_alignment: { headline: 'left', name: 'left', body: 'left', signoff: 'left' },
    decoration_sample_zone: { x: 80, y: 0, width: 864, height: 460 },
  },

  magazine_split: {
    id: 'magazine_split',
    description: 'Dense decoration on the right 40%; text occupies the left 60%.',
    gpt_zone_instructions:
      'Place dense decorative elements covering the right 40% of the canvas (full height). Leave the left 60% empty with a soft cream wash. The split between decorated and clean zones should feel deliberate, like a magazine cover layout.',
    text_zones: {
      headline: { x: 60,  y: 160, width: 560, height: 90  },
      name:     { x: 60,  y: 270, width: 560, height: 130 },
      body:     { x: 60,  y: 440, width: 560, height: 420 },
      signoff:  { x: 60,  y: 900, width: 560, height: 80  },
    },
    text_alignment: { headline: 'left', name: 'left', body: 'left', signoff: 'left' },
    decoration_sample_zone: { x: 620, y: 0, width: 404, height: 1536 },
  },

  vignette_center: {
    id: 'vignette_center',
    description: 'Soft vignette decoration inward from all edges; clean center 50%×60% for text.',
    gpt_zone_instructions:
      'Place decorative elements softly around all edges of the canvas, fading inward. Leave the center 50% × 60% area completely empty with a soft cream wash. The decoration vignettes inward like a soft frame.',
    text_zones: {
      headline: { x: 162, y: 200, width: 700, height: 90  },
      name:     { x: 162, y: 310, width: 700, height: 130 },
      body:     { x: 162, y: 480, width: 700, height: 380 },
      signoff:  { x: 162, y: 900, width: 700, height: 80  },
    },
    text_alignment: { headline: 'center', name: 'center', body: 'center', signoff: 'center' },
    decoration_sample_zone: { x: 0, y: 0, width: 150, height: 400 },
  },

  banner_horizontal: {
    id: 'banner_horizontal',
    description: 'Decorative bands at top 20% and bottom 20%; clean middle 60% for text.',
    gpt_zone_instructions:
      'Place decorative elements as horizontal bands across the top 20% and bottom 20% of the canvas. Leave the middle 60% empty with a soft cream wash. The bands should feel like bookends to the central clean zone.',
    text_zones: {
      headline: { x: 80,  y: 380,  width: 864, height: 90  },
      name:     { x: 80,  y: 490,  width: 864, height: 140 },
      body:     { x: 80,  y: 680,  width: 864, height: 360 },
      signoff:  { x: 80,  y: 1090, width: 864, height: 80  },
    },
    text_alignment: { headline: 'center', name: 'center', body: 'center', signoff: 'center' },
    decoration_sample_zone: { x: 0, y: 0, width: 1024, height: 300 },
  },

  hero_name_radial: {
    id: 'hero_name_radial',
    description: 'Bold central medallion in upper half; scattered accents; clean lower half for body text.',
    gpt_zone_instructions:
      'Place a bold central decorative element (medallion, wreath, or organic radial shape) in the center-top third, sized so its inner clear area is about 40% wide × 25% tall. Surrounding the medallion, place small scattered decorative accents. Leave a clean cream lower half for body text.',
    text_zones: {
      headline: { x: 80,  y: 80,   width: 864, height: 90  },
      name:     { x: 262, y: 200,  width: 500, height: 140 },
      body:     { x: 80,  y: 680,  width: 864, height: 360 },
      signoff:  { x: 80,  y: 1100, width: 864, height: 80  },
    },
    text_alignment: { headline: 'center', name: 'center', body: 'center', signoff: 'center' },
    decoration_sample_zone: { x: 0, y: 380, width: 260, height: 300 },
  },
};
