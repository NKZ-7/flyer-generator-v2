import { NextRequest } from 'next/server';
import { completeJob, failJob } from '@/lib/kv';
import type { DesignSpec, FlyerCopy } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { status, jobId, copy, design_spec, error } = body as {
    status: 'done' | 'error';
    jobId: string;
    copy?: FlyerCopy;
    design_spec?: DesignSpec; // n8n uses snake_case
    error?: string;
  };

  if (!jobId) {
    return Response.json({ error: 'Missing jobId' }, { status: 400 });
  }

  if (status === 'done' && copy && design_spec) {
    await completeJob(jobId, copy, design_spec);
  } else {
    await failJob(jobId, error ?? 'Unknown error from workflow');
  }

  return Response.json({ ok: true });
}
