import { getJobMeta, getJobRender, completeRender, failRender } from '@/lib/kv';
import { renderFlyerToBase64 } from '@/lib/satori-render';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Satori render takes 2-5s; well within 30s limit

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;

  const meta = await getJobMeta(jobId);
  if (!meta) {
    return Response.json({ error: 'Job not found' }, { status: 404 });
  }

  let render = await getJobRender(jobId);
  let dataUrl: string | undefined;

  // Synchronous render — triggered exactly once: when n8n is done but render hasn't run yet.
  // We render here (blocking) rather than fire-and-forget to avoid Vercel killing the function
  // before the render completes.
  if (meta.status === 'done' && render?.status === 'pending' && meta.designSpec) {
    try {
      dataUrl = await renderFlyerToBase64(meta.designSpec);
      await completeRender(jobId);
      render = { status: 'done' };
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await failRender(jobId, errMsg);
      render = { status: 'error', error: errMsg };
    }
  }

  return Response.json({ meta, render: render ?? { status: 'pending' }, dataUrl });
}
