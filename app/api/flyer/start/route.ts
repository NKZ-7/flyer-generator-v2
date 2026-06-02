import { NextRequest } from 'next/server';
import { createJob, getRecentThemes, getRecentPairings, setJobUserId, setJobPrefs } from '@/lib/kv';
import {
  checkAnonymousLimit,
  checkSignedInLimit,
  ANONYMOUS_LIMIT,
  SIGNED_IN_LIMIT,
  ANONYMOUS_WINDOW_DAYS,
  SIGNED_IN_WINDOW_HOURS,
} from '@/lib/rate-limit';
import { randomUUID, createHash } from 'crypto';
import type { FlyerPreferences } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

export const runtime  = 'nodejs';
export const dynamic  = 'force-dynamic';
export const maxDuration = 30;

interface WireAsset {
  id:                    string;
  image:                 string;
  mimeType:              string;
  role:                  string;
  placement_instructions: string;
  original_filename:     string;
}

function buildAnonCookie(anonId: string, secure: boolean): string {
  const maxAge = 365 * 24 * 60 * 60;
  return `sendly_anon_id=${anonId}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    preferences:    FlyerPreferences;
    userAssets?:    WireAsset[];
    hasUserAssets?: boolean;
  };
  const { preferences, userAssets = [], hasUserAssets = false } = body;

  if (!preferences?.additionalContext) {
    return Response.json({ error: 'A description is required' }, { status: 400 });
  }

  const jobId = randomUUID();

  const ip        = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const dateSalt  = new Date().toISOString().slice(0, 10);
  const sessionKey = createHash('sha256').update(ip + dateSalt).digest('hex');

  const host        = request.headers.get('host')!;
  const proto       = host.startsWith('localhost') ? 'http' : 'https';
  const isProduction = !host.startsWith('localhost');
  const callbackBase = process.env.CALLBACK_BASE_URL ?? `${proto}://${host}`;
  const callbackUrl  = `${callbackBase}/api/flyer/callback`;

  // ── Auth — resolved before rate-limit so we can check signed-in limits ────────
  let userId: string | undefined;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  } catch { /* non-fatal — anonymous generation still works */ }

  // ── Anonymous identifier (cookie-first, IP fallback) ─────────────────────────
  let anonId     = request.cookies.get('sendly_anon_id')?.value ?? null;
  const isNewAnonId = !anonId;
  if (!anonId) anonId = randomUUID();

  // ── Rate limiting ─────────────────────────────────────────────────────────────
  const rateLimitLimit  = userId ? SIGNED_IN_LIMIT  : ANONYMOUS_LIMIT;
  const rateLimitReason = userId ? 'signed_in' : 'anonymous';
  // Fallback values used only when Redis is unavailable (fail-open path).
  const windowMs = userId
    ? SIGNED_IN_WINDOW_HOURS * 3_600_000
    : ANONYMOUS_WINDOW_DAYS  * 86_400_000;
  let rlRemaining = rateLimitLimit - 1;
  let rlReset     = new Date(Date.now() + windowMs);

  try {
    const rl = userId
      ? await checkSignedInLimit(userId)
      : await checkAnonymousLimit(anonId, ip);

    rlRemaining = rl.remaining;
    rlReset     = rl.resetAt;

    if (!rl.allowed) {
      const headers = new Headers({
        'Content-Type':        'application/json',
        'X-RateLimit-Limit':   String(rateLimitLimit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset':   rl.resetAt.toISOString(),
      });
      if (!userId && isNewAnonId) headers.append('Set-Cookie', buildAnonCookie(anonId, isProduction));

      return new Response(
        JSON.stringify({
          error:     'rate_limited',
          reason:    rateLimitReason,
          resetAt:   rl.resetAt.toISOString(),
          remaining: 0,
        }),
        { status: 429, headers },
      );
    }
  } catch (err) {
    // Fail open — a Redis outage must not block card generation.
    console.error('[rate-limit] check failed, proceeding open:', err instanceof Error ? err.message : err);
  }

  // ── Theme / pairing memory ────────────────────────────────────────────────────
  let recentThemes: string[] = [];
  try { recentThemes = await getRecentThemes(sessionKey); } catch { /* non-fatal */ }

  let recentPairings: string[] = [];
  try { recentPairings = await getRecentPairings(sessionKey); } catch { /* non-fatal */ }

  // ── Create Redis job ──────────────────────────────────────────────────────────
  try {
    await createJob(jobId, sessionKey);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Redis error: ${msg}` }, { status: 500 });
  }

  // Store user identity and form prefs for later Supabase card save (non-fatal).
  if (userId) setJobUserId(jobId, userId).catch(() => {});
  setJobPrefs(jobId, {
    occasion:          preferences.occasion,
    vibe:              preferences.vibe,
    additionalContext: preferences.additionalContext,
  }).catch(() => {});

  // ── Trigger n8n webhook ───────────────────────────────────────────────────────
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    return Response.json({ error: 'N8N_WEBHOOK_URL env var not set' }, { status: 500 });
  }
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET ?? '11111';

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 20_000);
  let webhookRes: Response;
  try {
    webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key':    webhookSecret,
      },
      body: JSON.stringify({ jobId, callbackUrl, preferences, userAssets, hasUserAssets, recentThemes, recentPairings }),
      signal: controller.signal,
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    const msg       = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: isTimeout ? 'Workflow trigger timed out — n8n may be unreachable' : `Webhook fetch error: ${msg}` },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!webhookRes.ok) {
    const text = await webhookRes.text().catch(() => '');
    return Response.json({ error: `Webhook ${webhookRes.status}: ${text.slice(0, 200)}` }, { status: 502 });
  }

  // ── Success — include rate-limit headers and set anonId cookie if new ─────────
  const responseHeaders = new Headers({
    'Content-Type':          'application/json',
    'X-RateLimit-Limit':     String(rateLimitLimit),
    'X-RateLimit-Remaining': String(rlRemaining),
    'X-RateLimit-Reset':     rlReset.toISOString(),
  });
  if (!userId && isNewAnonId) responseHeaders.append('Set-Cookie', buildAnonCookie(anonId, isProduction));

  return new Response(JSON.stringify({ jobId }), { status: 200, headers: responseHeaders });
}
