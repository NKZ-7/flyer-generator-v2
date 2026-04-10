import { NextRequest } from 'next/server';
import { createJob } from '@/lib/kv';
import { randomUUID } from 'crypto';
import type { FlyerPreferences } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { preferences: FlyerPreferences };
  const { preferences } = body;

  if (!preferences?.title) {
    return Response.json({ error: 'preferences.title is required' }, { status: 400 });
  }

  const jobId = randomUUID();

  // Derive callback URL from the incoming request's Host header.
  // No APP_URL env var needed — works on any deployment automatically.
  // Override with CALLBACK_BASE_URL for local dev (point at a Vercel preview).
  const host = request.headers.get('host')!;
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const callbackBase = process.env.CALLBACK_BASE_URL ?? `${proto}://${host}`;
  const callbackUrl = `${callbackBase}/api/flyer/callback`;

  // Create job in Redis before firing the webhook
  await createJob(jobId);

  const webhookUrl = process.env.N8N_WEBHOOK_URL!;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET ?? '11111';

  const webhookRes = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': webhookSecret,
    },
    body: JSON.stringify({ jobId, callbackUrl, preferences }),
  });

  if (!webhookRes.ok) {
    return Response.json({ error: 'Failed to trigger workflow' }, { status: 502 });
  }

  return Response.json({ jobId });
}
