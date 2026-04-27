import { getJobMeta, getJobRender, completeRender, failRender, acquireRenderLock } from '@/lib/kv';
import { renderFlyerToBase64 } from '@/lib/satori-render';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Satori + Sharp takes ~8-15s; composite already pre-rendered

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

  if (meta.status === 'done' && render?.status === 'done' && render.prerenderedDataUrl) {
    // Composite branch: Sharp already produced the image — return it directly, skip Satori
    dataUrl = render.prerenderedDataUrl;

  } else if (
    meta.status === 'done' &&
    render?.status === 'pending' &&
    meta.templateId &&
    meta.copy &&
    meta.paletteIndex !== undefined // must use !== undefined — 0 is a valid palette index
  ) {
    // Template branch: Satori render — acquire lock so only one Lambda renders
    const locked = await acquireRenderLock(jobId);
    if (!locked) {
      // Another instance is already rendering — return current state; client re-polls in 3s
      return Response.json({ meta, render: render ?? { status: 'pending' } });
    }
    try {
      dataUrl = await renderFlyerToBase64(meta.templateId, meta.copy, meta.paletteIndex, 1, meta.dalleArtUrl);
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
