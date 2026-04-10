export const PRINT_SIZES: Record<string, { width: number; height: number }> = {
  A4: { width: 2480, height: 3508 },
  US_Letter: { width: 2550, height: 3300 },
  Square: { width: 3000, height: 3000 },
};

export const POLL_INTERVAL_MS = 3000;
export const JOB_TIMEOUT_MS = 180_000; // 3 min — Claude can take 60-90s
export const MAX_VERSION_HISTORY = 10;

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 1100;
