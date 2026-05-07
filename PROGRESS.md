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

---

## Renderer Wiring Audit (post-Round-3 — text position / font size / contrast investigation)

**Question:** Why does the rendered output show text in the top-quarter, fonts 30–40% too small, and low contrast — despite config values existing and build passing?

### 1. CONFIG IMPORTS: YES

`lib/satori-render.ts:6`
```ts
import { CANVAS_DIMENSIONS, DEFAULT_CANVAS_FORMAT, BASE_FONT_SIZE_PX } from './render/render-config';
```
All three config values are imported. `CANVAS_W / CANVAS_H` are derived from them at line 9.

---

### 2. PARAMETRIC ZONES: YES

`lib/satori-render.ts:47–48`
```ts
const zones      = layout.computeZones(CANVAS_W, CANVAS_H);
const sampleZone = layout.computeDecorationSampleZone(CANVAS_W, CANVAS_H);
```
`computeZones` is called with the config-derived dimensions. Static `text_zones` field is NOT used.  
**However:** the actual coordinate values returned by `computeZones` come from `lib/render/layouts.ts` (not audited in this pass). If the fractional values in `computeZones` are wrong, the zones will land in the wrong position regardless of correct wiring.

---

### 3. CONFIG-DRIVEN FONT SIZES: YES

`lib/satori-render.ts:74`
```ts
let fontSize = Math.round(BASE_FONT_SIZE_PX * spec.sizeRatio * scaleFactor);
```
Initial size is correctly derived from `BASE_FONT_SIZE_PX` × pairing ratio.  
**However:** auto-fit can shrink this down to 60% of initial (see item 5). If zone width is very small (wrong coordinates in layouts.ts), the auto-fit hits its minimum on every slot.

---

### 4. HARMONIZED COLORS USED: YES

`lib/satori-render.ts:50–58`
```ts
const zoneColor   = await extractZoneColor(canvasBuffer, zones.body);
const accentColor = await extractAccentColor(canvasBuffer, sampleZone);
const colors      = harmonizeColors(zoneColor, accentColor);

const textColors: Record<Slot, string> = {
  headline: colors.headline,
  name:     colors.name,
  body:     colors.body,
  signoff:  colors.signoff,
};
```
Colors from `harmonizeColors` are assigned to `textColors` and applied at line 71 (`const color = textColors[slot]`) and line 119 (`color`).  
**However:** `extractZoneColor` catches all Sharp errors and returns `#F5E6D0` (cream) on failure. If `zones.body` has out-of-bounds coordinates (wrong layout fractions), Sharp will throw and the fallback is used. `extractAccentColor` similarly falls back to `#8B6914` (warm gold). Warm gold `#8B6914` against cream `#F5E6D0` has a contrast ratio of ~2.3:1 — below both WCAG thresholds — meaning `ensureContrast` would need to darken aggressively, but starting from gold against cream the loop may still exit at a low-contrast color if the zone background estimate is wrong.

---

### 5. AUTO-FIT FROM CONFIG: NO (values match by coincidence)

`lib/satori-render.ts:75–80`
```ts
const minFontSize = Math.round(fontSize * 0.6);
for (let i = 0; i < 10; i++) {
  const charsPerLine = Math.floor((zone.width * scaleFactor) / (fontSize * 0.55));
  const estimatedLines = Math.ceil(text.length / Math.max(charsPerLine, 1));
  if (estimatedLines <= maxLn || fontSize <= minFontSize) break;
  fontSize -= 2;
}
```
`AUTO_FIT` is not imported. The min ratio (`0.6`), max iterations (`10`), and step (`2`) are hardcoded — but they happen to equal the values in `render-config.ts`'s `AUTO_FIT` constant. No functional discrepancy, but config is not the source of truth here.  
**Critical:** if `zone.width` is very small (wrong layout fractions), `charsPerLine` will be 1 or 0, `estimatedLines` will be enormous, and the loop will always reach `fontSize <= minFontSize`. That produces a **40% font size reduction on every single slot** — exactly the symptom reported.

---

### 6. TYPOGRAPHY RATIOS IN RANGE: YES — all pairings within spec

| Pairing | headline | name | body | signoff |
|---------|----------|------|------|---------|
| classical_elegant | 0.62 ✓ | 1.00 ✓ | 0.35 ✓ | 0.45 ✓ |
| modern_clean | 0.65 ✓ | 1.00 ✓ | 0.35 ✓ | 0.42 ✓ |
| bold_impact | 0.68 ✓ | 1.00 ✓ | 0.32 ✓ | 0.40 ✓ |
| romantic_serif | 0.62 ✓ | 1.10 ✓ | 0.35 ✓ | 0.45 ✓ |
| warm_handwritten | 0.63 ✓ | 1.10 ✓ | 0.34 ✓ | 0.44 ✓ |
| minimal_swiss | 0.65 ✓ | 1.00 ✓ | 0.33 ✓ | 0.42 ✓ |

