export type CanvasFormat = 'square' | 'vertical';

export const CANVAS_DIMENSIONS: Record<CanvasFormat, { width: number; height: number }> = {
  square:   { width: 1024, height: 1024 },
  vertical: { width: 1024, height: 1536 },
};

export const DEFAULT_CANVAS_FORMAT: CanvasFormat = 'square';

/** Base font size (px) for the name slot at 1× scale. All sizeRatios multiply this. */
export const BASE_FONT_SIZE_PX = 88;

export const CONTRAST_RATIOS = {
  body_text:      4.5,
  large_headline: 3.0,
  signoff:        4.5,
};

export const AUTO_FIT = {
  max_iterations: 10,
  size_step_px:   2,
  min_size_ratio: 0.6,
};

export const TEXT_SHADOW = {
  offset_x:      0,
  offset_y:      2,
  opacity:       0.15,
  darken_amount: 0.30,
};

export const GRAIN_OVERLAY = {
  opacity:    0.04,
  blend_mode: 'overlay' as const,
};
