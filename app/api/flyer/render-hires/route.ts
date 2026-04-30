import { NextRequest } from 'next/server';
import { getJobMeta, getJobRender, getJobCanvas } from '@/lib/kv';
import { renderFlyerToBase64 } from '@/lib/satori-render';
import { renderTemplateToBase64 } from '@/lib/template-render';
import { DIGITAL_PRESETS, PRINT_PRESETS, mmToPx } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Satori + Sharp + bleed can take 30-45s at hi-res

function blobResponse(data: Buffer | Uint8Array, contentType: string, filename: string): Response {
  const ab = new ArrayBuffer(data.byteLength);
  new Uint8Array(ab).set(data);
  return new Response(new Blob([new Uint8Array(ab)], { type: contentType }), {
    headers: { 'Content-Disposition': `attachment; filename="${filename}"` },
  });
}

export async function POST(request: NextRequest) {
  const { jobId, preset, useCase } = (await request.json()) as {
    jobId: string;
    preset: string;
    useCase: 'digital' | 'print';
  };

  if (!jobId) return Response.json({ error: 'Missing jobId' }, { status: 400 });
  if (!preset) return Response.json({ error: 'Missing preset' }, { status: 400 });
  if (useCase !== 'digital' && useCase !== 'print') {
    return Response.json({ error: 'useCase must be "digital" or "print"' }, { status: 400 });
  }

  const meta = await getJobMeta(jobId);
  if (!meta || meta.status !== 'done') {
    return Response.json({ error: 'Job not ready or not found' }, { status: 404 });
  }
  if (!meta.templateId && !meta.legacyCopy && !meta.hasGptCanvas) {
    return Response.json({ error: 'Job not ready or not found' }, { status: 404 });
  }

  const sharp = (await import('sharp')).default;

  // ── DIGITAL EXPORT ────────────────────────────────────────────────────────
  if (useCase === 'digital') {
    const cfg = DIGITAL_PRESETS[preset as keyof typeof DIGITAL_PRESETS];
    if (!cfg) return Response.json({ error: `Unknown digital preset: ${preset}` }, { status: 400 });

    let dataUrl: string;

    if (meta.hasGptCanvas && meta.designBrief && meta.copyV2) {
      // ── GPT-canvas path ────────────────────────────────────────────────────
      const canvasBase64 = await getJobCanvas(jobId);
      if (!canvasBase64) return Response.json({ error: 'Canvas not available' }, { status: 404 });
      const scaleFactor = cfg.width / 1024;
      dataUrl = await renderFlyerToBase64(meta.designBrief, meta.copyV2, canvasBase64, scaleFactor);

    } else if (meta.templateId && meta.copy && meta.paletteIndex !== undefined) {
      // ── Template path ──────────────────────────────────────────────────────
      const { loadTemplate } = await import('@/lib/templates/index');
      const template = loadTemplate(meta.templateId);
      const scaleFactor = cfg.width / template.dimensions.width;
      dataUrl = await renderTemplateToBase64(meta.templateId, meta.copy, meta.paletteIndex, scaleFactor, meta.dalleArtUrl);

    } else {
      // ── Composite / legacy path ────────────────────────────────────────────
      // REVIEW: Full-quality composite re-render at scale is deferred — using pre-rendered image + Sharp resize
      const render = await getJobRender(jobId);
      if (!render?.prerenderedDataUrl) {
        return Response.json({ error: 'Hi-res export not available for this job' }, { status: 404 });
      }
      dataUrl = render.prerenderedDataUrl;
    }

    const pngBuffer = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');

    // REVIEW: bgColor should read from template palette in future
    const bgColor = '#FAEDE3';
    const fittedBuffer = await sharp(pngBuffer)
      .resize(cfg.width, cfg.height, { fit: 'contain', background: bgColor })
      .png()
      .toBuffer();

    if (cfg.format === 'jpg') {
      const jpgBuffer = await sharp(fittedBuffer).jpeg({ quality: 92 }).toBuffer();
      return blobResponse(jpgBuffer, 'image/jpeg', `flyer-${preset}.jpg`);
    }
    return blobResponse(fittedBuffer, 'image/png', `flyer-${preset}.png`);
  }

  // ── PRINT EXPORT ──────────────────────────────────────────────────────────
  const cfg = PRINT_PRESETS[preset as keyof typeof PRINT_PRESETS];
  if (!cfg) return Response.json({ error: `Unknown print preset: ${preset}` }, { status: 400 });

  const baseW = mmToPx(cfg.widthMm);
  const baseH = mmToPx(cfg.heightMm);
  const bleedPx = mmToPx(cfg.bleedMm);

  let dataUrl: string;

  if (meta.hasGptCanvas && meta.designBrief && meta.copyV2) {
    // ── GPT-canvas path ──────────────────────────────────────────────────────
    const canvasBase64 = await getJobCanvas(jobId);
    if (!canvasBase64) return Response.json({ error: 'Canvas not available' }, { status: 404 });
    const scaleFactor = baseW / 1024;
    dataUrl = await renderFlyerToBase64(meta.designBrief, meta.copyV2, canvasBase64, scaleFactor);

  } else if (meta.templateId && meta.copy && meta.paletteIndex !== undefined) {
    // ── Template path ──────────────────────────────────────────────────────
    const { loadTemplate } = await import('@/lib/templates/index');
    const template = loadTemplate(meta.templateId);
    const scaleFactor = baseW / template.dimensions.width;
    dataUrl = await renderTemplateToBase64(meta.templateId, meta.copy, meta.paletteIndex, scaleFactor, meta.dalleArtUrl);

  } else {
    // ── Composite / legacy path ────────────────────────────────────────────
    // REVIEW: Full-quality composite re-render at scale is deferred — using pre-rendered image + Sharp resize
    const render = await getJobRender(jobId);
    if (!render?.prerenderedDataUrl) {
      return Response.json({ error: 'Hi-res export not available for this job' }, { status: 404 });
    }
    dataUrl = render.prerenderedDataUrl;
  }

  const pngBuffer = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');

  const withBleed = await sharp(pngBuffer)
    .extend({ top: bleedPx, bottom: bleedPx, left: bleedPx, right: bleedPx, extendWith: 'copy' })
    .resize(baseW + 2 * bleedPx, baseH + 2 * bleedPx)
    .png()
    .toBuffer();

  const { PDFDocument } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(new Uint8Array(withBleed));
  const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
  page.drawImage(pngImage, { x: 0, y: 0, width: pngImage.width, height: pngImage.height });
  const pdfBytes = await pdfDoc.save();

  return blobResponse(pdfBytes, 'application/pdf', `flyer-${preset}.pdf`);
}
