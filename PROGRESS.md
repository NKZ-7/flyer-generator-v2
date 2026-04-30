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

---

## Quality Fixes — Round 1 (post Ada birthday test)

**Problem:** First real-world test revealed: (1) Adinkra/kente cultural assumption baked into Claude prompt, (2) `recipient_name` treated as a writing slot instead of a verbatim echo, (3) no character budget validation so 137-char body shipped, (4) `hero_name_radial` layout picked for long body copy causing text/decoration collision, (5) zone instructions in percentages not pixels so GPT let decoration intrude, (6) no density guidance so GPT defaulted to ornate/cluttered, (7) Vision QA checked `text_zones_clean` vaguely and passed the wreath-in-zone, (8) `description` field said "medallion, wreath" which pulled GPT toward those shapes.

### Files Modified

- `lib/types.ts` — added `DecorationDensity` type; added `decoration_density: DecorationDensity` to `DesignBrief`
- `lib/render/layouts.ts` — rewrote all 7 `gpt_zone_instructions` to use explicit pixel rectangles; neutralized all layout `description` fields (removed shape suggestions)
- `docs/n8n-redesign.md` — applied all 8 prompt/spec fixes (see below)

### REVIEW Comments Left

None added in this pass. Existing `// REVIEW:` comments in other files are unchanged.

### n8n Update Summary

All nodes updated via API on 2026-04-30. No manual pasting required.

**Nodes successfully updated:**
- node-03 (Build Claude Prompt) — neutral aesthetic, slot semantics, decoration_density
- node-05 (Parse Claude Response) — full char-budget + decoration_density validation
- node-07 (Build Retry Prompt) — specific parseError in retry prefix
- node-09 (Parse Retry Response) — same validation as node-05
- node-11 (Build Image Prompt) — pixel-based zone instructions, density guidance, hard-constraints header
- node-15 (Build Vision QA Prompt) — empty_zones_clean, pixel-rect zone inspection
- node-17 (Parse Vision QA Response) — empty_zones_clean replaces text_zones_clean
- node-22 (Build Callback Body) — decoration_density in designBrief, new qa_result shape

**Nodes failed update:** None

**Workflow activation status:** SUCCESS (active: true, verified via GET)

### Manual Verification Steps

1. Open n8n — confirm the workflow Active toggle is ON
2. Open node-03 — confirm "Default aesthetic: clean, modern, internationally appealing" is in the prompt
3. Open node-05 — confirm `validDensity` variable and `decoration_density` check are present
4. Open node-11 — confirm "Empty zones are HARD constraints" and pixel coordinates (e.g. "x: 200-824, y: 350-1186")
5. Open node-15 — confirm `empty_zones_clean` (not `text_zones_clean`) is in the QA JSON response shape
6. Open node-18 — condition already uses `qaPass` (computed by node-17 from `empty_zones_clean`) — no change needed

### Build Status After Fixes

- `npm run build`: **PASS** — zero TypeScript errors, all 8 routes compiled (5.0s)

---

## Quality Fixes — Round 2 (square canvas, contrast, font sizes, name sanitizer)

**Problems fixed:** (1) `recipient_name` contained full salutation ("Happy Birthday Ada") instead of verbatim name ("Ada"). (2) Text contrast too low — accent colors picked from light canvas weren't dark enough against cream background. (3) Dead space below text — 1024×1536 vertical canvas had too much empty lower half; switched to 1024×1024 square. (4) Font sizes too small — 64px name base was illegible; raised to 88px. (5) Zone instructions were hardcoded for 1024×1536; layouts now parametric on canvas dimensions.

### Files Created

- `lib/render/render-config.ts` — central config: `CanvasFormat`, `CANVAS_DIMENSIONS`, `DEFAULT_CANVAS_FORMAT = 'square'`, `BASE_FONT_SIZE_PX = 88`, `CONTRAST_RATIOS`, `AUTO_FIT`, `TEXT_SHADOW`, `GRAIN_OVERLAY`

### Files Modified

