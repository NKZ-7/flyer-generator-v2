import { NextRequest } from 'next/server';
import { createJob } from '@/lib/kv';
import { randomUUID } from 'crypto';
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

  const host = request.headers.get('host')!;
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const callbackBase = process.env.CALLBACK_BASE_URL ?? `${proto}://${host}`;
  const callbackUrl = `${callbackBase}/api/flyer/callback`;

  try {
    await createJob(jobId);
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
      body: JSON.stringify({ jobId, callbackUrl, preferences, userAssets, hasUserAssets }),
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