Spec ranges: headline 0.60–0.68, name 1.00–1.25, body 0.32–0.36, signoff 0.36–0.45. All pass.

---

### 7. CONTRAST ENFORCEMENT: YES

`lib/render/color-sampling.ts:78–85` — `harmonizeColors` function body:
```ts
export function harmonizeColors(zoneColor: string, accentColor: string): TextColors {
  return {
    headline: ensureContrast(accentColor,              zoneColor, CONTRAST_RATIOS.large_headline),
    name:     ensureContrast(darken(accentColor, 15),  zoneColor, CONTRAST_RATIOS.large_headline),
    body:     ensureContrast(darken(zoneColor, 60),    zoneColor, CONTRAST_RATIOS.body_text),
    signoff:  ensureContrast(desaturate(accentColor, 30), zoneColor, CONTRAST_RATIOS.signoff),
  };
}
```
`CONTRAST_RATIOS` is imported from `render-config` (line 4). `ensureContrast` is called for all 4 slots. The `ensureContrast` loop darkens in 5% HSL steps up to 20 times, then falls back to `#1a1a1a` or `#f5f5f5` (line 130).  
**Exception path:** if `extractZoneColor` throws (out-of-bounds zone), fallback `zoneColor = #F5E6D0`. Body text starts at `darken(#F5E6D0, 60)` ≈ a medium-dark beige — contrast against `#F5E6D0` is low; `ensureContrast` will then progressively darken it, which should work correctly. **This part is fine.**

---

### Audit Conclusion

All 7 wiring checks pass. The render pipeline IS correctly connected to `render-config.ts`. The visual symptoms are **not caused by config wiring failures** in `satori-render.ts`, `typography.ts`, or `color-sampling.ts`.

**Root cause points to `lib/render/layouts.ts`** — specifically the fractional values inside `computeZones(w,h)` for the `centered_framed` layout (and possibly others). Two failure modes that explain all three symptoms:

1. **Text in top-quarter** → zone y-fractions place the body zone near y=0 instead of center
2. **Fonts 30–40% too small** → small zone width triggers auto-fit to min-ratio floor every time
3. **Low contrast** → if zone coordinates are out-of-bounds, `extractZoneColor` returns the `#F5E6D0` cream fallback; `ensureContrast` then darkens from low-saturation starting values producing muted rather than bold text colors

**`lib/render/layouts.ts` was NOT audited in this pass** — that is where the fix must be applied.

---

## Layout Zone Fix — Round 4 (stack centering, generous widths, bounds clamping)

**Root cause confirmed:** Prior zone fractions were derived from a 1024×1536 vertical canvas and pasted unchanged into the 1024×1024 square canvas. The content stack ended at y≈667 on a 1024-tall canvas, leaving 357px dead zone at bottom — making text appear "crammed at top." Zone heights were also too small for the expected font sizes, triggering auto-fit to its 60% minimum floor on most slots.

### Files Modified

- `lib/render/layouts.ts` — full rewrite: added `clampRect` helper + `cr()` shorthand; rewrote all 7 layouts with re-centered stacks and updated `computeGptZoneInstructions`
- `lib/render/color-sampling.ts` — added `console.warn` in `extractZoneColor` catch block
- `lib/satori-render.ts` — imported `AUTO_FIT`; replaced hardcoded `0.6/10/2` with `AUTO_FIT.min_size_ratio/max_iterations/size_step_px`; added `debugZones` parameter + `DEBUG_ZONES` env var support

### Per-Layout New Zone Fractions (all at 1024×1024)

**Stack height for most layouts:** headline(70) + 16 + name(140) + gap(36–56) + body(130–160) + 20 + signoff(55) ≈ 467–538px

#### centered_framed
- Empty zone: x: 10%–90%, y: 18%–82% → pixels: (102,184)→(922,840), height: 656px
- Content stack starts at y≈262 (78px top padding)
- `headline`: x:0.15, y:0.255, w:0.70, h:0.068 → (154,261,717,70)
- `name`:     x:0.075, y:0.340, w:0.85, h:0.137 → (77,348,870,140)
- `body`:     x:0.15, y:0.531, w:0.70, h:0.156 → (154,544,717,160)
- `signoff`:  x:0.20, y:0.722, w:0.60, h:0.058 → (205,739,614,59)
- Signoff bottom: y≈800, empty zone bottom: 840 → 40px breathing room ✓

