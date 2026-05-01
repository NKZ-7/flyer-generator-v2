import { NextRequest } from 'next/server';
import { completeJob, completeJobComposite, completeJobGPTCanvas, failJob, getJobMeta, pushRecentTheme } from '@/lib/kv';
import { loadTemplate, templateExists } from '@/lib/templates/index';
import { validateCopy } from '@/lib/validate-copy';
import type { DesignSpec, FlyerCopy, FlyerCopyV2, DesignBrief, TemplateCopy } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_LAYOUT_IDS = new Set<string>([
  'centered_framed', 'asymmetric_diagonal', 'top_heavy',
  'magazine_split', 'vignette_center', 'banner_horizontal', 'hero_name_radial',
]);

const VALID_TYPO_IDS = new Set<string>([
  'classical_elegant', 'modern_clean', 'bold_impact',
  'romantic_serif', 'warm_handwritten', 'minimal_swiss',
]);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    status,
    jobId,
    // GPT-canvas path fields (new)
    designBrief,
    copy: rawCopy,
    gptCanvasBase64,
    // Template path fields
    templateId,
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
    // GPT-canvas
    designBrief?: DesignBrief;
    copy?: FlyerCopyV2 | TemplateCopy;
    gptCanvasBase64?: string;
    // Template
    templateId?: string;
    paletteIndex?: number;
    dalle_art_url?: string;
    // Composite
    design_spec?: DesignSpec;
    dalle_prompt?: string;
    imageBase64?: string;
    error?: string;
  };

  if (!jobId) {
    return Response.json({ error: 'Missing jobId' }, { status: 400 });
  }

  if (status === 'done') {
    if (gptCanvasBase64) {
      // ── GPT-canvas path — n8n sends designBrief + copy (FlyerCopyV2 shape) + gptCanvasBase64 ──
      const copyV2 = rawCopy as FlyerCopyV2;
      if (
        !VALID_LAYOUT_IDS.has(designBrief?.layoutId ?? '') ||
        !VALID_TYPO_IDS.has(designBrief?.typographyId ?? '') ||
        !copyV2?.headline || !copyV2?.recipient_name || !copyV2?.body || !copyV2?.signoff
      ) {
        await failJob(jobId, 'GPT-canvas callback validation failed: missing or invalid fields');
        return Response.json({ ok: true });
      }

      // Read sessionKey before completeJobGPTCanvas overwrites the meta
      let sessionKey: string | undefined;
      try {
        const existing = await getJobMeta(jobId);
        sessionKey = existing?.sessionKey;
      } catch { /* non-fatal */ }

      await completeJobGPTCanvas(jobId, designBrief as DesignBrief, copyV2, gptCanvasBase64);

      // Record theme in session history (non-fatal)
      const theme = (designBrief as DesignBrief)?.decorative_theme;
      if (sessionKey && theme) {
        pushRecentTheme(sessionKey, theme).catch(() => { /* silent */ });
      }

    } else if (imageBase64) {
      // ── Composite path — n8n sends copy in 'copy' field ──
      const legacyCopy = rawCopy as unknown as FlyerCopy;
      if (!legacyCopy) {
        await failJob(jobId, 'Composite callback missing copy');
        return Response.json({ ok: true });
      }
      const dataUrl = `data:image/png;base64,${imageBase64}`;
      await completeJobComposite(jobId, legacyCopy, (design_spec ?? {}) as DesignSpec, dalle_prompt ?? '', dataUrl);

    } else if (templateId && rawCopy && paletteIndex !== undefined) {
      // ── Template path ──────────────────────────────────────────────────────
      const copy = rawCopy as TemplateCopy;
      if (!templateExists(templateId)) {
        await failJob(jobId, `Unknown template: ${templateId}`);
        return Response.json({ ok: true });
      }
      const validation = validateCopy(copy, loadTemplate(templateId));
      if (!validation.valid) {
        console.warn('[callback] Copy overflows slots:', validation.overflows);
        // Store anyway — renderer truncates at hard_max_chars
      }
      await completeJob(jobId, templateId, copy, paletteIndex, dalle_art_url);

    } else {
      await failJob(jobId, 'Callback missing required fields (gptCanvasBase64, templateId+copy+paletteIndex, or imageBase64)');
    }
  } else {
    await failJob(jobId, error ?? 'Unknown error from workflow');
  }

  return Response.json({ ok: true });
}
