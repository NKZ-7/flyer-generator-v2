export const POLL_INTERVAL_MS = 3000;
export const JOB_TIMEOUT_MS = 180_000; // 3 min — Claude can take 60-90s
export const MAX_VERSION_HISTORY = 10;

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 1100;

// ── Digital export presets ──────────────────────────────────────────────────
export const DIGITAL_PRESETS = {
  social: {
    label: 'Social Media Post',
    desc: 'Instagram, Facebook, X, LinkedIn',
    width: 1080,
    height: 1080,
    format: 'jpg' as const,
  },
  story: {
    label: 'WhatsApp Status / IG Story',
    desc: 'Full screen vertical',
    width: 1080,
    height: 1920,
    format: 'jpg' as const,
  },
  'facebook-event': {
    label: 'Facebook Event Cover',
    desc: 'Wide banner for events',
    width: 1920,
    height: 1005,
    format: 'jpg' as const,
  },
} satisfies Record<
  string,
  { label: string; desc: string; width: number; height: number; format: 'jpg' | 'png' }
>;

// ── Print export presets (all PDF, 300 DPI, 3mm bleed) ─────────────────────
export const PRINT_PRESETS = {
  a5: {
    label: 'A5 — Handbill',
    desc: 'Small flyer, cheapest to print in bulk',
    widthMm: 148,
    heightMm: 210,
    bleedMm: 3,
  },
  a4: {
    label: 'A4 — Standard Flyer',
    desc: 'Standard paper size, most common',
    widthMm: 210,
    heightMm: 297,
    bleedMm: 3,
  },
  a3: {
    label: 'A3 — Poster',
    desc: 'Large format for walls and notice boards',
    widthMm: 297,
    heightMm: 420,
    bleedMm: 3,
  },
} satisfies Record<
  string,
  { label: string; desc: string; widthMm: number; heightMm: number; bleedMm: number }
>;

export const PRINT_DPI = 300;

/** Convert millimetres to pixels at the given DPI (default 300). */
export function mmToPx(mm: number, dpi = PRINT_DPI): number {
  return Math.round((mm / 25.4) * dpi);
}
