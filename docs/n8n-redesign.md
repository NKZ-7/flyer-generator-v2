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

Default aesthetic: clean, modern, internationally appealing.
Do NOT assume any specific cultural, regional, or religious background.
Do NOT introduce culturally-specific visual motifs such as Adinkra symbols, kente patterns, mandalas, mehndi, Celtic knots, fleurs-de-lis, or any other regionally-coded decoration unless the user's notes EXPLICITLY mention a specific culture, country, or tradition.
When no cultural cue is present, lean toward universal motifs: florals, geometric shapes, soft gradients, abstract patterns, watercolor washes, light textures.

Produce JSON in EXACTLY this shape:

{
  "copy": {
    "headline": "string — 14-22 chars ideal, max 28",
    "recipient_name": "MUST be the user's title input copied verbatim with no additions, no salutations, no modifications. If user typed 'Ada', this is exactly 'Ada'. Maximum 30 characters.",
    "body": "string — 50-90 chars ideal, max 120, 1-2 sentences",
    "signoff": "string — 8-18 chars ideal, max 24"
  },
  "design_brief": {
    "palette_mood": "string describing color direction",
    "decorative_direction": "string describing visual motifs and where they sit",
    "energy_tags": ["array", "of", "mood", "tags"],
    "layoutId": "one of: centered_framed | asymmetric_diagonal | top_heavy | magazine_split | vignette_center | banner_horizontal | hero_name_radial",
    "typographyId": "one of: classical_elegant | modern_clean | bold_impact | romantic_serif | warm_handwritten | minimal_swiss",
    "decoration_density": "one of: sparse | moderate | rich",
    "text_treatment": "description of the empty text zone, e.g. soft cream wash with subtle paper texture"
  }
}

Rules:

CRITICAL — slot semantics:
- recipient_name MUST be a VERBATIM echo of the user's title input. If the user typed 'Ada', recipient_name is 'Ada'. If they typed 'Maa Akosua', it is 'Maa Akosua'. NEVER add words, salutations, or modifications. NEVER write 'Happy Birthday Ada' here. The recipient_name slot is the visual hero — it is rendered in the largest, most prominent typography, and must stand alone.
- headline is the short creative phrase that frames the recipient_name. It is small, sits above or below the name. Examples: 'HAPPY BIRTHDAY' (above the name), 'CONGRATULATIONS' (above the name), 'IN LOVING MEMORY OF' (above the name).
- body is the longer warm message.
- signoff is the short closer.

Layout selection guidance:

Pick the layoutId that genuinely best serves THIS card's emotional register AND content length. Vary your choice across generations — do not default to the same layout repeatedly.

Content-length rules (mandatory):
- If body length is over 70 characters: use centered_framed, top_heavy, magazine_split, or vignette_center. These have larger body zones.
- If body length is under 70 characters AND recipient_name is one or two words: hero_name_radial and banner_horizontal become available.
- Use asymmetric_diagonal for body length 50-90 characters with a clean modern feel.

Emotional fit guidance:
- sympathy: vignette_center or centered_framed (somber, framed)
- business: magazine_split or banner_horizontal (clean, promotional)
- birthday: any layout works; choose based on content length and vibe
- congrats: hero_name_radial if name is short, otherwise centered_framed
- invitation: banner_horizontal or magazine_split (event details need readability)

Critical: if you pick hero_name_radial or banner_horizontal, you MUST keep the body under 70 characters. Adjust the body copy to fit, do not pick a layout that doesn't fit the content.

Typography guidance:
- VARY your typographyId choices across runs. Choose what best serves THIS card.
- Match typographyId to vibe:
    elegant -> classical_elegant or romantic_serif
    warm -> warm_handwritten or classical_elegant
    playful -> bold_impact or warm_handwritten
    bold -> bold_impact or modern_clean
    church -> classical_elegant or romantic_serif
    minimal -> minimal_swiss or modern_clean

Decoration density:
Choose decoration_density based on vibe:
- sparse (default for: warm, elegant, minimal): few decorative elements, abundant breathing room, restraint is the aesthetic. Think: 'two watercolor florals in opposite corners with gold dust accents.' This is the default for premium-feeling cards.
- moderate (default for: church, playful): balanced decoration, enough to feel rich but not crowded. Decoration occupies clearly bounded zones.
- rich (default for: bold, festive contexts): dense, layered decoration. Use sparingly — most cards should not be rich.

When in doubt, default to sparse. Sparse cards photograph better, feel more premium, and are harder to make ugly.

