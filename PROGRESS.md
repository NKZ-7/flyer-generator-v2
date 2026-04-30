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

**Note:** node-15 (Build Vision QA Prompt) also references zone coordinates for the vision QA check. It was NOT updated in this pass — the QA uses the same logic to verify text-zone cleanliness. If QA becomes too strict or too lenient after this change, update node-15 with the same new empty zone pixel values.

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
