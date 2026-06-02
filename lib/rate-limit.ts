import { Redis } from '@upstash/redis';
import { randomUUID } from 'crypto';

// ── Tunable constants ─────────────────────────────────────────────────────────
export const ANONYMOUS_LIMIT        = 4;
export const ANONYMOUS_WINDOW_DAYS  = 3;
export const SIGNED_IN_LIMIT        = 20;
export const SIGNED_IN_WINDOW_HOURS = 24;

const ANON_WINDOW_MS   = ANONYMOUS_WINDOW_DAYS  * 24 * 60 * 60 * 1000;
const ANON_TTL_SECS    = ANONYMOUS_WINDOW_DAYS  * 24 * 60 * 60;
const SIGNED_WINDOW_MS = SIGNED_IN_WINDOW_HOURS * 60 * 60 * 1000;
const SIGNED_TTL_SECS  = SIGNED_IN_WINDOW_HOURS * 60 * 60;

// ── Redis client (shared singleton) ──────────────────────────────────────────

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

// ── Return type ───────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed:   boolean;
  remaining: number;
  resetAt:   Date;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Returns the Date when the oldest entry in `key` will age out of the window.
async function oldestResetAt(
  redis: Redis,
  key: string,
  now: number,
  windowMs: number,
): Promise<Date> {
  const members = await redis.zrange<string[]>(key, 0, 0);
  if (!members.length) return new Date(now + windowMs);
  const score = await redis.zscore(key, members[0]);
  return new Date(Number(score ?? now) + windowMs);
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Check (and record) a card generation for an anonymous user.
 *  Denied if either the cookie-based anonId key OR the IP key is at the limit.
 *  Uses sequential REST calls — no pipeline, no eval — to stay compatible with
 *  all Upstash Redis plan tiers and SDK versions. */
export async function checkAnonymousLimit(anonId: string, ip: string): Promise<RateLimitResult> {
  const redis = getRedis();
  const now         = Date.now();
  const windowStart = now - ANON_WINDOW_MS;
  const key1 = `rl:anon:${anonId}`;
  const key2 = `rl:ip:${ip}`;

  // Evict expired entries, then count what remains.
  await redis.zremrangebyscore(key1, '-inf', windowStart);
  await redis.zremrangebyscore(key2, '-inf', windowStart);
  const c1 = Number(await redis.zcard(key1));
  const c2 = Number(await redis.zcard(key2));
  const maxCount = Math.max(c1, c2);

  if (maxCount >= ANONYMOUS_LIMIT) {
    const blockingKey = c2 >= ANONYMOUS_LIMIT ? key2 : key1;
    return {
      allowed:   false,
      remaining: 0,
      resetAt:   await oldestResetAt(redis, blockingKey, now, ANON_WINDOW_MS),
    };
  }

  // Record this generation in both sets so cookie-clearing users are still
  // caught by the IP set, and shared-IP users are still caught by the cookie set.
  const member = randomUUID();
  await redis.zadd(key1, { score: now, member });
  await redis.zadd(key2, { score: now, member });
  await redis.expire(key1, ANON_TTL_SECS);
  await redis.expire(key2, ANON_TTL_SECS);

  return {
    allowed:   true,
    remaining: ANONYMOUS_LIMIT - maxCount - 1,
    resetAt:   await oldestResetAt(redis, key1, now, ANON_WINDOW_MS),
  };
}

/** Check (and record) a card generation for a signed-in user. */
export async function checkSignedInLimit(userId: string): Promise<RateLimitResult> {
  const redis = getRedis();
  const now         = Date.now();
  const windowStart = now - SIGNED_WINDOW_MS;
  const key = `rl:user:${userId}`;

  await redis.zremrangebyscore(key, '-inf', windowStart);
  const count = Number(await redis.zcard(key));

  if (count >= SIGNED_IN_LIMIT) {
    return {
      allowed:   false,
      remaining: 0,
      resetAt:   await oldestResetAt(redis, key, now, SIGNED_WINDOW_MS),
    };
  }

  await redis.zadd(key, { score: now, member: randomUUID() });
  await redis.expire(key, SIGNED_TTL_SECS);

  return {
    allowed:   true,
    remaining: SIGNED_IN_LIMIT - count - 1,
    resetAt:   await oldestResetAt(redis, key, now, SIGNED_WINDOW_MS),
  };
}
