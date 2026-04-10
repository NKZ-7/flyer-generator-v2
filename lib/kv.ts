import { Redis } from '@upstash/redis';
import type { JobMeta, JobRender, FlyerCopy, DesignSpec } from './types';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const TTL = 3600; // 1 hour

// ── helpers ──────────────────────────────────────────────────────────────────

function metaKey(id: string) { return `job:${id}:meta`; }
function renderKey(id: string) { return `job:${id}:render`; }

async function getJson<T>(key: string): Promise<T | null> {
  const raw = await redis.get<T | string>(key);
  if (raw === null || raw === undefined) return null;
  return typeof raw === 'string' ? (JSON.parse(raw) as T) : raw;
}

// ── job lifecycle ─────────────────────────────────────────────────────────────

export async function createJob(jobId: string): Promise<void> {
  await Promise.all([
    redis.set(metaKey(jobId), JSON.stringify({ status: 'pending' } satisfies JobMeta), { ex: TTL }),
    redis.set(renderKey(jobId), JSON.stringify({ status: 'pending' } satisfies JobRender), { ex: TTL }),
  ]);
}

export async function getJobMeta(jobId: string): Promise<JobMeta | null> {
  return getJson<JobMeta>(metaKey(jobId));
}

export async function getJobRender(jobId: string): Promise<JobRender | null> {
  return getJson<JobRender>(renderKey(jobId));
}

export async function completeJob(jobId: string, copy: FlyerCopy, designSpec: DesignSpec): Promise<void> {
  const meta: JobMeta = { status: 'done', copy, designSpec };
  await redis.set(metaKey(jobId), JSON.stringify(meta), { ex: TTL });
}

export async function failJob(jobId: string, error: string): Promise<void> {
  const meta: JobMeta = { status: 'error', error };
  await redis.set(metaKey(jobId), JSON.stringify(meta), { ex: TTL });
}

export async function completeRender(jobId: string): Promise<void> {
  const render: JobRender = { status: 'done' };
  await redis.set(renderKey(jobId), JSON.stringify(render), { ex: TTL });
}

export async function failRender(jobId: string, error: string): Promise<void> {
  const render: JobRender = { status: 'error', error };
  await redis.set(renderKey(jobId), JSON.stringify(render), { ex: TTL });
}
