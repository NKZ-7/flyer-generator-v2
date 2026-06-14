import { Redis } from '@upstash/redis';
import type { JobMeta, JobRender, FlyerCopy, DesignSpec, TemplateCopy, DesignBrief, FlyerCopyV2 } from './types';
import type { ThemeId } from './render/themes';
import { uploadCanvasToStorage } from './supabase/db';

let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url:                  process.env.UPSTASH_REDIS_REST_URL!,
      token:                process.env.UPSTASH_REDIS_REST_TOKEN!,
      enableAutoPipelining: false,
    });
  }
  return _redis;
}

const TTL = 3600; // 1 hour

// ── helpers ──────────────────────────────────────────────────────────────────

function metaKey(id: string)       { return `job:${id}:meta`; }
function renderKey(id: string)     { return `job:${id}:render`; }
function renderLockKey(id: string) { return `job:${id}:render-lock`; }
function canvasKey(id: string)     { return `job:${id}:canvas`; }

async function getJson<T>(key: string): Promise<T | null> {
  const raw = await getRedis().get<T | string>(key);
  if (raw === null || raw === undefined) return null;
  return typeof raw === 'string' ? (JSON.parse(raw) as T) : raw;
}

// ── job lifecycle ─────────────────────────────────────────────────────────────

export async function createJob(jobId: string, sessionKey?: string): Promise<void> {
  const meta: JobMeta = { status: 'pending', ...(sessionKey ? { sessionKey } : {}) };
  await getRedis().set(metaKey(jobId), JSON.stringify(meta), { ex: TTL });
  await getRedis().set(renderKey(jobId), JSON.stringify({ status: 'pending' } satisfies JobRender), { ex: TTL });
}

export async function getJobMeta(jobId: string): Promise<JobMeta | null> {
  return getJson<JobMeta>(metaKey(jobId));
}

export async function getJobRender(jobId: string): Promise<JobRender | null> {
  return getJson<JobRender>(renderKey(jobId));
}

export async function completeJob(
  jobId: string,
  templateId: string,
  copy: TemplateCopy,
  paletteIndex: number,
  dalleArtUrl?: string,
): Promise<void> {
  const meta: JobMeta = { status: 'done', templateId, copy, paletteIndex, dalleArtUrl };
  await getRedis().set(metaKey(jobId), JSON.stringify(meta), { ex: TTL });
}

export async function failJob(jobId: string, error: string): Promise<void> {
  const meta: JobMeta = { status: 'error', error };
  await getRedis().set(metaKey(jobId), JSON.stringify(meta), { ex: TTL });
}

/** Used by the photo compositing branch — Sharp has already produced the image,
 *  so we store it directly and mark render done to skip Satori. */
export async function completeJobComposite(
  jobId: string,
  legacyCopy: FlyerCopy,
  legacyDesignSpec: DesignSpec,
  legacyDallePrompt: string,
  prerenderedDataUrl: string,
): Promise<void> {
  const meta: JobMeta = { status: 'done', legacyCopy, legacyDesignSpec, legacyDallePrompt };
  const render: JobRender = { status: 'done', prerenderedDataUrl };
  await Promise.all([
    getRedis().set(metaKey(jobId), JSON.stringify(meta), { ex: TTL }),
    getRedis().set(renderKey(jobId), JSON.stringify(render), { ex: TTL }),
  ]);
}

export async function completeRender(jobId: string, dataUrl?: string): Promise<void> {
  const render: JobRender = {
    status: 'done',
    ...(dataUrl ? { prerenderedDataUrl: dataUrl } : {}),
  };
  await getRedis().set(renderKey(jobId), JSON.stringify(render), { ex: TTL });
}

/** Upload canvas (~3MB) to Supabase Storage (bypasses Redis 1MB per-value limit),
 *  then store only the public URL in Redis. */
export async function storeJobCanvas(jobId: string, base64: string): Promise<void> {
  const url = await uploadCanvasToStorage(jobId, base64);
  if (!url) throw new Error('Failed to upload canvas to Supabase Storage');
  await getRedis().set(canvasKey(jobId), url, { ex: TTL });
}

/** Fetch canvas from Supabase Storage via its public URL and return as base64. */
export async function getJobCanvas(jobId: string): Promise<string | null> {
  const url = await getRedis().get<string>(canvasKey(jobId));
  if (!url) return null;
  const res = await fetch(url);
  if (!res.ok) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer.toString('base64');
}

