import { NextRequest } from 'next/server';
import { getJobMeta } from '@/lib/kv';
import { renderFlyerToBase64 } from '@/lib/satori-render';
import { PRINT_SIZES } from '@/lib/constants';
import type { DownloadFormat } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60; // print-res renders can take 10-15s

function blobResponse(data: Buffer | Uint8Array, contentType: string, filename: string): Response {
  // Copy into a fresh ArrayBuffer so TypeScript's strict BlobPart check passes.
  // Buffer<ArrayBufferLike> is incompatible with BlobPart in TS 5+.
  const ab = new ArrayBuffer(data.byteLength);
  new Uint8Array(ab).set(data);
  return new Response(new Blob([new Uint8Array(ab)], { type: contentType }), {
    headers: { 'Content-Disposition': `attachment; filename="${filename}"` },
  });
}

export async function POST(request: NextRequest) {
  const { jobId, format = 'png', size = 'A4' } = (await request.json()) as {
    jobId: string;
    format?: DownloadFormat;
    size?: string;
  };

  if (!jobId) {
    return Response.json({ error: 'Missing jobId' }, { status: 400 });
  }

  const meta = await getJobMeta(jobId);
  if (!meta || meta.status !== 'done' || !meta.designSpec) {
    return Response.json({ error: 'Job not ready or not found' }, { status: 404 });
  }

  const printSize = PRINT_SIZES[size] ?? PRINT_SIZES['A4'];
  const scaleFactor = printSize.width / meta.designSpec.width;

  const dataUrl = await renderFlyerToBase64(meta.designSpec, scaleFactor);
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  const pngBuffer = Buffer.from(base64, 'base64');

  if (format === 'jpg') {
    const sharp = (await import('sharp')).default;
    const jpgBuffer = await sharp(pngBuffer).jpeg({ quality: 92 }).toBuffer();
    return blobResponse(jpgBuffer, 'image/jpeg', 'flyer.jpg');
  }

  if (format === 'pdf') {
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    const pngImage = await pdfDoc.embedPng(new Uint8Array(pngBuffer));
    const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
    page.drawImage(pngImage, { x: 0, y: 0, width: pngImage.width, height: pngImage.height });
    const pdfBytes = await pdfDoc.save();
    return blobResponse(pdfBytes, 'application/pdf', 'flyer.pdf');
  }

  return blobResponse(pngBuffer, 'image/png', 'flyer.png');
}
