import { getJobMeta, getJobRender, getJobCanvas, completeRender, failRender, acquireRenderLock, getJobUserId, getJobPrefs, markCardSaved, isCardSaved, getJobPhoto } from '@/lib/kv';
import { renderFlyerToBase64 } from '@/lib/satori-render';
import { renderTemplateToBase64 } from '@/lib/template-render';
import type { DesignBrief, FlyerCopyV2 } from '@/lib/types';
import { insertCard, uploadCardImage } from '@/lib/supabase/db';

async function saveCardRecord(
  jobId: string,
  meta: { designBrief?: DesignBrief; copyV2?: FlyerCopyV2 },
  dataUrl: string,
): Promise<void> {
  if (await isCardSaved(jobId)) return;

  const userId = await getJobUserId(jobId);
  if (!userId) return; // anonymous — skip

  const prefs = await getJobPrefs(jobId);

  const imageUrl = await uploadCardImage(jobId, dataUrl);

  await insertCard({
    user_id: userId,
    title: meta.copyV2?.title ?? '',
    body: meta.copyV2?.body ?? '',
    signoff: meta.copyV2?.signoff ?? '',
    occasion: prefs?.occasion ?? null,
    vibe: prefs?.vibe ?? null,
    typography_id: meta.designBrief?.typographyId ?? null,
    theme_id: meta.designBrief?.decorative_theme ?? null,
    layout_id: meta.designBrief?.layoutId ?? null,
    focal_motif: meta.designBrief?.focal_motif ?? null,
    image_url: imageUrl,
    user_description: prefs?.additionalContext ?? null,
  });

  await markCardSaved(jobId);
}

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
    // Pre-rendered result available (composite path or cached GPT-canvas render)
    dataUrl = render.prerenderedDataUrl;

  } else if (meta.status === 'done' && meta.hasGptCanvas && meta.designBrief && meta.copyV2) {
    // GPT-canvas path: render on demand, cache result
    const locked = await acquireRenderLock(jobId);
    if (!locked) {
      // Another request is rendering — return current state; client re-polls in 3s
      return Response.json({ meta, render: render ?? { status: 'pending' } });
    }
    try {
      const canvasBase64 = await getJobCanvas(jobId);
      if (!canvasBase64) throw new Error('Canvas not found in Redis');

      // Load user photo if present (non-fatal — render proceeds without it on failure)
      let photoBase64: string | undefined;
      try {
        const jobPhoto = await getJobPhoto(jobId);
        if (jobPhoto?.base64) photoBase64 = jobPhoto.base64;
      } catch { /* non-fatal */ }

      dataUrl = await renderFlyerToBase64(meta.designBrief, meta.copyV2, canvasBase64, 1, false, photoBase64);
      await completeRender(jobId, dataUrl);
      render = { status: 'done', prerenderedDataUrl: dataUrl };

      // Save card to Supabase for authenticated users (non-fatal)
      saveCardRecord(jobId, meta, dataUrl).catch(err => {
        console.error('[status] saveCard failed (non-fatal):', err instanceof Error ? err.message : err);
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await failRender(jobId, errMsg);
      render = { status: 'error', error: errMsg };
    }

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
      return Response.json({ meta, render: render ?? { status: 'pending' } });
    }
    try {
      dataUrl = await renderTemplateToBase64(meta.templateId, meta.copy, meta.paletteIndex, 1, meta.dalleArtUrl);
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
