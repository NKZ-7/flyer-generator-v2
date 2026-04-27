# n8n ↔ FlyerCraft v2 Contract

This document describes the webhook input and callback output shapes between the Next.js app and
the n8n workflow. Keep this in sync whenever you update either side.

---

## 1. Webhook Input (Next.js → n8n)

The `/api/flyer/start` and `/api/flyer/refine` routes POST this body to `N8N_WEBHOOK_URL`:

```json
{
  "jobId": "uuid-v4",
  "callbackUrl": "https://your-app.vercel.app/api/flyer/callback",
  "preferences": {
    "title": "Sarah's 30th Birthday",
    "occasion": "birthday",
    "vibe": "warm",
    "tagline": "Three decades of joy",
    "eventDate": "July 19, 2025",
    "venue": "The Grand Ballroom, Accra",
    "contactInfo": "sarah@example.com",
    "additionalContext": "Elegant garden party theme",
    "colorScheme": "warm",
    "fontStyle": "classic",
    "primaryColor": "#C8905A"
  },
  "userAssets": [],
  "hasUserAssets": false
}
```

For refinement requests, `preferences` also contains:
```json
{
  "refinementMessage": "Make the headline more celebratory",
  "currentCopy": { "headline": "...", "body": "...", "signoff": "..." },
  "currentTemplateId": "birthday_warm_01",
  "currentPaletteIndex": 0
}
```

**Auth header:** `x-api-key: <N8N_WEBHOOK_SECRET>`

---

## 2. Available Templates

Templates are registered in `templates/` and loaded by `lib/templates/index.ts`.

| Template ID | Category | Vibes |
|---|---|---|
| `birthday_warm_01` | birthday | warm, elegant, heartfelt |
| `sympathy_soft_01` | sympathy | soft, gentle, minimal, peaceful |
| `congrats_bold_01` | congrats | bold, energetic, celebratory, vibrant |
| `business_clean_01` | business | clean, professional, minimal, corporate |
| `invitation_elegant_01` | invitation | elegant, formal, romantic, classic |

Add new templates by creating the JSON file and updating this table.

---

## 3. n8n Workflow Logic

### Template selection
1. Read `preferences.occasion` to identify the category (e.g. `birthday`)
2. Read `preferences.vibe` to filter by `vibe_tags` if multiple templates exist for the category
3. Choose the best matching template (currently only one per category)
4. Set `recommended_template_id` in the GPT prompt context

### Copy generation (GPT-4o-mini)
Use the prompt template below. Embed slot character constraints directly.

For **sympathy/memorial** occasions: pass the generated copy through Claude Haiku for tone
review (see Section 6). Regenerate once if flagged.

### Validation and retry
- Parse the JSON response from GPT
- Check each slot's text length against `max_chars`
- If any slot overflows, send a corrective prompt once: "The [slot] text is X chars, must be
  under Y. Rewrite it shorter while keeping the meaning."
- After one retry, send whatever you have — the renderer truncates at `hard_max_chars`

---

## 4. Callback Output (n8n → Next.js)

POST to `callbackUrl` with:

### Template path (standard)
```json
{
  "status": "done",
  "jobId": "uuid-v4",
  "templateId": "birthday_warm_01",
  "copy": {
    "headline": "Happy 30th, Sarah!",
    "body": "Three decades of laughter, love, and light.\nJoin us as we celebrate the woman who makes every room brighter.",
    "signoff": "With love — The Johnson Family"
  },
  "paletteIndex": 0
}
```

### Error
```json
{
  "status": "error",
  "jobId": "uuid-v4",
  "error": "Description of what went wrong"
}
```

### Composite/photo path (unchanged from v1)
```json
{
  "status": "done",
  "jobId": "uuid-v4",
  "copy": { "headline": "...", "subheadline": "...", "body": "...", "cta": "...", "tagline": "..." },
  "design_spec": { ... },
  "dalle_prompt": "...",
  "imageBase64": "base64-encoded-png"
}
```

---

## 5. GPT-4o-mini Copy Generation Prompt

```
You are a professional flyer copywriter. Write copy for a {{occasion}} flyer.

CONTEXT:
- Name / Title: {{title}}
- Vibe: {{vibe}}
- Tagline hint: {{tagline}}
- Date: {{eventDate}}
- Venue: {{venue}}
- Extra context: {{additionalContext}}

TEMPLATE: {{recommended_template_id}}
PALETTE INDEX: {{palette_index}} (0 = first palette in template)

Write copy for these slots. Respect the character limits strictly.

SLOTS:
1. headline — max 65 chars (hard limit 80). The main celebratory title. Be warm and specific.
2. body — max 200 chars (hard limit 240). 2-3 sentences of detail: who, what, when/where. Warm tone.
3. signoff — max 55 chars (hard limit 70). A warm closing line or "From: [name]".

Respond with ONLY valid JSON, no markdown:
{
  "headline": "...",
  "body": "...",
  "signoff": "...",
  "recommended_template_id": "birthday_warm_01",
  "palette_index": 0
}
```

---

## 6. Claude Haiku Tone Review Prompt (Sympathy Occasions)

Used after copy generation for `occasion === "sympathy"`.

```
You are reviewing flyer copy for a sympathy or memorial occasion.
Read the copy below and decide if the tone is respectful, gentle, and appropriate for grief.

Copy:
Headline: {{headline}}
Body: {{body}}
Signoff: {{signoff}}

Reply with ONLY a JSON object:
{ "approved": true }   — if the tone is appropriate
{ "approved": false, "reason": "brief explanation" }   — if it needs revision

Do not rewrite the copy. Only evaluate it.
```

If `approved` is false, regenerate the copy with the reason appended to the prompt:
"Previous attempt was rejected because: [reason]. Write a more appropriate version."
