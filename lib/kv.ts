import { Redis } from '@upstash/redis';
import type { JobMeta, JobRender, FlyerCopy, DesignSpec, TemplateCopy } from './types';

let _redis: Redis | null = null;
function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return _redis;
}

const TTL = 3600; // 1 hour

// ── helpers ──────────────────────────────────────────────────────────────────

function metaKey(id: string) { return `job:${id}:meta`; }
function renderKey(id: string) { return `job:${id}:render`; }
function renderLockKey(id: string) { return `job:${id}:render-lock`; }

async function getJson<T>(key: string): Promise<T | null> {
  const raw = await getRedis().get<T | string>(key);
  if (raw === null || raw === undefined) return null;
  return typeof raw === 'string' ? (JSON.parse(raw) as T) : raw;
}

// ── job lifecycle ─────────────────────────────────────────────────────────────

export async function createJob(jobId: string): Promise<void> {
  await Promise.all([
    getRedis().set(metaKey(jobId), JSON.stringify({ status: 'pending' } satisfies JobMeta), { ex: TTL }),
    getRedis().set(renderKey(jobId), JSON.stringify({ status: 'pending' } satisfies JobRender), { ex: TTL }),
  ]);
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

export async function completeRender(jobId: string): Promise<void> {
  const render: JobRender = { status: 'done' };
  await getRedis().set(renderKey(jobId), JSON.stringify(render), { ex: TTL });
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
