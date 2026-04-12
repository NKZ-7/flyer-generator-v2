import { NextRequest } from 'next/server';
import { completeJob, completeJobComposite, failJob } from '@/lib/kv';
import type { DesignSpec, FlyerCopy } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { status, jobId, copy, design_spec, dalle_prompt, imageBase64, error } = body as {
    status: 'done' | 'error';
    jobId: string;
    copy?: FlyerCopy;
    design_spec?: DesignSpec;
    dalle_prompt?: string;
    imageBase64?: string;   // composite branch: Sharp-rendered PNG, skips Satori
    error?: string;
  };

  if (!jobId) {
    return Response.json({ error: 'Missing jobId' }, { status: 400 });
  }

  if (status === 'done' && copy && design_spec) {
    if (imageBase64) {
      // Photo compositing branch — store pre-rendered image, skip Satori
      const dataUrl = `data:image/png;base64,${imageBase64}`;
      await completeJobComposite(jobId, copy, design_spec, dalle_prompt ?? '', dataUrl);
    } else if (dalle_prompt) {
      // Standard branch — Satori renders on first status poll
      await completeJob(jobId, copy, design_spec, dalle_prompt);
    } else {
      await failJob(jobId, 'Callback missing dalle_prompt or imageBase64');
    }
  } else {
    await failJob(jobId, error ?? 'Unknown error from workflow');
  }

  return Response.json({ ok: true });
}
