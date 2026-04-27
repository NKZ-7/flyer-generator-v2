# FlyerCraft v2 — Template Architecture Refactor Progress

## Build Status
`npm run build` — **PASS** (zero TypeScript errors, zero webpack errors)

---

## Files Created

| File | Purpose |
|------|---------|
| `lib/templates/schema.ts` | TypeScript types for `Slot`, `Palette`, `Template` |
| `lib/templates/index.ts` | Template loader with module-level Map cache |
| `templates/birthday/birthday_warm_01.json` | First template: 1080×1350, 3 slots, 3 warm palettes |
| `scripts/create-backgrounds.mjs` | Generates background PNGs from SVG via Sharp (run once) |
| `public/backgrounds/birthday_warm_01.png` | Generated warm gradient background (commit this) |
| `lib/validate-copy.ts` | Validates TemplateCopy against slot max_chars budgets |
| `components/OccasionPicker.tsx` | 5-option occasion selector (birthday/sympathy/congrats/business/invitation) |
| `components/VibePicker.tsx` | 6-option vibe selector (elegant/warm/playful/bold/church/minimal) |
| `.env.example` | Documents all required and optional env vars |
| `docs/n8n-contract.md` | Full webhook/callback contract + GPT prompt templates for n8n |

## Files Replaced

| File | Key Changes |
|------|-------------|
| `lib/types.ts` | Added `TemplateCopy`, `occasion`/`vibe` on `FlyerPreferences`, dual-path `JobMeta` |
| `lib/satori-render.ts` | Template-based renderer — loads background PNG, renders text slots via Satori, composites with Sharp. No OpenAI calls. |
| `app/api/flyer/start/route.ts` | Added `occasion` validation (required) |
| `app/api/flyer/callback/route.ts` | Routes to template path or composite path based on payload |
| `app/api/flyer/status/[jobId]/route.ts` | Uses `acquireRenderLock` for dedup; new render trigger condition |

## Files Updated (Minimal)

| File | Key Changes |
|------|-------------|
| `lib/kv.ts` | `completeJob` new signature; `completeJobComposite` renamed params; new `acquireRenderLock()` |
| `app/api/flyer/render-hires/route.ts` | Template path vs composite path; new job-ready guard |
| `app/api/flyer/refine/route.ts` | Body uses `TemplateCopy`, `templateId`, `paletteIndex` |
| `components/ControlPanel.tsx` | `STYLE_OPTIONS` → `OccasionPicker` + `VibePicker`; Step 3 review updated |
| `hooks/useGenerator.ts` | `handleComplete` guard, `VersionEntry` construction, `refine()` payload |

## Files Preserved (Zero Changes)

`StudioLayout.tsx`, `CanvasPanel.tsx`, `RefinementChat.tsx`, `VersionStrip.tsx`,
`DownloadModal.tsx`, `AssetUploader.tsx`, `FloatingField.tsx`, `StylePreview.tsx`,
`hooks/usePolling.ts`, `lib/constants.ts`, `app/api/flyer/composite/route.ts`

---

## `// REVIEW:` Markers

| File | Marker | Deferred Work |
|------|--------|---------------|
| `app/api/flyer/render-hires/route.ts` | Composite hi-res path | Uses prerendered image + resize only — full scale re-render deferred |
| `app/api/flyer/render-hires/route.ts` | `bgColor` fallback | Hardcoded `#FAEDE3` — should read from template primary palette |
| `hooks/useGenerator.ts` | `copy as TemplateCopy` | Refinement of composite jobs uses cast — deferred to composite refactor |
| `lib/types.ts` | Legacy fields on `JobMeta` | Remove `legacyCopy/legacyDesignSpec/legacyDallePrompt` when composite branch is refactored |
| `lib/satori-render.ts` | Auto-fit heuristic | Char-count estimate may under/over-fit for short words or CJK text |

---

## Manual Next Steps

1. **Update n8n workflow** — see `docs/n8n-contract.md`:
   - Add template selection logic (read `preferences.occasion` + `preferences.vibe`)
   - Add GPT-4o-mini node for copy generation with slot character budgets in prompt
   - Add Claude Haiku tone-review node for sympathy occasions
   - Update callback to POST `{ templateId, copy, paletteIndex }` instead of `{ design_spec, dalle_prompt }`

2. **Add more templates** — create JSON + background PNG for each new occasion:
   - `sympathy_soft_01`, `congrats_bold_01`, `business_clean_01`, `invitation_elegant_01`
   - Run `node scripts/create-backgrounds.mjs` for each (update the script)
   - Register in `docs/n8n-contract.md` Available Templates table

3. **Deploy to Vercel** — the app builds clean; push to GitHub and connect to Vercel
