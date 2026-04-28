import { NextRequest } from 'next/server';
import { completeJob, completeJobComposite, failJob } from '@/lib/kv';
import { loadTemplate, templateExists } from '@/lib/templates/index';
import { validateCopy } from '@/lib/validate-copy';
import type { DesignSpec, FlyerCopy, TemplateCopy } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    status,
    jobId,
    // Template path fields
    templateId,
    copy,
    paletteIndex,
    dalle_art_url,
    // Composite/legacy path fields
    design_spec,
    dalle_prompt,
    imageBase64,
    error,
  } = body as {
    status: 'done' | 'error';
    jobId: string;
    templateId?: string;
    copy?: TemplateCopy;
    paletteIndex?: number;
    dalle_art_url?: string;
    design_spec?: DesignSpec;
    dalle_prompt?: string;
    imageBase64?: string;
    error?: string;
  };

  if (!jobId) {
    return Response.json({ error: 'Missing jobId' }, { status: 400 });
  }

  if (status === 'done') {
    if (imageBase64) {
      // ── Composite path — n8n sends copy in 'copy' field (3-field shape from text-in-image arch) ──
      const legacyCopy = copy as unknown as FlyerCopy;
      if (!legacyCopy) {
        await failJob(jobId, 'Composite callback missing copy');
        return Response.json({ ok: true });
      }
      const dataUrl = `data:image/png;base64,${imageBase64}`;
      await completeJobComposite(jobId, legacyCopy, (design_spec ?? {}) as DesignSpec, dalle_prompt ?? '', dataUrl);

    } else if (templateId && copy && paletteIndex !== undefined) {
      // ── Template path ──────────────────────────────────────────────────────
      if (!templateExists(templateId)) {
        await failJob(jobId, `Unknown template: ${templateId}`);
        return Response.json({ ok: true });
      }
      const validation = validateCopy(copy, loadTemplate(templateId));
      if (!validation.valid) {
        console.warn('[callback] Copy overflows slots:', validation.overflows);
        // Store anyway — n8n is responsible for retries; renderer truncates at hard_max_chars
      }
      await completeJob(jobId, templateId, copy, paletteIndex, dalle_art_url);

    } else {
      await failJob(jobId, 'Callback missing required fields (templateId+copy+paletteIndex or imageBase64)');
    }
  } else {
    await failJob(jobId, error ?? 'Unknown error from workflow');
  }

  return Response.json({ ok: true });
}
