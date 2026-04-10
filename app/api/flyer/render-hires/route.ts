import { NextRequest } from 'next/server';
import { getJobMeta } from '@/lib/kv';
import { renderFlyerToBase64 } from '@/lib/satori-render';
import { DIGITAL_PRESETS, PRINT_PRESETS, mmToPx } from '@/lib/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // OpenAI + Satori + Sharp + bleed can take 30-45s

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
  if (!meta || meta.status !== 'done' || !meta.designSpec) {
    return Response.json({ error: 'Job not ready or not found' }, { status: 404 });
  }

  const sharp = (await import('sharp')).default;

  // ── DIGITAL EXPORT ────────────────────────────────────────────────────────
  if (useCase === 'digital') {
    const cfg = DIGITAL_PRESETS[preset as keyof typeof DIGITAL_PRESETS];
    if (!cfg) return Response.json({ error: `Unknown digital preset: ${preset}` }, { status: 400 });

    const scaleFactor = cfg.width / meta.designSpec.width;
    const dataUrl = await renderFlyerToBase64(meta.designSpec, scaleFactor, meta.dallePrompt ?? undefined);
    const pngBuffer = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');

    // fit: 'contain' + background fill preserves all content for landscape exports
    // (Facebook Event Cover 1920×1005 and Email Banner 1200×628 are landscape —
    // using 'cover' would crop important text)
    const bgColor = meta.designSpec.background.color ?? '#1a1a2e';
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
  const scaleFactor = baseW / meta.designSpec.width;

  // Render content area at print resolution (calls OpenAI for background)
  const dataUrl = await renderFlyerToBase64(meta.designSpec, scaleFactor, meta.dallePrompt ?? undefined);
  const pngBuffer = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');

  // Add 3mm bleed by replicating edge pixels outward.
  // extendWith: 'copy' avoids re-calling OpenAI and looks natural for photographic backgrounds.
  // Sharp 0.34.5 supports this option. Final dimensions: baseW+2*bleedPx × baseH+2*bleedPx
  const withBleed = await sharp(pngBuffer)
    .extend({
      top: bleedPx,
      bottom: bleedPx,
      left: bleedPx,
      right: bleedPx,
      extendWith: 'copy',
    })
    .png()
    .toBuffer();

  // Verify dimensions for debugging
  const { width: finalW, height: finalH } = await sharp(withBleed).metadata();
  void finalW; void finalH; // suppress unused var warning

  // Wrap in PDF
  const { PDFDocument } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(new Uint8Array(withBleed));
  const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
  page.drawImage(pngImage, { x: 0, y: 0, width: pngImage.width, height: pngImage.height });
  const pdfBytes = await pdfDoc.save();

  return blobResponse(pdfBytes, 'application/pdf', `flyer-${preset}.pdf`);
}