/** GPT-canvas path: store design brief + copy, mark canvas available. */
export async function completeJobGPTCanvas(
  jobId: string,
  designBrief: DesignBrief,
  copyV2: FlyerCopyV2,
  gptCanvasBase64: string,
): Promise<void> {
  await storeJobCanvas(jobId, gptCanvasBase64);
  const meta: JobMeta = { status: 'done', designBrief, copyV2, hasGptCanvas: true };
  await getRedis().set(metaKey(jobId), JSON.stringify(meta), { ex: TTL });
}

export async function failRender(jobId: string, error: string): Promise<void> {
  const render: JobRender = { status: 'error', error };
  await getRedis().set(renderKey(jobId), JSON.stringify(render), { ex: TTL });
}

const RENDER_LOCK_TTL = 45; // seconds — long enough for a full render

/** Returns true if lock was acquired (caller should render).
 *  Returns false if another request already holds the lock (caller should skip and return current state). */
export async function acquireRenderLock(jobId: string): Promise<boolean> {
  const result = await getRedis().set(renderLockKey(jobId), '1', { ex: RENDER_LOCK_TTL, nx: true });
  return result !== null;
}

// ── Per-job user identity (auth) ─────────────────────────────────────────────

export async function setJobUserId(jobId: string, userId: string): Promise<void> {
  await getRedis().set(`job:${jobId}:user`, userId, { ex: TTL });
}

export async function getJobUserId(jobId: string): Promise<string | null> {
  return getRedis().get<string>(`job:${jobId}:user`);
}

// ── Per-job form prefs (occasion/vibe/description for DB save) ────────────────

export interface JobPrefs {
  occasion?: string;
  vibe?: string;
  additionalContext?: string;
}

export async function setJobPrefs(jobId: string, prefs: JobPrefs): Promise<void> {
  await getRedis().set(`job:${jobId}:prefs`, JSON.stringify(prefs), { ex: TTL });
}

export async function getJobPrefs(jobId: string): Promise<JobPrefs | null> {
  return getJson<JobPrefs>(`job:${jobId}:prefs`);
}

// ── Card-saved flag (prevents duplicate Supabase writes) ─────────────────────

export async function markCardSaved(jobId: string): Promise<void> {
  await getRedis().set(`job:${jobId}:card_saved`, '1', { ex: TTL });
}

export async function isCardSaved(jobId: string): Promise<boolean> {
  const val = await getRedis().get(`job:${jobId}:card_saved`);
  return val !== null;
}

// ── Theme memory (session-level, 24h TTL keyed by hashed IP+date) ─────────────

/** Return the last ≤3 theme IDs used in this session, oldest-first. */
export async function getRecentThemes(sessionKey: string): Promise<ThemeId[]> {
  const raw = await getRedis().get(`theme_history:${sessionKey}`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw as string);
    return Array.isArray(parsed) ? (parsed.slice(0, 3) as ThemeId[]) : [];
  } catch {
    return [];
  }
}

/** Prepend theme to the session history; dedup, cap at 3, TTL 24h. */
export async function pushRecentTheme(sessionKey: string, theme: ThemeId): Promise<void> {
  const recent = await getRecentThemes(sessionKey);
  const updated = [theme, ...recent.filter(t => t !== theme)].slice(0, 3);
  await getRedis().set(
    `theme_history:${sessionKey}`,
    JSON.stringify(updated),
    { ex: 60 * 60 * 24 },
  );
}

// ── Pairing memory (session-level, 24h TTL keyed by hashed IP+date) ───────────

/** Return the last ≤3 typography pairing IDs used in this session, most-recent-first. */
export async function getRecentPairings(sessionKey: string): Promise<string[]> {
  const raw = await getRedis().get(`pairing_history:${sessionKey}`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw as string);
    return Array.isArray(parsed) ? (parsed.slice(0, 3) as string[]) : [];
  } catch {
    return [];
  }
}

/** Prepend pairing to the session history; dedup, cap at 3, TTL 24h. */
export async function pushRecentPairing(sessionKey: string, pairingId: string): Promise<void> {
  const recent = await getRecentPairings(sessionKey);
  const updated = [pairingId, ...recent.filter(p => p !== pairingId)].slice(0, 3);
  await getRedis().set(
    `pairing_history:${sessionKey}`,
    JSON.stringify(updated),
    { ex: 60 * 60 * 24 },
  );
}
