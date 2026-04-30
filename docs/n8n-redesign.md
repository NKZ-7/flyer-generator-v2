# FlyerCraft v2 — n8n Workflow Redesign Spec

This document describes the new n8n workflow that replaces the old text-in-image workflow.
The key architectural change: GPT-image-1 generates a **decoration-only canvas with no text**.
All copy is overlaid programmatically by the Next.js Satori renderer.

---

## 1. Webhook Input

The workflow receives a POST from `/api/flyer/start`:

```json
{
  "jobId": "string",
  "callbackUrl": "string",
  "preferences": {
    "title": "string",
    "additionalContext": "string",
    "occasion": "birthday | sympathy | congrats | business | invitation",
    "vibe": "elegant | warm | playful | bold | church | minimal",
    "tagline": "string",
    "eventDate": "string",
    "venue": "string",
    "contactInfo": "string",
    "region": "string"
  },
  "hasUserAssets": false
}
```

---

## 2. Workflow Stages

### Stage A — Copy + Design Brief (Claude)

**Model selection:**
- `occasion === 'sympathy'` → `claude-sonnet-4-6`
- All other occasions → `claude-haiku-4-5-20251001`

**Full Claude prompt** (substitute `{field}` values dynamically in an n8n Code node):

```
You are writing the words and design direction for a digital greeting card.
Output ONLY valid JSON, no other text, no markdown fences.

OCCASION: {preferences.occasion}
VIBE: {preferences.vibe}
RECIPIENT NAME / TITLE: {preferences.title}
USER NOTES: {preferences.additionalContext}
DATE (if any): {preferences.eventDate}
VENUE (if any): {preferences.venue}
CONTACT (if any): {preferences.contactInfo}
REGION: {preferences.region}

Cultural context: This product serves a primarily West African / Ghanaian audience.
Lean toward warmth, family-respectful tones, and culturally resonant phrasing.
Avoid generic Western greeting-card clichés ("another year older", "sending hugs", etc.).

Produce JSON in EXACTLY this shape:

{
  "copy": {
    "headline": "string — 14-22 chars ideal, max 28",
    "recipient_name": "echo the title/name verbatim, max 30 chars",
    "body": "string — 50-90 chars ideal, max 120, 1-2 sentences",
    "signoff": "string — 8-18 chars ideal, max 24"
  },
  "design_brief": {
    "palette_mood": "string describing color direction",
    "decorative_direction": "string describing visual motifs and where they sit",
    "energy_tags": ["array", "of", "mood", "tags"],
    "layoutId": "one of: centered_framed | asymmetric_diagonal | top_heavy | magazine_split | vignette_center | banner_horizontal | hero_name_radial",
    "typographyId": "one of: classical_elegant | modern_clean | bold_impact | romantic_serif | warm_handwritten | minimal_swiss",
    "text_treatment": "description of the empty text zone, e.g. soft cream wash with subtle paper texture"
  }
}

Rules:
- VARY your layoutId and typographyId choices across runs. Choose what best serves THIS card.
- Match typographyId to vibe:
    elegant -> classical_elegant or romantic_serif
    warm -> warm_handwritten or classical_elegant
    playful -> bold_impact or warm_handwritten
    bold -> bold_impact or modern_clean
    church -> classical_elegant or romantic_serif
    minimal -> minimal_swiss or modern_clean
- Match layoutId to emotional weight:
    celebratory (birthday/congrats) -> hero_name_radial or centered_framed
    sympathy/memorial -> vignette_center or top_heavy
    business promo -> magazine_split or asymmetric_diagonal
    invitation -> banner_horizontal or centered_framed
- Forbidden: cliches, hollow phrases, anything generic.
- The copy should feel personal, not template-stamped.
- Stay within character budgets. Meaning over decoration.
```

Parse the JSON response. Retry once with stricter "Return ONLY a raw JSON object" instruction if parse fails. If second parse fails, fail the job.

Validate: `layoutId` must be one of the 7 valid values; `typographyId` must be one of the 6 valid values.

---

### Stage B — Build GPT Image Prompt

Use a Code node to construct the GPT prompt. Include the layout's zone instructions via an inline lookup map:

```javascript
const GPT_ZONE_INSTRUCTIONS = {
  centered_framed: 'Place decorative elements as a frame around all four edges of the canvas (occupying roughly the outer 12% on each side). Leave the center area (approximately 60% wide x 70% tall) completely empty with a soft cream wash. No decoration intrudes into the central area. The frame should feel deliberate and balanced.',
  asymmetric_diagonal: 'Place dense decorative elements in the upper-right corner and lower-left corner, occupying roughly 35% of the canvas total. Leave the upper-left and lower-right zones empty with a soft cream wash. The diagonal flow from upper-left to lower-right should feel intentional.',
  top_heavy: 'Place rich decorative elements across the upper third of the canvas, gradually fading downward. Leave the lower two-thirds empty with a soft cream wash. The transition between decoration and clean space should feel natural, like a gradient.',
  magazine_split: 'Place dense decorative elements covering the right 40% of the canvas (full height). Leave the left 60% empty with a soft cream wash. The split between decorated and clean zones should feel deliberate, like a magazine cover layout.',
  vignette_center: 'Place decorative elements softly around all edges of the canvas, fading inward. Leave the center 50% x 60% area completely empty with a soft cream wash. The decoration vignettes inward like a soft frame.',
  banner_horizontal: 'Place decorative elements as horizontal bands across the top 20% and bottom 20% of the canvas. Leave the middle 60% empty with a soft cream wash. The bands should feel like bookends to the central clean zone.',
  hero_name_radial: 'Place a bold central decorative element (medallion, wreath, or organic radial shape) in the center-top third, sized so its inner clear area is about 40% wide x 25% tall. Surrounding the medallion, place small scattered decorative accents. Leave a clean cream lower half for body text.',
};

const d = $input.first().json;
const { design_brief, occasion, vibe } = d;
const zoneInstructions = GPT_ZONE_INSTRUCTIONS[design_brief.layoutId] || GPT_ZONE_INSTRUCTIONS.centered_framed;
const tags = Array.isArray(design_brief.energy_tags) ? design_brief.energy_tags.join(', ') : '';

const imagePrompt = [
  'Create a vertical 1024x1536 designed canvas for a greeting card.',
  'This is NOT a finished card -- it is the decorative composition that text will be placed onto later by a separate process.',
  '',
  'CRITICAL: Do NOT include any text, letters, numbers, words, signatures, or written marks anywhere in the image. The image must be entirely text-free.',
  '',
  `Style: ${vibe} for a ${occasion}.`,
  `Color palette: ${design_brief.palette_mood}.`,
  `Decorative elements: ${design_brief.decorative_direction}.`,
  `Energy: ${tags}.`,
  '',
  `Composition: ${zoneInstructions}`,
  '',
  `The empty text zones must be visually treated as: ${design_brief.text_treatment}. These zones are an INTENTIONAL part of the design -- they should feel like deliberate negative space, not blank gaps.`,
  '',
  'Premium quality, professional design, no text whatsoever, no letters, no numbers, no signatures, no watermarks.',
].join('\n');

return [{ json: {
  ...d,
  imagePrompt,
  imageRequestBody: { model: 'gpt-image-1', prompt: imagePrompt, n: 1, size: '1024x1536', quality: 'low' }
} }];
```

---

### Stage C — Generate Canvas (gpt-image-1)

HTTP Request node to `https://api.openai.com/v1/images/generations`:
- Method: POST
- Headers: `Authorization: Bearer {openai_key}`, `Content-Type: application/json`
- Body: `={{ JSON.stringify($json.imageRequestBody) }}`
- `continueOnFail: true`
- **Do NOT include a `response_format` field** — gpt-image-1 always returns `b64_json`

Parse response in a Code node:

```javascript
const input = $input.first();
const prior = $('Build Image Prompt').first().json;
if (input.json.error) {
  const msg = String(input.json.error?.message || input.json.error || '');
  const isPolicy = msg.includes('content_policy');
  return [{ json: { ...prior, imageError: true, contentPolicyError: isPolicy,
    errorMessage: isPolicy
      ? 'Your request was blocked by content filters. Try adjusting your description.'
      : 'Image generation temporarily unavailable. Please try again.' } }];
}
let b64 = null;
try { b64 = input.json.data[0].b64_json; } catch(e) {}
if (!b64) return [{ json: { ...prior, imageError: true, contentPolicyError: false,
  errorMessage: 'Image generation returned empty result.' } }];
return [{ json: { ...prior, gptCanvasBase64: b64, imageError: false } }];
```

---

### Stage D — Vision QA (Claude Sonnet)

Send the canvas to `claude-sonnet-4-6` with vision to verify it is text-free.

**Vision prompt** (Code node):