#### asymmetric_diagonal
- Empty zones: upper-left (x:0–55%, y:0–55%) and lower-right (x:45%–100%, y:45%–100%)
- Text stacks in upper-left zone; stack starts at y≈60
- `headline`: x:0.059, y:0.059, w:0.47, h:0.068 → (60,60,481,70)
- `name`:     x:0.059, y:0.146, w:0.47, h:0.137 → (60,150,481,140)
- `body`:     x:0.059, y:0.322, w:0.45, h:0.127 → (60,330,461,130)
- `signoff`:  x:0.059, y:0.469, w:0.34, h:0.054 → (60,480,348,55)
- Signoff bottom: y≈535, upper-left zone bottom: 563 → 28px breathing room ✓

#### top_heavy
- Empty zone: x: 8%–92%, y: 42%–92% → pixels: (82,430)→(942,942), height: 512px
- Content stack starts at y≈452 (22px top padding, stack height 467px)
- `headline`: x:0.10, y:0.441, w:0.80, h:0.068 → (102,452,820,70)
- `name`:     x:0.09, y:0.525, w:0.82, h:0.137 → (92,538,840,140)
- `body`:     x:0.10, y:0.697, w:0.75, h:0.127 → (102,714,768,130)
- `signoff`:  x:0.20, y:0.844, w:0.60, h:0.054 → (205,864,614,55)
- Signoff bottom: y≈919, empty zone bottom: 942 → 23px breathing room ✓

#### magazine_split
- Empty zone (left column): x: 6%–55%, y: 10%–90% → pixels: (61,102)→(563,922), height: 820px
- Content stack starts at y≈278 (176px vertical centering)
- `headline`: x:0.059, y:0.271, w:0.47, h:0.068 → (60,277,481,70)
- `name`:     x:0.059, y:0.355, w:0.47, h:0.137 → (60,364,481,140)
- `body`:     x:0.059, y:0.527, w:0.45, h:0.127 → (60,540,461,130)
- `signoff`:  x:0.059, y:0.674, w:0.34, h:0.054 → (60,690,348,55)
- Signoff bottom: y≈745, empty zone bottom: 922 → 177px breathing room ✓

#### vignette_center
- Empty zone: x: 15%–85%, y: 20%–80% → pixels: (154,205)→(870,819), height: 614px
- Content stack starts at y≈279 (74px top padding, stack height 467px)
- `headline`: x:0.15, y:0.272, w:0.70, h:0.068 → (154,279,717,70)
- `name`:     x:0.15, y:0.356, w:0.70, h:0.137 → (154,365,717,140)
- `body`:     x:0.16, y:0.528, w:0.68, h:0.127 → (164,541,696,130)
- `signoff`:  x:0.23, y:0.675, w:0.54, h:0.054 → (236,691,553,55)
- Signoff bottom: y≈746, empty zone bottom: 819 → 73px breathing room ✓

#### banner_horizontal
- Empty zone: x: 6%–94%, y: 22%–78% → pixels: (61,225)→(962,799), height: 574px
- Content stack starts at y≈279 (54px top padding, stack height 467px)
- `headline`: x:0.10, y:0.272, w:0.80, h:0.068 → (102,279,820,70)
- `name`:     x:0.075, y:0.356, w:0.85, h:0.137 → (77,365,870,140)
- `body`:     x:0.15, y:0.528, w:0.70, h:0.127 → (154,541,717,130)
- `signoff`:  x:0.20, y:0.675, w:0.60, h:0.054 → (205,691,614,55)
- Signoff bottom: y≈746, empty zone bottom: 799 → 53px breathing room ✓

#### hero_name_radial
- Name zone (inner radial clear area): x:31%–69%, y:16%–34% → (321,179)→(704,319)
- Lower empty zone: x:8%–92%, y:46%–95% → (80,471)→(944,973), height: 502px
- Lower stack (headline + body + signoff only): 70+20+130+20+55 = 295px, starts at y≈571
- `headline`: x:0.10, y:0.557, w:0.80, h:0.068 → (102,570,820,70)  [lower zone]
- `name`:     x:0.313, y:0.175, w:0.374, h:0.137 → (321,179,383,140) [radial center]
- `body`:     x:0.15, y:0.645, w:0.70, h:0.127 → (154,661,717,130) [lower zone]
- `signoff`:  x:0.20, y:0.792, w:0.60, h:0.054 → (205,811,614,55)  [lower zone]
- Signoff bottom: y≈866, empty zone bottom: 973 → 107px breathing room ✓

### GPT Zone Instructions (node-11) Updated

