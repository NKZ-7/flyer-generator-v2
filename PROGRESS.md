# FlyerCraft v2 — Hybrid GPT-Canvas + Satori Render Pipeline

Refactor complete. GPT-image-1 now generates a decoration-only canvas; Satori overlays all copy with color-sampled typography.

---

## Files Modified

- `lib/types.ts` — added LayoutId, TypographyPairingId, DesignBrief, FlyerCopyV2; updated JobMeta
- `lib/kv.ts` — added completeJobGPTCanvas, storeJobCanvas, getJobCanvas; updated completeRender to accept optional dataUrl
- `lib/satori-render.ts` — replaced with new GPT-canvas render pipeline (DesignBrief + FlyerCopyV2 signature)
- `app/api/flyer/callback/route.ts` — added GPT-canvas path detection and validation
- `app/api/flyer/status/[jobId]/route.ts` — added GPT-canvas on-demand render branch with Redis caching
- `app/api/flyer/render-hires/route.ts` — added GPT-canvas path for digital and print export
- `docs/n8n-redesign.md` — replaced with new text-free canvas workflow spec
- `.env.example` — updated with all current env vars

## Files Created

- `lib/render/layouts.ts` — 7 layout definitions with text zones and decoration sample zones
- `lib/render/typography.ts` — 6 typography pairings with font loading (cached per pairing)
- `lib/render/color-sampling.ts` — Sharp-based zone color extraction and text color harmonization
- `lib/template-render.ts` — preserved legacy template renderer (moved out of satori-render.ts)

## REVIEW Comments in Code

- `lib/template-render.ts:75` — Auto-fit uses char-count estimate, not true layout measurement
- `app/api/flyer/render-hires/route.ts:62` — bgColor should read from template palette in future
- `app/api/flyer/render-hires/route.ts:92` — Full-quality composite re-render at scale deferred (composite path)
- `app/api/flyer/render-hires/route.ts:112` — Full-quality composite re-render at scale deferred (composite path, print)

## Manual Steps Required

1. **Rebuild the n8n workflow** per `docs/n8n-redesign.md`:
   - Stage A: Claude generates copy + design_brief (with layoutId/typographyId)
   - Stage B: Build text-free GPT canvas prompt using gpt_zone_instructions lookup
   - Stage C: Call gpt-image-1 (size 1024x1536, quality low, NO response_format field)
   - Stage D: Claude Sonnet vision QA to verify canvas is text-free; regenerate once if needed
   - Stage E: POST callback with `{ designBrief, copy, gptCanvasBase64 }` (NOT imageBase64)

2. **Deactivate the old workflow** (`vYs4mThaWUUi7DXW`) before activating the new one.

3. **Test one card per occasion** to validate the full pipeline:
   - Birthday (warm) — should use hero_name_radial or centered_framed + warm_handwritten
   - Sympathy (elegant) — should use vignette_center + classical_elegant
   - Business (minimal) — should use magazine_split + minimal_swiss

4. **Verify Redis canvas key TTL** — canvas base64 stored with 1-hour TTL in `lib/kv.ts` (TTL constant).

5. **Generate Mood Reel examples** — deferred from this refactor; build once real canvases exist.

## Build & Lint Status

- `npm run build`: **PASS** — zero TypeScript errors, all 8 routes compiled
- `npm run lint`: **N/A** — no lint script in package.json; Next.js TypeScript check passed cleanly
