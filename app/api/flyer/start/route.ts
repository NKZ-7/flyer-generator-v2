import { NextRequest } from 'next/server';
import { createJob, getRecentThemes } from '@/lib/kv';
import { randomUUID, createHash } from 'crypto';
import type { FlyerPreferences } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface WireAsset {
  id: string;
  image: string;
  mimeType: string;
  role: string;
  placement_instructions: string;
  original_filename: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    preferences: FlyerPreferences;
    userAssets?: WireAsset[];
    hasUserAssets?: boolean;
  };
  const { preferences, userAssets = [], hasUserAssets = false } = body;

  if (!preferences?.title && !preferences?.additionalContext) {
    return Response.json({ error: 'A title or description is required' }, { status: 400 });
  }

  const jobId = randomUUID();

  // Session key: hashed (IP + daily date) — good enough for MVP theme memory.
  // NAT/shared IP is acceptable; false de-duplication is a minor cosmetic trade-off.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous';
  const dateSalt = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const sessionKey = createHash('sha256').update(ip + dateSalt).digest('hex');

  const host = request.headers.get('host')!;
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const callbackBase = process.env.CALLBACK_BASE_URL ?? `${proto}://${host}`;
  const callbackUrl = `${callbackBase}/api/flyer/callback`;

  let recentThemes: string[] = [];
  try {
    recentThemes = await getRecentThemes(sessionKey);
  } catch {
    // Theme memory is non-fatal — proceed without it
  }

  try {
    await createJob(jobId, sessionKey);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Redis error: ${msg}` }, { status: 500 });
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    return Response.json({ error: 'N8N_WEBHOOK_URL env var not set' }, { status: 500 });
  }

  const webhookSecret = process.env.N8N_WEBHOOK_SECRET ?? '11111';

  let webhookRes: Response;
  try {
    webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': webhookSecret,
      },
      body: JSON.stringify({ jobId, callbackUrl, preferences, userAssets, hasUserAssets, recentThemes }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Webhook fetch error: ${msg}` }, { status: 502 });
  }

  if (!webhookRes.ok) {
    const text = await webhookRes.text().catch(() => '');
    return Response.json({ error: `Webhook ${webhookRes.status}: ${text.slice(0, 200)}` }, { status: 502 });
  }

  return Response.json({ jobId });
}