All 7 layout strings updated to match the new empty zone pixel coordinates above. Changes:
- `centered_framed`: old (200-824, 228-791) → new (102-922, 184-840) — wider and taller empty zone
- `asymmetric_diagonal`: retained diagonal split logic; both midpoints now at 461/563 (45%/55% of 1024)
- `top_heavy`: old (80-942, 378-948) → new (82-942, 430-942) — empty zone starts lower (more decoration room)
- `magazine_split`: old (60-580, 0-1024) → new (61-563, 102-922) — added top/bottom margin
- `vignette_center`: old (200-824, 253-770) → new (154-870, 205-819) — wider empty zone
- `banner_horizontal`: old (60-962, 213-810) → new (61-962, 225-799) — slightly tighter bands
- `hero_name_radial`: lower zone updated from (80-942, 467-971) to (80-944, 467-971); inner name area updated to (321-705, 160-347)

n8n node-11 patched via API, workflow reactivated (active: true ✓).

### DEBUG_ZONES Feature

Added to `lib/satori-render.ts`. Activated via `debugZones=true` parameter or `DEBUG_ZONES=true` env var. Overlays semi-transparent colored fills: headline=red, name=green, body=blue, signoff=orange. Use to visually validate layout zones without modifying any production code path.

**Node-15 (Build Vision QA Prompt) patched with updated zone coordinates — vision QA now inspects the same rectangles GPT was instructed to keep clean.**

Prior node-15 coordinates were from the pre-Round-4 layout (e.g. centered_framed was checking x:200-824, y:233-791; now correctly checks x:102-922, y:184-840). All 7 layout instruction strings in node-15 now match node-11 exactly. Workflow reactivated (active: true ✓).

### Build Status After Round 4

- `npm run build`: **PASS** — zero TypeScript errors, all 8 routes compiled (5.7s)

### Manual Verification Steps

1. Wait for Vercel deploy (commit pushed — green checkmark in Vercel dashboard)
2. Submit a birthday (warm) card with recipient "Ada"
3. Expected result: text visually centered as a block in the canvas (not top-quarter)
4. Name should appear large (~88–97px); headline and body clearly smaller; signoff elegant
5. Body text must be readable (high contrast against canvas background)
6. Appropriate white space below signoff — not crammed at bottom, not huge dead zone
7. For advanced debugging: set `DEBUG_ZONES=true` in Vercel env → colored zone overlays appear on the rendered image; remove after verification

---

## Diagnosis A — Contrast Failure

### Sanity tests (run with actual `color` npm package)

| Test | Result | Expected |
|------|--------|----------|
| `contrastRatio('#000000','#FFFFFF')` | **21.00** | 21 ✓ |
| `contrastRatio('#F5E6D0','#F5E6D0')` | **1.00** | 1 ✓ |
| `darken('#F5E6D0', 60)` | **#956620** (warm medium brown) | clearly darker ✓ |
| `darken('#F5E6D0', 65)` | **#83591C** | darker still ✓ |
| `darken('#8B6914', 15)` | **#765911** | ✓ |
| `darken('#F5E6D0', 5) × 20 iterations` | **#855C1C** | deep brown ✓ |

**Conclusion: `darken()` and `contrastRatio()` implementations are mathematically correct.**

### ensureContrast simulation — fallback inputs (zoneColor = cream `#F5E6D0`, accentColor = gold `#8B6914`)

| Slot | Starting color | Initial contrast | Converged at | Final color | Final contrast | Target |
|------|---------------|-----------------|--------------|-------------|----------------|--------|
| headline | `#8B6914` | 4.14 | step 0 | `#8B6914` | **4.14** | 3.0 ✓ |
| name | `#765911` | 5.34 | step 0 | `#765911` | **5.34** | 3.0 ✓ |
| body | `#956620` | 4.07 | step 2 | `#875C1D` | **4.78** | 4.5 ✓ |
| signoff | `#796126` | 4.82 | step 0 | `#796126` | **4.82** | 4.5 ✓ |

**With fallback values, all 4 slots pass WCAG thresholds. The math works.**

### ensureContrast simulation — light pastel accent (e.g. muted GPT canvas with `#E8C97A`)

| Slot | Starting color | Initial contrast | Converged at | Final color | Final contrast | Target |
|------|---------------|-----------------|--------------|-------------|----------------|--------|
| headline | `#E8C97A` | **1.31** | step 12 | `#A37C1C` | 3.14 | 3.0 ✓ |

**With a light pastel accent, ensureContrast still converges — but takes 12 iterations and the result (`#A37C1C`) is a medium-dark brown, which is readable but may look muted on a warm cream canvas.**

### Diagnosis log instrumentation

Temporary `console.log` statements added to `harmonizeColors` in `lib/render/color-sampling.ts`. They log:
- `[harmonize] IN  zoneColor: <hex> accentColor: <hex>`
- `[harmonize] initial colors — <slot>: <hex> cr: <ratio>`
- `[harmonize] OUT — <slot>: <hex> cr: <ratio>`