General rules:
- Forbidden: cliches, hollow phrases, anything generic.
- The copy should feel personal, not template-stamped.
- Stay within character budgets. Meaning over decoration.
```

#### Validation rules in the parse node

The n8n parse node (Code node) must check ALL of the following. If ANY check fails, set `parseSuccess: false` and include a `parseError` field describing what failed — this routes into the retry branch:

1. JSON parses cleanly
2. `copy.headline.length <= 28`
3. `copy.recipient_name.length <= 30`
4. `copy.body.length <= 120`
5. `copy.signoff.length <= 24`
6. `design_brief.layoutId` is one of the 7 valid layoutId values
7. `design_brief.typographyId` is one of the 6 valid typographyId values
8. `design_brief.decoration_density` is one of: `'sparse'`, `'moderate'`, `'rich'`

```javascript
const raw = $input.item.json.content[0].text;
let parsed;
try {
  parsed = JSON.parse(raw);
} catch (e) {
  return [{ json: { parseSuccess: false, parseError: 'Invalid JSON: ' + e.message } }];
}

// Sanitize recipient_name: strip salutations/prefixes Claude may have added
function sanitizeRecipientName(raw) {
  if (!raw || typeof raw !== 'string') return raw;
  const prefixPatterns = [
    /^happy\s+birthday\s+/i,
    /^dear\s+/i,
    /^congratulations\s+(to\s+)?/i,
    /^in\s+loving\s+memory\s+of\s+/i,
    /^to\s+/i,
  ];
  let name = raw.trim();
  for (const pat of prefixPatterns) {
    name = name.replace(pat, '').trim();
  }
  return name;
}
if (parsed.copy && parsed.copy.recipient_name) {
  parsed.copy.recipient_name = sanitizeRecipientName(parsed.copy.recipient_name);
}

const validLayouts = ['centered_framed', 'asymmetric_diagonal', 'top_heavy', 'magazine_split', 'vignette_center', 'banner_horizontal', 'hero_name_radial'];
const validTypography = ['classical_elegant', 'modern_clean', 'bold_impact', 'romantic_serif', 'warm_handwritten', 'minimal_swiss'];
const validDensity = ['sparse', 'moderate', 'rich'];

const errors = [];
if (!parsed.copy) errors.push('missing copy');
else {
  if (!parsed.copy.headline || parsed.copy.headline.length > 28) errors.push(`headline length ${parsed.copy.headline?.length} exceeds 28`);
  if (!parsed.copy.recipient_name || parsed.copy.recipient_name.length === 0 || parsed.copy.recipient_name.length > 30) errors.push(`recipient_name is empty or too long after sanitization`);
  if (!parsed.copy.body || parsed.copy.body.length > 120) errors.push(`body length ${parsed.copy.body?.length} exceeds 120`);
  if (!parsed.copy.signoff || parsed.copy.signoff.length > 24) errors.push(`signoff length exceeds 24`);
}
if (!parsed.design_brief) errors.push('missing design_brief');
else {
  if (!validLayouts.includes(parsed.design_brief.layoutId)) errors.push(`invalid layoutId: ${parsed.design_brief.layoutId}`);
  if (!validTypography.includes(parsed.design_brief.typographyId)) errors.push(`invalid typographyId: ${parsed.design_brief.typographyId}`);
  if (!validDensity.includes(parsed.design_brief.decoration_density)) errors.push(`invalid decoration_density: ${parsed.design_brief.decoration_density}`);
}

if (errors.length > 0) {
  return [{ json: { parseSuccess: false, parseError: errors.join('; '), originalAttempt: parsed } }];
}

return [{ json: { parseSuccess: true, ...parsed } }];
```

#### Retry prompt (Build Retry Prompt node)

When `parseSuccess: false`, the retry prompt must include the specific errors from the previous attempt:

```
Your previous attempt failed validation: {parseError}. Fix these specific issues and return JSON only, with all character limits respected exactly.

You are writing the words and design direction for a digital greeting card.
Output ONLY valid JSON, no other text, no markdown fences.

[same full prompt as the original attempt]
```

If the second parse also fails, fail the job.

---

### Stage B — Build GPT Image Prompt

Use a Code node to construct the GPT prompt. Include the layout's zone instructions via an inline lookup map:

```javascript
const GPT_ZONE_INSTRUCTIONS = {
  centered_framed: 'The rectangle from pixel coordinates (x: 200-824, y: 233-791) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns, no lines, no shapes. Only the soft cream wash. Decorative elements are welcome OUTSIDE this rectangle, framing the four edges of the canvas. Be creative with the framing decoration: vary placement, density, and motifs to feel intentional and balanced.',
  asymmetric_diagonal: 'Two empty rectangles must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns: (x: 0-512, y: 0-512) the upper-left zone, and (x: 512-1024, y: 512-1024) the lower-right zone. Only the soft cream wash in those zones. Place decoration freely in the upper-right zone (x: 512-1024, y: 0-512) and the lower-left zone (x: 0-512, y: 512-1024). Aim for a balanced diagonal flow.',
  top_heavy: 'The rectangle from (x: 80-944, y: 387-971) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns. Only the soft cream wash. Decoration belongs in the upper area (y: 0-387), spreading across the top with rich detail that gradually fades downward toward the empty zone.',
  magazine_split: 'The rectangle from (x: 60-580, y: 0-1024) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns. Only the soft cream wash. Decoration covers the right portion (x: 580-1024, y: 0-1024) with full-bleed visual weight. Use this side to make a strong statement.',
  vignette_center: 'The rectangle from (x: 200-824, y: 253-771) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns, no medallions, no wreaths. Only the soft cream wash. Decoration appears softly around all four edges of the canvas, fading inward toward the empty center. The vignette should feel atmospheric, not heavy.',
  banner_horizontal: 'The rectangle from (x: 60-964, y: 213-811) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns, no lines. Only the soft cream wash. Decoration appears as horizontal bands across the top (y: 0-213) and the bottom (y: 811-1024). The bands should feel like deliberate bookends.',
  hero_name_radial: 'The rectangle from (x: 80-944, y: 467-971) must contain ZERO decorative elements — no flowers, no symbols, no leaves, no patterns. Only the soft cream wash. In the upper area (y: 0-467), place a soft radial composition centered around (x: 512, y: 253): scattered light decorative accents radiating outward, with an inner clear area (x: 320-704, y: 160-347) that also remains empty for the recipient name to be overlaid later. Do NOT use heavy central elements, medallions, or wreaths — keep this layout airy and reverent of the central name space.',
};