- `lib/render/layouts.ts` — full rewrite: Layout type now uses `computeZones(w,h)`, `computeGptZoneInstructions(w,h)`, `computeDecorationSampleZone(w,h)` functions; removed static `text_zones`, `gpt_zone_instructions`, `decoration_sample_zone` fields; all 7 layouts use proportional fractions of canvas dimensions
- `lib/render/color-sampling.ts` — added `relativeLuminance`, `contrastRatio`, `ensureContrast` (WCAG AA); `harmonizeColors` now enforces minimum contrast for all 4 text colors before returning
- `lib/render/typography.ts` — imports `BASE_FONT_SIZE_PX` from render-config; headline sizeRatios reduced to 0.62–0.68 (55–60px at base 88); script font names (Allura, Caveat) bumped to sizeRatio 1.10 (97px); body/signoff ratios unchanged (28–40px at base 88)
- `lib/satori-render.ts` — imports `CANVAS_DIMENSIONS`, `DEFAULT_CANVAS_FORMAT`, `BASE_FONT_SIZE_PX` from render-config; default canvas is now 1024×1024; calls `layout.computeZones(CANVAS_W, CANVAS_H)` and `layout.computeDecorationSampleZone(CANVAS_W, CANVAS_H)` at base scale; removed `BASE_SIZE` import
- `lib/types.ts` — added `export type { CanvasFormat } from './render/render-config'`
- `docs/n8n-redesign.md` — Stage A parse node: added `sanitizeRecipientName` function; Stage B: all GPT_ZONE_INSTRUCTIONS updated to 1024×1024 coordinates; canvas size changed to `'1024x1024'`; "vertical" → "square" in image prompt

### n8n Update Summary

All nodes updated via API on 2026-04-30. No manual pasting required.

**Nodes successfully updated:**
- node-05 (Parse Claude Response) — sanitizeRecipientName + updated recipient_name validation
- node-09 (Parse Retry Response) — same as node-05 (references Build Retry Prompt)
- node-11 (Build Image Prompt) — 1024×1024 GPT_ZONE_INSTRUCTIONS, size: '1024x1024', "square" in prompt
- node-15 (Build Vision QA Prompt) — 1024×1024 GPT_ZONE_INSTRUCTIONS for zone inspection

**Workflow activation status:** SUCCESS (active: true, verified via GET)

### Manual Verification Steps

1. Open node-11 — confirm size is `'1024x1024'` and zone y-coords use ≤1024 values (e.g. "y: 233-791" not "y: 350-1186")
2. Open node-05 — confirm `sanitizeRecipientName` function is present; confirm `recipient_name.length === 0` check
3. Submit a birthday card with title "Ada" — recipient_name in final card must show "Ada", not "Happy Birthday Ada"
4. Check text contrast — all text should be legible against the cream background

### Build Status After Round 2

- `npm run build`: **PASS** — zero TypeScript errors, all 8 routes compiled (6.6s)

---

## Bug Fix — Round 3 (800×1100 vertical output instead of 1024×1024 square)

**Root cause:** Round 2 changes were applied locally but never committed/pushed. Vercel was still running the pre-Round-2 `satori-render.ts` with hardcoded `CANVAS_H = 1536`. n8n node-11 had been patched (via API) to request 1024×1024 canvases; the new square canvas hit the old render code → stretched to 1024×1536 → vertical output with misaligned text zones.

Secondary issues found during diagnosis:
- `components/CanvasPanel.tsx:51` — hardcoded `"800 × 1100 px"` label (stale from v1)
- `components/CanvasPanel.tsx:86` — `GeneratingState` placeholder `height: 275` (wrong 8:11 ratio)
- `app/api/flyer/render-hires/route.ts:53,103` — `scaleFactor = cfg.width / 1024` hardcoded; should derive from render-config so it tracks `DEFAULT_CANVAS_FORMAT`
- `lib/constants.ts:5-6` — `CANVAS_WIDTH = 800`, `CANVAS_HEIGHT = 1100` defined but never imported (dead code — not the render bug, no action needed)

### Files Modified

- `components/CanvasPanel.tsx` — label updated to `1024 × 1024 px`; GeneratingState placeholder changed to `width:200, height:200` (square)
- `app/api/flyer/render-hires/route.ts` — imported `CANVAS_DIMENSIONS, DEFAULT_CANVAS_FORMAT` from render-config; both `scaleFactor = cfg.width / 1024` lines replaced with `cfg.width / CANVAS_DIMENSIONS[DEFAULT_CANVAS_FORMAT].width`
- `lib/satori-render.ts` — added post-render dimension assertion: reads Sharp metadata and `console.error` logs if actual dimensions don't match `W×H`

### Dimension Assertion Location

`lib/satori-render.ts` — after `sharp(...).composite(...).png().toBuffer()`, before the return. Logs: `[CanvasFormat] Expected WxH, got AxB — dimension drift detected`

### Build Status After Round 3

- `npm run build`: **PASS** — zero TypeScript errors, all 8 routes compiled (5.6s)

### Manual Verification Steps

1. Wait for Vercel deploy to go green (triggers on push to main)
2. Submit a birthday card — spinner ~30–60s, final image must be square (not portrait)
3. Check browser devtools Network tab: the `/api/flyer/status/[jobId]` response `dataUrl` should be a 1024×1024 PNG
4. Check Vercel function logs — no `[CanvasFormat]` drift errors should appear
5. Test hi-res download (Download → PNG/JPG) — output should maintain square proportions