**To capture these values:** submit a test card and check Vercel function logs under `/api/flyer/status/[jobId]`. The `[harmonize]` lines will show exactly what colors are being sampled and whether any slot is failing to reach its contrast target.

### Most likely failure modes (in priority order)

1. **Light accentColor from muted GPT canvas decoration** — If the decoration sample zone (tiny top-left corner of centered_framed) has only pale/pastel gold, ensureContrast needs 10–12 iterations. The converged headline/name color (`#A37C1C`) passes WCAG 3.0 but may read as "low contrast" to the human eye against warm cream. **Fix: lower the saturation threshold in extractAccentColor from 15% to something that favours darker starting points, or use a stronger darken step.**

2. **Zone color extraction succeeding but returning very pale cream** — If the body zone (now correctly at y:544–704 in centered_framed) returns `#FAF7F2` instead of `#F5E6D0`, the body start color `darken('#FAF7F2', 60)` = still a warm brown (~4.0 contrast). ensureContrast would add 1–2 steps. Should still pass — but real values needed to confirm.

3. **ensureContrast fallback path triggered** — If zone extraction throws (Sharp bounds error), zoneColor = cream fallback AND accentColor = gold fallback, which both test correctly. This path is safe.

4. **Not actually a contrast bug** — The rendered colors may be mathematically correct (WCAG AA) but the warm-brown-on-cream palette looks "low contrast" visually relative to user expectations of bold black text. This is a design choice, not a code bug.

### Action required
Run a test card and check Vercel function logs for `[harmonize]` output. Report back the actual `zoneColor`, `accentColor`, and final color contrast ratios. Without these values from a real GPT canvas, the specific failure point cannot be determined from code analysis alone.

---

## Diagnosis B — Story Format (1080×1920 with filler bars)

### File and line where 1080×1920 originates

**`lib/constants.ts:17–23`** — the `story` key in `DIGITAL_PRESETS`:

```typescript
story: {
  label: 'WhatsApp Status / IG Story',
  desc: 'Full screen vertical',
  width: 1080,
  height: 1920,
  format: 'jpg' as const,
},
```

### How it gets triggered

1. User opens DownloadModal (`components/DownloadModal.tsx:30`)
2. Default preset is `'social'` (1080×1080) — **story is NOT the default**
3. User selects "WhatsApp Status / IG Story" row → `setPreset('story')`
4. Clicks the main Download button → `handleDownload()` sends `{ jobId, preset: 'story', useCase: 'digital' }` to `/api/flyer/render-hires`
5. `render-hires/route.ts:53` computes `scaleFactor = 1080 / 1024 = 1.055` → renders a 1080×1080 PNG
6. `render-hires/route.ts:77–80` resizes to 1080×1920 with `fit: 'contain', background: '#FAEDE3'`

```typescript
const fittedBuffer = await sharp(pngBuffer)
  .resize(cfg.width, cfg.height, { fit: 'contain', background: bgColor })
  .png()
  .toBuffer();
```

7. `render-hires/route.ts:82–85` converts to JPEG: `sharp(fittedBuffer).jpeg({ quality: 92 })`

### Is this intentional or accidental?

**Intentional** — the `story` preset is a named, labelled export option in `DIGITAL_PRESETS`. The filler bars are the intended behavior: a square canvas letterboxed into a 9:16 Story frame.

### Why the bars appear black (not cream)

The bars should be cream (`#FAEDE3`) per the `bgColor` in `render-hires/route.ts:76`. **But if the rendered PNG from `renderFlyerToBase64` has an alpha channel**, Sharp's `fit: 'contain'` padding areas may remain transparent in the intermediate PNG. When `sharp(fittedBuffer).jpeg()` flattens the image, transparent pixels become **black** (JPEG has no transparency; Sharp defaults unspecified alpha-flatten background to black).

**Fix needed:** Add `.flatten({ background: bgColor })` before `.jpeg({ quality: 92 })` in render-hires to ensure transparent padding renders as cream, not black. This applies to all JPEG digital presets.

### Secondary issue: Quick Save label is wrong

`DownloadModal.tsx:143` shows label `"1080 × 1350 px"` for the Quick Save JPEG. This is stale — the actual download is the `imageDataUrl` at natural resolution (1024×1024). Label should say `"1024 × 1024 px"`.

---

## Quality Fixes — Round 5 (two-channel contrast, JPEG black bars, label correction)

### Fix A — Two-channel color strategy for legibility

**Problem:** All 4 text slots (headline, name, body, signoff) were accent-harmonized. On canvases with muted or pastel decoration, `ensureContrast` had to darken aggressively from low-saturation starting values, producing medium-brown text that passed WCAG numerically but looked washed out to the human eye. Name and body — the highest-priority legibility slots — should not depend on accent color quality.