const d = $input.first().json;
const { design_brief, occasion, vibe } = d;
const zoneInstructions = GPT_ZONE_INSTRUCTIONS[design_brief.layoutId] || GPT_ZONE_INSTRUCTIONS.centered_framed;
const tags = Array.isArray(design_brief.energy_tags) ? design_brief.energy_tags.join(', ') : '';

const imagePrompt = [
  'Create a square 1024x1024 designed canvas for a greeting card.',
  'This is NOT a finished card -- it is the decorative composition that text will be placed onto later by a separate process.',
  '',
  'CRITICAL: Do NOT include any text, letters, numbers, words, signatures, or written marks anywhere in the image. The image must be entirely text-free.',
  '',
  'Empty zones are HARD constraints. Decoration that intrudes into empty zones, even slightly, is a failure. Be precise.',
  '',
  `Style: ${vibe} for a ${occasion}.`,
  `Color palette: ${design_brief.palette_mood}.`,
  `Decorative elements: ${design_brief.decorative_direction}.`,
  `Energy: ${tags}.`,
  '',
  `Decoration density: ${design_brief.decoration_density}.`,
  design_brief.decoration_density === 'sparse'
    ? 'Place only 2-3 small decorative clusters total. Abundant negative space. Restraint is the goal.'
    : design_brief.decoration_density === 'moderate'
    ? '4-6 decorative elements, balanced placement.'
    : 'Dense layered decoration, but never enter the empty zones.',
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
  imageRequestBody: { model: 'gpt-image-1', prompt: imagePrompt, n: 1, size: '1024x1024', quality: 'low' }
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

Send the canvas to `claude-sonnet-4-6` with vision to verify it is text-free and that empty zones are clean.

**Vision prompt** (Code node):

```javascript
const d = $input.first().json;
const zoneInstructions = GPT_ZONE_INSTRUCTIONS[d.design_brief.layoutId] || GPT_ZONE_INSTRUCTIONS.centered_framed;
const qaPrompt = [
  'You are reviewing a designed canvas before text is overlaid.',
  'The canvas was supposed to be ENTIRELY TEXT-FREE — no letters, numbers, words, or signatures of any kind.',
  '',
  `This canvas was generated for a ${d.occasion} card with vibe ${d.vibe}. The chosen layout is ${d.design_brief.layoutId}, which has these EMPTY ZONES that must contain NO decorative elements:`,
  '',
  zoneInstructions,
  '',
  'These empty zones must contain ONLY the soft cream wash. They must NOT contain: flowers, leaves, symbols, patterns, medallions, wreaths, lines, shapes, or any decorative element. Look carefully at each empty zone\'s pixel rectangle.',
  '',
  'Examine the image and answer in JSON, no other text:',
  '{"no_text_in_image":true,"empty_zones_clean":true,"intrusion_details":"","decoration_quality":"","overall_acceptable":true}',
  '',
  'Be strict about empty_zones_clean. A wreath, medallion, or any decorative element placed in an empty zone is a failure. The empty zones must look like clean cream space.',
].join('\n');

const visionRequestBody = {
  model: 'claude-sonnet-4-6',
  max_tokens: 512,
  messages: [{ role: 'user', content: [
    { type: 'image', source: { type: 'base64', media_type: 'image/png', data: d.gptCanvasBase64 } },
    { type: 'text', text: qaPrompt }
  ]}]
};
return [{ json: { ...d, visionRequestBody } }];
```

Parse QA result. If `no_text_in_image === false` OR `empty_zones_clean === false`:
- Regenerate ONCE with `"ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS, NO WORDS. The image must be 100% text-free. Empty zones must contain ZERO decoration.\n\n"` prepended to the original image prompt.
- If second attempt also fails, proceed with the better canvas; set `qa_result.overall_acceptable = false`.

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
    "decoration_density": "sparse",
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
    "empty_zones_clean": true,
    "intrusion_details": "",
    "decoration_quality": "",
    "overall_acceptable": true
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