```javascript
const d = $input.first().json;
const qaPrompt = [
  'You are reviewing a designed canvas before text is overlaid.',
  'The canvas was supposed to be ENTIRELY TEXT-FREE -- no letters, numbers, words, or signatures.',
  '',
  `Intended composition: ${d.design_brief.layoutId} layout -- ${d.design_brief.decorative_direction}`,
  '',
  'Examine the image and respond ONLY with valid JSON (no markdown):',
  '{"no_text_in_image":true,"text_zones_clean":true,"composition_quality_acceptable":true,"notes":""}',
].join('\n');

const visionRequestBody = {
  model: 'claude-sonnet-4-6',
  max_tokens: 256,
  messages: [{ role: 'user', content: [
    { type: 'image', source: { type: 'base64', media_type: 'image/png', data: d.gptCanvasBase64 } },
    { type: 'text', text: qaPrompt }
  ]}]
};
return [{ json: { ...d, visionRequestBody } }];
```

Parse QA result. If `no_text_in_image === false` OR `text_zones_clean === false`:
- Regenerate ONCE with `"ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO WORDS. The image must be 100% text-free.\n\n"` prepended to the original image prompt.
- If second attempt also fails, proceed with the better canvas; set `qa_result.qa_passed = false`.

If Vision QA API call fails for any reason, proceed silently — vision QA is non-fatal.

---

### Stage E — Callback

POST to `{callbackUrl}`:

```json
{
  "jobId": "string",
  "status": "done",
  "designBrief": {
    "palette_mood": "...",
    "decorative_direction": "...",
    "energy_tags": ["..."],
    "layoutId": "centered_framed",
    "typographyId": "warm_handwritten",
    "text_treatment": "..."
  },
  "copy": {
    "headline": "...",
    "recipient_name": "...",
    "body": "...",
    "signoff": "..."
  },
  "gptCanvasBase64": "<raw base64 string, NO data:image/png;base64, prefix>",
  "qa_result": {
    "no_text_in_image": true,
    "text_zones_clean": true,
    "composition_quality_acceptable": true,
    "notes": ""
  }
}
```

On error:
```json
{ "jobId": "string", "status": "error", "error": "Human-readable error message" }
```

**Important**: Send `gptCanvasBase64` as a raw base64 string (no `data:` prefix). The Next.js handler strips the prefix, but raw is cleaner and avoids size overhead.

---

## 3. Models & Estimated Costs

| Step | Model | ~Cost per run |
|------|-------|--------------|
| Copy + design brief | claude-haiku-4-5-20251001 | ~$0.005 |
| Copy + design brief (sympathy) | claude-sonnet-4-6 | ~$0.015 |
| Canvas generation | gpt-image-1 low quality | ~$0.04–0.05 |
| Vision QA | claude-sonnet-4-6 | ~$0.01 |
| Canvas regeneration (if needed) | gpt-image-1 | ~$0.05 |
| **Average per delivered card** | | **~$0.07–0.12** |

---

## 4. Failure Modes

| Failure | Handling |
|---------|---------|
| Claude returns invalid JSON | Retry once with stricter JSON-only instruction. If second fails → fail job. |
| `layoutId` or `typographyId` invalid | Next.js callback validates and fails the job. |
| gpt-image-1 content policy block | Fail job with user-friendly error message. |
| gpt-image-1 returns empty result | Fail job with retry suggestion. |
| Vision QA API error | Proceed silently with the original canvas (non-fatal). |
| Text detected after 2 canvas attempts | Proceed with the better canvas; flag `qa_result.no_text_in_image = false`. |
| Workflow exceeds 90 seconds | Mark failed; client times out after 3 min. |

---

## 5. Migration Notes

The **old workflow** used Claude to generate `design_spec` and `dalle_prompt`, then passed them to DALL-E to render text directly in the image.

The **new workflow** replaces the old workflow entirely:
- GPT-image-1 generates ONLY a decoration canvas (no text)
- The Next.js Satori renderer overlays all copy on top
- Callback shape changes: send `designBrief + copy + gptCanvasBase64`, NOT `imageBase64`

**Do not run both workflows in parallel.** Deactivate the old workflow (`vYs4mThaWUUi7DXW`) before activating the new one.

---

## 6. Webhook Path

Webhook path: `flyer-generate-v2` (unchanged from the old workflow)

The Next.js app at `/api/flyer/start` forwards to `{N8N_WEBHOOK_URL}` — update this env var to point to the new workflow's webhook URL.