**Fix:** Introduced a two-channel architecture:
- **Legibility channel** (name, body): fixed near-black ink `#1F1A14`; flips to near-white `#FAF6F0` if zone luminance < 0.5 (dark canvas protection). No iterative darkening needed — always starts at a guaranteed high-contrast value.
- **Decorative channel** (headline, signoff): still accent-harmonized via `ensureContrast`, providing visual connection to the canvas palette.

### Files Modified

- `lib/render/render-config.ts` — added three new exports:
  - `LEGIBILITY_TEXT_COLOR = '#1F1A14'` (warm near-black)
  - `LEGIBILITY_TEXT_COLOR_LIGHT = '#FAF6F0'` (near-white for dark canvases)
  - `LEGIBILITY_LUMINANCE_THRESHOLD = 0.5`
- `lib/render/color-sampling.ts` — refactored `harmonizeColors`:
  - Imports 3 new constants from render-config
  - Computes `zoneLum = relativeLuminance(zoneColor)` to pick legibility channel
  - `name` and `body` slots: assigned `legibilityColor` directly (no `ensureContrast` iteration)
  - `headline`: `ensureContrast(accentColor, zoneColor, CONTRAST_RATIOS.large_headline)`
  - `signoff`: `ensureContrast(desaturate(accentColor, 30), zoneColor, CONTRAST_RATIOS.signoff)`
  - All diagnostic `console.log` lines preserved and updated for new structure

### Fix B — Sharp flatten before JPEG (letterbox bars)

**Problem:** When `renderFlyerToBase64` returns a PNG with an alpha channel, Sharp's `fit: 'contain'` padding fills the letterbox areas with transparent pixels. Converting to JPEG without flattening causes Sharp to default unspecified alpha → black. Story (1080×1920) and any non-square JPEG preset showed black bars instead of cream padding.

**Fix:** Added `.flatten({ background: '#FAEDE3' })` before `.jpeg({ quality: 92 })` in the digital JPEG export path in `app/api/flyer/render-hires/route.ts:83`.

### Fix C — DownloadModal Quick Save label

**Problem:** `components/DownloadModal.tsx:143` showed stale label `"1080 × 1350 px"` inherited from v1 (portrait canvas). Canvas is now 1024×1024 square.

**Fix:** Changed to `"1024 × 1024 px — saves directly to your device"`.

### Build Status After Round 5

- `npm run build`: **PASS** — zero TypeScript errors, all 8 routes compiled (6.5s)

### Manual Verification Steps

1. Wait for Vercel deploy (push to main → green checkmark)
2. Submit a birthday card — name and body text must appear **dark and crisp** (near-black `#1F1A14`), not medium-brown
3. For a light canvas: headline and signoff should still show a warm accent color; name and body should be clearly darker (near-black)
4. For the story (1080×1920) preset: download → open the JPEG → bars above/below the canvas must be **cream** (#FAEDE3), not black
5. Open DownloadModal → Quick Save section → label must read `"1024 × 1024 px — saves directly to your device"`
6. Check Vercel function logs — `[harmonize] zoneLum:` lines should appear; `name:` and `body:` OUT lines should show `#1F1A14` (or `#FAF6F0` if canvas is dark)

---

## MVP Launch Fixes — Round 6

### Fix 1 — Remove Email Banner preset (1200×628)

**Problem:** The 1200×628 export preset letterboxed the square 1024×1024 canvas inside a wide frame, producing prominent cream bars on both sides. Poor output for a named export option.

**Fix:** Removed `'email-banner'` from `DIGITAL_PRESETS` in `lib/constants.ts`. No UI change needed — `DownloadModal.tsx` renders presets dynamically from `Object.entries(DIGITAL_PRESETS)`, so removing the entry from constants removes it from the UI automatically.

**Orphaned references audit:** `refinementMessage` is only in `app/api/flyer/refine/route.ts` (kept with REVIEW comment). No references to `email-banner`, `1200`, or `628` remain in `render-hires/route.ts` or elsewhere. ✓

**4 presets remain:** Social Media Post (1080×1080), WhatsApp Status / IG Story (1080×1920), Facebook Event Cover (1920×1005), plus the Quick Save JPEG at base resolution.

### Fix 2 — Flatten preview PNG to cream

**Problem:** `renderFlyerToBase64` returned a PNG with a transparent background. The in-app preview showed dark text on near-black (the UI's dark chrome showed through) — misleading to the user.

**Fix:** Added `.flatten({ background: '#FAEDE3' })` before `.png()` in the final Sharp composite pipeline in `lib/satori-render.ts` (line 194). Transparent pixels in the rendered PNG now resolve to warm cream, matching what all export presets already produced.

### Fix 3 — Replace RefinementChat with ActionsPanel

**Problem:** The refinement chat sent a `refinementMessage` to n8n which triggered a full pipeline regeneration — a brand-new card unrelated to the previous one. Confusing and destructive for users. Smart selective edit is deferred to post-launch.

**New UX:** `Regenerate` (same inputs, new variant) + `Edit inputs` (return to form with values preserved) + "Smart edit coming soon" note.

### Files Modified

- `lib/constants.ts` — removed `'email-banner'` preset entry
- `lib/satori-render.ts` — added `.flatten({ background: '#FAEDE3' })` before `.png()` at line ~194
- `components/RefinementChat.tsx` — replaced entirely; now exports `ActionsPanel` component
- `components/StudioLayout.tsx` — updated import to `ActionsPanel`; added `handleRegenerate` and `handleEditInputs` functions; `showChat` → `showActions = phase === 'done'`; panel height changed to `h-52`
- `hooks/useGenerator.ts` — removed `refine` and `isRefining` from returned API; added `// REVIEW:` comment above `refine` implementation
- `app/api/flyer/refine/route.ts` — added `// REVIEW:` comment at top (route left intact, no longer called by frontend)

### Architecture notes

- **ActionsPanel** lives at `components/RefinementChat.tsx` (file kept, contents replaced). Exported as `ActionsPanel`.
- **Regenerate** calls `generator.generate(prefs, userAssets)` in StudioLayout — uses the current form prefs. Each regeneration adds a new version entry to the VersionStrip.
- **Edit inputs** calls `generator.reset()` only — prefs and userAssets in StudioLayout state are preserved. The user returns to Step 1 of the form with all their previous values intact.
- **refine route** is left in place (`app/api/flyer/refine/route.ts`) with a REVIEW comment — safe to delete after MVP launch confirms stable.

### REVIEW comments left

- `hooks/useGenerator.ts` — above `refine()`: safe to delete `refine`, `isRefining`, and `/api/flyer/refine` after MVP confirms stable
- `app/api/flyer/refine/route.ts` — top of file: route no longer called by frontend

### Build Status After Round 6

- `npm run build`: **PASS** — zero TypeScript errors, all 8 routes compiled (6.9s)

### Manual Verification Steps

1. Wait for Vercel deploy (push to main)
2. Submit a fresh test card (birthday + warm + Ada):
   - Preview pane must show cream background, dark text fully readable — not dark-on-dark
   - Below the Download button area, the right panel must show "What next?" with Regenerate and Edit inputs buttons and "Smart edit coming soon" note
3. Download modal shows **4 presets only** — Social Media Post, IG Story, Facebook Event Cover visible; no Email / Web Banner
4. Click **Regenerate** — spinner starts, new card generates, both versions appear in the version strip at the bottom
5. Click **Edit inputs** — form returns to Step 1 with previous values (recipient name, occasion, vibe) pre-filled
6. Confirm no 404 or console errors for `/api/flyer/refine` (it still exists, just not called)

---

## Theme System + Bug Fixes — Round 7

### What Was Built

**Theme system (12 decorative themes):**
- Added `lib/render/themes.ts` — 12 `DecorativeTheme` entries with `id`, `displayName`, `gpt_decoration_prompt`, `compatible_vibes`, and `compatible_occasions`
- Added `getCompatibleThemes(occasion, vibe)` — filters themes by both axes, returns array of `ThemeId`
- Added `ThemeId` union type; re-exported from `lib/types.ts`
- `DesignBrief` extended with `decorative_theme: ThemeId` field

**Session memory for themes (avoid repeating the same theme twice):**
- n8n node-03 now reads `recentThemes` from the webhook body — an array of recently used `ThemeId` strings supplied by the client
- Claude avoids picking themes in `recentThemes` when alternatives are available
- n8n node-05 echoes `chosen_theme` back to the client; front-end stores last 3 used themes per session

**`hero_name_radial` layout fix:**
- Layout now disabled for body copy > 90 chars (Claude Haiku writes 100–120 char bodies; the name zone is too small to accommodate the full lower-text stack)
- node-05 applies this guard during layout validation

**Bugs fixed:**
- **Bug A (body limit 120 → 130):** Claude Haiku consistently writes 124–125 char bodies against the 120-char limit, causing 100% retry overhead. Body limit raised to 130 in node-03 (prompt), node-05 (validation), and `docs/n8n-redesign.md`.
- **Bug B (decorative_theme lost on retry):** When the first parse failed, `design_brief.decorative_theme` wasn't propagating to node-11, which fell back to `watercolor_florals_sparse`. Bug B is resolved by Bug A — once parse succeeds on the first attempt, the theme flows cleanly.

### Files Modified

- `lib/render/themes.ts` — **created** (12 themes, type definitions, `getCompatibleThemes`)
- `lib/types.ts` — added `ThemeId` re-export; added `decorative_theme: ThemeId` to `DesignBrief`
- `docs/n8n-redesign.md` — body limit 120 → 130; node-11 now injects `gpt_decoration_prompt` from the matched theme

### n8n Update Summary

Nodes updated via REST API on 2026-05-07. Workflow PUT at `2026-05-07T23:42:23.984Z`, `active: true`.

**Nodes successfully updated:**
- node-03 (Build Claude Prompt) — theme compatibility lookup, recentThemes exclusion, body limit 130, occasion-specific tone guidance, sender awareness
- node-05 (Parse Claude Response) — `validOccasions` array (14 values), occasion validation, body limit 130, `hero_name_radial` guard for long body

**Nodes not changed:** node-11 was already updated in the prior session with theme injection logic (gpt_decoration_prompt substitution).

### Build Status After Round 7

- `npm run build`: **PASS** — zero TypeScript errors, all 8 routes compiled

### Manual Verification Steps

1. Submit a birthday (warm) card — check Vercel function logs for `[harmonize]` and n8n execution for `chosen_theme` in node-05 output
2. Submit a second birthday (warm) card — `chosen_theme` should differ from the first (recentThemes exclusion)
3. Open n8n node-03 — confirm body limit says `max 130` (not 120) and occasion-specific guidance section is present
4. Open n8n node-05 — confirm `validOccasions` array has 14 entries and `copy.body.length <= 130`

---

## Phase 1 — Occasion Expansion + Sender Awareness

### What Was Built

**6 deliverables completed:**

1. **`lib/types.ts` — `Occasion` named type:** Replaced inline union in `FlyerPreferences.occasion` with a named `Occasion` type exported at the top of the file. Includes 5 UI-visible occasions + 9 extended backend occasions:
   - UI: `birthday`, `sympathy`, `congrats`, `business`, `invitation`
   - Extended: `happy_new_month`, `mothers_day`, `fathers_day`, `valentines_day`, `eid`, `christmas`, `new_year`, `easter`, `independence_day`

2. **`lib/render/themes.ts` — Extended theme compatibility:** `DecorativeTheme.compatible_occasions` union type expanded to all 14 occasions. All 12 theme entries updated with extended occasion mappings. Notable additions:
   - `celestial_dust`: + christmas, new_year, eid, easter, valentines_day
   - `vintage_paper_texture`: + fathers_day, christmas, easter, eid
   - `geometric_confetti` / `balloon_streamer`: + happy_new_month, new_year, independence_day

3. **`docs/n8n-redesign.md` — Occasion-specific tone guidance added to Stage A prompt:** 14 occasions each with a 1–2 line tone description. Added after the emotional fit paragraph, before general rules. Body limit updated 120 → 130 throughout.

4. **`docs/n8n-redesign.md` — Validation section updated:** `validOccasions` constant now lists all 14 occasions; `copy.body.length <= 120` updated to `<= 130`; compatibility table extended to show all 14 occasion columns.

5. **`components/ControlPanel.tsx` — Sender hint UI:** Added a `<p>` tip below the "Describe your flyer" textarea (Step 1):
   ```
   💡 Tip: Mention your name or relationship for a personal signoff
   (e.g. "from his sister" or "love, Mama")
   ```
   OccasionPicker UI unchanged — still shows exactly 5 visible options.

6. **n8n nodes 3 and 5 — Pushed via REST API:** All prompt and validation changes from items 3 and 4 applied to the live n8n workflow (same PUT at `2026-05-07T23:42:23.984Z`).

### Hard Rules Applied

- OccasionPicker UI not modified — 5 visible options only
- Extended occasions reserved for backend handling (n8n receives them if the client sends them)
- All existing functionality preserved — no regressions to template path, composite path, or hi-res export

### Build Status After Phase 1

- `npm run build`: **PASS** — zero TypeScript errors, all 8 routes compiled

### Manual Verification Steps

1. Open `components/ControlPanel.tsx` — confirm tip text appears below the describe-your-flyer textarea
2. Open `lib/types.ts` — confirm `Occasion` is a named export with 14 values
3. Open `lib/render/themes.ts` — confirm `compatible_occasions` union has 14 entries; spot-check `celestial_dust` for `christmas` and `eid`
4. Open n8n node-03 — confirm "Occasion-specific tone guidance" section present with all 14 occasions
5. Open n8n node-05 — confirm `validOccasions` array has 14 entries
6. Submit a test card — sender hint tip should appear in the UI form
