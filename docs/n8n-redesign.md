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
    "additionalContext": "string (the user's full free-text description)",
    "occasion": "birthday | sympathy | congrats | business | invitation | happy_new_month | mothers_day | fathers_day | valentines_day | eid | christmas | new_year | easter | independence_day",
    "vibe": "elegant | warm | playful | bold | church | minimal",
    "tagline": "string",
    "eventDate": "string",
    "venue": "string",
    "contactInfo": "string",
    "region": "string"
  },
  "hasUserAssets": false,
  "recentThemes": ["theme_id_1", "theme_id_2"],
  "recentPairings": ["pairing_id_1"]
}
```

`recentThemes` contains the last 1–3 theme IDs used in this user session (keyed by hashed IP+date, 24h TTL). May be an empty array on first use.

`recentPairings` contains the last 1–3 typography pairing IDs used in this session. May be empty on first use.

> **Accent color removed (2026-05-16):** `primaryColor` is no longer sent in the preferences payload. Text colors are now defined per-theme in `lib/render/themes.ts` (`textColorAccent` for headline/signoff, `textColorLegibility` for name/body) and applied directly by the Satori renderer. No canvas sampling, no user-facing color picker.

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
USER DESCRIPTION: {preferences.additionalContext}
DATE (if any): {preferences.eventDate}
VENUE (if any): {preferences.venue}
CONTACT (if any): {preferences.contactInfo}
REGION: {preferences.region}
RECENT_THEMES (do not reuse): {recentThemes}
RECENT_PAIRINGS (avoid reusing): {recentPairings}

Default aesthetic: clean, modern, internationally appealing.
Do NOT assume any specific cultural, regional, or religious background.
Do NOT introduce culturally-specific visual motifs such as Adinkra symbols, kente patterns, mandalas, mehndi, Celtic knots, fleurs-de-lis, or any other regionally-coded decoration unless the user's notes EXPLICITLY mention a specific culture, country, or tradition.
When no cultural cue is present, lean toward universal motifs: florals, geometric shapes, soft gradients, abstract patterns, watercolor washes, light textures.

Before writing any copy, internally identify these five elements from the user's description:

SENDER — who is creating this card? Look for cues: "from [name]", "love, [name]", "I want to send", "my best friend's", "we are celebrating", "signed [name]". If no sender is identifiable, leave blank — do NOT invent a sender name.

RECIPIENT — who is this card addressed to? This is the entity receiving the message. For "card for the Mensah family on the loss of their father" → recipient is "The Mensah Family". For "birthday card for Ama" → recipient is "Ama". For "Kojo's Barbershop promo" → recipient is the business's audience (implicit).

SUBJECT (if different from recipient) — who or what is the card about? In sympathy cards, the subject is the deceased; the recipient is the grieving family. In birthday cards, subject = recipient. In a business promo, subject = the business.

RELATIONSHIP — how does the sender relate to the recipient and/or subject? Best friend? Family member? Professional acquaintance? Business owner to customer? Stranger? This shapes warmth and intimacy of voice.

EMOTIONAL REGISTER — what is the sender feeling? The user's own words are the clearest signal. "His death is a huge blow to all of us" → sender is grieving. "She's so kind and amazing" → sender is celebrating. Preserve this register in the copy — don't flatten it into stock language.

Use these five elements to write copy that sounds like it came from a real person, not a template.

STRUCTURAL RULE — recipient_name extraction:
Before finalizing the recipient_name field, check: does the user's input contain the word "family," "household," "team," "group," or any collective noun referring to the recipient? If yes, the recipient_name MUST include that collective noun.
Specifically:
- "the Mensah family" → recipient_name = "The Mensah Family" (never "The Mensah," never "Mensah")
- "the Asante household" → recipient_name = "The Asante Household"
- "the Boateng family" → recipient_name = "The Boateng Family"
- "Mrs. Boateng and her children" → recipient_name = "The Boateng Family" (synthesize natural collective form)
- "the team at Vodafone" → recipient_name = "The Vodafone Team"

Dropping the collective noun is wrong. "The Mensah" alone is never a valid recipient_name. If the user wrote "family," the output must include "Family."

For singular individuals without collective context, normal extraction applies:
- "Ada" → recipient_name = "Ada"
- "Kojo's Barbershop" → recipient_name = "Kojo's Barbershop"
- "my best friend AMA" → recipient_name = "Ama"

Produce JSON in EXACTLY this shape:

{
  "copy": {
    "headline": "string — 14-22 chars ideal, max 28",
    "recipient_name": "Primary addressee extracted from the user's description — person, family group, or business. See extraction rules below. Maximum 30 characters.",
    "body": "string — 50-90 chars ideal, max 130, 1-2 sentences",
    "signoff": "string — 8-18 chars ideal, max 24",
    "date": "OPTIONAL — if a date or time is found in the form fields or user description, include it. Otherwise OMIT this field entirely.",
    "venue": "OPTIONAL — if a location or address is found in the form fields or user description, include it. Otherwise OMIT this field entirely.",
    "contact_url": "OPTIONAL — if a phone number, email, URL, or social handle is found in the form fields or user description, include it. Otherwise OMIT this field entirely.",
    "tagline": "OPTIONAL — if a short punchy tagline phrase is found in the form fields or user description (for invitations / promos), include it. Otherwise OMIT this field entirely."
  },
  "design_brief": {
    "palette_mood": "string describing color direction",
    "decorative_direction": "string describing visual motifs and where they sit",
    "energy_tags": ["array", "of", "mood", "tags"],
    "layoutId": "one of: centered_framed | asymmetric_diagonal | top_heavy | magazine_split | vignette_center | banner_horizontal | hero_name_radial",
    "typographyId": "one of: classical_elegant | modern_clean | bold_impact | romantic_serif | warm_handwritten | minimal_swiss | script_romance | editorial_serif | playful_display | bold_geometric | warm_personal | urban_modern",
    "decoration_density": "one of: sparse | moderate | rich",
    "decorative_theme": "one of the 12 theme IDs listed below",
    "text_treatment": "description of the empty text zone, e.g. soft cream wash with subtle paper texture"
  }
}

Rules:

CRITICAL — slot semantics:
- recipient_name: The primary addressee. The recipient_name slot is the visual hero — it renders in the largest, most prominent typography and must stand alone. Maximum 30 characters.
  Extraction rules:
  - Single person named → use natural casing. "my best friend AMA" → "Ama" (not AMA).
  - Family group → include the family designation. "the Mensah family" → "The Mensah Family". "the Asante household" → "The Asante Household". NEVER extract just a bare surname — "The Mensah" is always wrong.
  - Synthesized family → "Mrs. Boateng and her children" → "The Boateng Family".
  - Business → use business name as given. "Kojo's Barbershop" → "Kojo's Barbershop".
  - Sympathy cards → extract the RECIPIENT of the card (the grieving family), not the deceased. For "card for the Mensah family on the loss of their father Mr. Edward" → "The Mensah Family" (Mr. Edward is the subject, not the recipient).
  - No identifiable name → set to "" (empty string). Do NOT invent.
  Extraction examples:
  - 'birthday card for Ada' → 'Ada'
  - 'the Mensah family on the loss of their father' → 'The Mensah Family'
  - 'birthday card for Ama, my best friend' → 'Ama'
  - 'Kojo's Barbershop promo' → 'Kojo's Barbershop'
  - 'housewarming from Esi and Kwame' → 'Esi & Kwame'
  - 'a warm card for my landlord' → '' (no name given)
  - 'birthday card for my best friend' → '' (no name given)
- headline is the short creative phrase that frames the recipient_name. It is small, sits above or below the name. Examples: 'HAPPY BIRTHDAY' (above the name), 'CONGRATULATIONS' (above the name), 'IN LOVING MEMORY OF' (above the name).
- body is the longer warm message.
- signoff is the short closer.

Headline clarity rule:
The headline must make the occasion unambiguous on its own — the card may be seen without context. For each occasion, the headline must include at least one word that signals the occasion:
- Birthday: include 'BIRTHDAY', 'BDAY', 'HAPPY [age]TH BIRTHDAY', 'HAPPY BIRTHDAY [name]', or similar. 'HAPPY 25TH' alone is NOT acceptable — it must pair with 'BIRTHDAY' or a name to make occasion obvious.
- Sympathy/Memorial: include 'IN MEMORY', 'WITH SYMPATHY', 'REST IN PEACE', 'IN LOVING MEMORY', 'FOREVER REMEMBERED', or similar.
- Congratulations: include 'CONGRATULATIONS', 'CONGRATS', 'WELL DONE', 'YOU DID IT', or similar.
- Business Promo: the business name plus the offering or value prop (e.g. 'FRESH CUTS', 'NEW MENU', 'GRAND OPENING').
- Invitation: include 'YOU'RE INVITED', 'JOIN US', 'SAVE THE DATE', or the event name (e.g. 'HOUSEWARMING', 'BABY SHOWER').
Stay within the 28-character headline budget. If the literal occasion word doesn't fit, abbreviate creatively while preserving clarity (e.g. 'BDAY' instead of 'BIRTHDAY', 'CONGRATS' instead of 'CONGRATULATIONS').

Recipient name prominence:
Treat the recipient_name as the single most important visual element on the card. The headline supports it; the name is the hero. Choose copy that lets the name breathe — don't bury it in a long compound headline. If the headline is short and punchy ('HAPPY BIRTHDAY' or 'CONGRATULATIONS!'), the name has room to dominate. If you find yourself writing a 25-character headline AND a long name AND a 130-character body, prioritize: trim the headline so the name's typography can be larger downstream.

Easter egg behavior:
If the user description is fewer than ~5 characters, contains no recognizable words, or is clearly nonsense (e.g. 'asdf', 'kkkk', '...', '?'), treat this as an easter egg request. Generate a card that is playful, chaotic-but-charming, and surprising — something that leans hard into the selected occasion and vibe but with a self-aware, fun twist. The card should feel like a delightful surprise, not a generic fallback. Examples of the spirit: a 'mystery person' birthday card that's warm and absurd, a sympathy card with quietly witty phrasing, a business card for a 'definitely real business.' Stay within the picked occasion and vibe — chaos-birthday-playful, not chaos-into-anything. Set recipient_name to something playful like 'Mystery Guest', 'You', or leave it empty depending on what reads best. All character budget rules still apply.

Free-text extraction (always active):
Even when the Date, Venue, Tagline, and Contact form fields are empty (they are hidden for non-invitation/business occasions), the user may still include this information in their free-text description.
Always scan USER DESCRIPTION for:
- Date or time references: "this Saturday", "July 19", "7pm", "next Friday"
- Locations or addresses: "23 Oxford Street", "The Grand Ballroom", "our place"
- Phone numbers, emails, URLs, social handles: "+233 24 123 4567", "tickets@example.com", "@handle"
- Tagline-style phrases: "the night you won't forget", "where flavor meets passion"
Priority: form field values (DATE / VENUE / CONTACT above) always take priority. Use free-text extraction only as a fallback when those fields are empty.
If a value is found from either source, include it in the copy JSON under the appropriate optional field.
If no value is found from any source, OMIT the field entirely — do not invent placeholder text.

Layout selection guidance:

Pick the layoutId that genuinely best serves THIS card's emotional register AND content length. Vary your choice across generations — do not default to the same layout repeatedly.

Content-length rules (mandatory):
- If body length is over 70 characters: use centered_framed, top_heavy, magazine_split, or vignette_center. These have larger body zones.
- If body length is under 70 characters AND recipient_name is one or two words: hero_name_radial and banner_horizontal become available.
- Use asymmetric_diagonal for body length 50-90 characters with a clean modern feel.

Emotional fit guidance:
- sympathy: vignette_center or centered_framed (somber, framed)
- business: magazine_split or banner_horizontal (clean, promotional)
- birthday: prefer centered_framed, vignette_center, or hero_name_radial — the name should dominate; only use asymmetric_diagonal or top_heavy when the copy weight genuinely calls for it
- congrats: hero_name_radial if name is short, otherwise centered_framed
- invitation: banner_horizontal or magazine_split (event details need readability)

Layout character guide:
- centered_framed — short headlines, prominent name, formal occasions, sympathy, birthday
- vignette_center — when decoration creates a natural frame around centered text
- hero_name_radial — when the recipient name is the entire focal point (best for short single names)
- asymmetric_diagonal — energetic, modern, congratulations, casual celebrations
- top_heavy — when there's substantial body text below a punchy headline
- magazine_split — business promos, invitations with date/venue info
- banner_horizontal — invitations, event announcements

Centering bias: for cards where someone's name is the main subject (birthdays, anniversaries, personal milestones, sympathy), default to centered_framed, vignette_center, or hero_name_radial unless a specific content-length rule prevents it.

Critical: if you pick hero_name_radial or banner_horizontal, you MUST keep the body under 70 characters. Adjust the body copy to fit, do not pick a layout that doesn't fit the content.

Voice rules by occasion:

sympathy / memorial:
  - Address: FIRST-PERSON from sender to the grieving recipients. The card goes TO the family, FROM the sender.
  - Tone: grieve WITH them, not tribute-paying. The body is not a eulogy. The body is a human saying "I'm here."
  - What to include: acknowledge the loss, mention the deceased by name (using whatever the user gave — "Mr. Edward Mensah," not just "your beloved"), echo the sender's own emotional words.
  - What to AVOID: third-person tributes ("leaves behind a legacy"), stock memorial phrases ("tender season," "indelible legacy," "treasured spirit"), anything that reads like an obituary insert.
  - Good: "I grieve with you on the loss of Mr. Edward. He was a great man, and his absence will be felt by everyone who knew him."
  - Bad: "Mr. Edward Mensah leaves behind a legacy of greatness. May his memory be a source of comfort in this tender season."

birthday:
  - When sender IS identifiable: first-person from sender to recipient. Warm, personal, specific to what the user shared.
  - When sender is NOT identifiable: warm direct address to the recipient ("Today is YOUR day, Ama"). Never corporate or cold.
  - Match the energy — quiet pride vs. loud celebration — to the user's own tone.

congrats:
  - First-person celebration when sender is identifiable, otherwise direct celebration addressed to recipient.
  - Match the user's energy: quiet pride ("So proud of you") vs. loud joy ("YOU DID IT!").

business / promo:
  - Brand voice — "we" or branded second-person ("you'll love..."). NOT personal-from-an-individual.
  - Promotional, direct, benefit-led.

invitation:
  - Hosts-to-guests. "Join us," "we'd love to have you," "you're invited."
  - When sender is named, include as host: "Esi and Kwame invite you to their housewarming."
  - Extract date/venue/contact into the appropriate optional fields, not the body.

happy_new_month: hopeful, fresh-start energy, brief and uplifting
mothers_day: deeply warm, gratitude-focused, sentimental
fathers_day: warm but understated, appreciation-focused
valentines_day: romantic OR platonic warmth, never saccharine
eid: respectful, joyful, blessing-focused
christmas: warm, festive, family-oriented
new_year: hopeful, reflective, forward-looking
easter: gentle, hopeful, renewal-focused
independence_day: proud, celebratory, community-oriented

Copy-writing principles (apply to all occasions):

1. Polish the user's language; don't erase it.
   The user's words are raw material, not noise. "He was such a great man and his death is a huge blow to all of us" → keep the emotional core: "He was a great man, and losing him is felt by everyone who knew him." Do NOT replace with: "His memory leaves an indelible legacy." That erases the user's voice.

2. Specificity over generality.
   When the user names a relationship, role, or quality — use it. If they said "Mr. Edward Mensah," keep "Mr. Edward Mensah," not "your beloved father." If they said "she's so kind," write "kind" — not "a treasured soul."

3. Avoid greeting-card boilerplate.
   NEVER write these phrases: "tender season," "indelible legacy," "loving memory of a treasured spirit," "in this difficult time of grief," "may you find comfort in the memories," "forever in our hearts," "gone but not forgotten."
   Real people write: "I'm so sorry," "we'll miss him," "thinking of you," "I'm here for you."

4. Match the user's diction level.
   Casual input ("she's so amazing") → warm casual output ("You're amazing, Ama — here's to 25!").
   Formal input ("the loss of their esteemed father") → formal output ("With deepest condolences on the passing of Mr. Edward Mensah").
   Don't elevate casual to formal or flatten formal to casual.

5. Signoff carries sender voice.
   "With deep sympathy" is acceptable only when sender is unknown.
   When a sender is identified: use their name or relationship — "— Efua", "Thinking of you all, [sender name]", "Love, your friend".

Typography guidance:

VARY your typographyId — never default to the same pairing repeatedly. Check RECENT_PAIRINGS and pick something different.

Pairing catalog (hero = name slot, the largest typography on the card):
- classical_elegant  — Playfair Display serif hero — formal occasions, anniversaries, milestone celebrations, church
- modern_clean       — Inter sans hero — minimalist business, professional, contemporary
- bold_impact        — Bebas Neue condensed hero — energetic congratulations, loud celebrations, announcements
- romantic_serif     — Allura script hero — anniversaries, valentines_day, deeply tender
- warm_handwritten   — Caveat casual script hero — casual heartfelt notes, close-friend birthdays (use sparingly; warm_personal often fits better for birthdays)
- minimal_swiss      — Montserrat geometric hero — sophisticated minimalism, design-forward, formal modern
- script_romance     — Great Vibes formal script hero — weddings, ceremonial, classic invitations
- editorial_serif    — Cormorant Garamond serif hero — magazine-feeling, refined sympathy, sophisticated milestones
- playful_display    — Dancing Script hero — fun celebrations, happy_new_month, distinctive personality
- bold_geometric     — Raleway bold hero — brand-forward, posterlike, congrats (bold)
- warm_personal      — DM Serif Display warm serif hero — birthday (warm), mothers_day, fathers_day, personal cards
- urban_modern       — Oswald condensed hero — sharp, contemporary, urban events, bold birthday

Vibe → pairing (starting points — use judgment and avoid RECENT_PAIRINGS):
- elegant → classical_elegant, romantic_serif, or editorial_serif
- warm    → warm_personal, warm_handwritten, or classical_elegant (rotate — do not always pick warm_handwritten)
- playful → playful_display, bold_impact, or urban_modern
- bold    → bold_impact, bold_geometric, or urban_modern
- church  → classical_elegant, script_romance, or editorial_serif
- minimal → minimal_swiss or modern_clean

Anti-default: if RECENT_PAIRINGS contains your first-choice pairing, pick your second or third choice instead. Variety is required.

Decoration density:
Choose decoration_density based on vibe:
- sparse (default for: warm, elegant, minimal): few decorative elements, abundant breathing room, restraint is the aesthetic. Think: 'two watercolor florals in opposite corners with gold dust accents.' This is the default for premium-feeling cards.
- moderate (default for: church, playful): balanced decoration, enough to feel rich but not crowded. Decoration occupies clearly bounded zones.
- rich (default for: bold, festive contexts): dense, layered decoration. Use sparingly — most cards should not be rich.

When in doubt, default to sparse. Sparse cards photograph better, feel more premium, and are harder to make ugly.

Decorative theme selection:

You MUST pick a decorative_theme from the 12 available themes below. The theme defines the visual aesthetic of the card's decoration and is injected directly into the GPT image prompt.

RECENT_THEMES contains the themes used in the user's last 1-3 generations. You MUST avoid these — pick something visually distinct each time.

Selection process:
1. Filter the 12 themes to those compatible with the chosen occasion AND vibe (compatibility table below).
2. Exclude any themes in RECENT_THEMES.
3. Pick the most emotionally fitting from what remains.
4. Edge case: if all compatible themes are in RECENT_THEMES, pick the compatible theme least recently used.

Available themes (id: description):
- watercolor_florals_sparse: soft florals in two corners, elegant hand-painted washes
- abundant_garden_borders: lush full-bloom floral borders covering 2-3 edges
- geometric_confetti: scattered circles, triangles, confetti — playful and modern
- celestial_dust: gold stars, sparkles, constellations — dreamy and ethereal
- minimalist_line_botanical: single fine ink line drawing of a branch or stem — very quiet
- vintage_paper_texture: aged paper, wax seals, deckle edges — timeless and quiet
- balloon_streamer: festive balloons and streamers — energetic and celebratory
- soft_brush_strokes: abstract painterly watercolor washes — purely textural
- botanical_herbarium: pressed-leaf naturalist illustration — refined and precise
- geometric_art_deco: gold linear frames, fan motifs, sunburst — elegant and structured
- watercolor_abstract: cloudy drifting washes of colour — atmospheric and dreamy
- sunset_gradient: warm cream-to-peach-to-gold gradient — modern and vibe-driven

Compatibility (occasion | compatible themes):
birthday         : watercolor_florals_sparse, abundant_garden_borders, geometric_confetti, celestial_dust, minimalist_line_botanical, balloon_streamer, geometric_art_deco, watercolor_abstract, sunset_gradient
sympathy         : watercolor_florals_sparse, abundant_garden_borders, celestial_dust, minimalist_line_botanical, vintage_paper_texture, soft_brush_strokes, botanical_herbarium, watercolor_abstract
congrats         : watercolor_florals_sparse, abundant_garden_borders, geometric_confetti, celestial_dust, balloon_streamer, soft_brush_strokes, botanical_herbarium, geometric_art_deco, watercolor_abstract, sunset_gradient
invitation       : watercolor_florals_sparse, abundant_garden_borders, geometric_confetti, celestial_dust, minimalist_line_botanical, vintage_paper_texture, balloon_streamer, soft_brush_strokes, botanical_herbarium, geometric_art_deco, sunset_gradient
business         : minimalist_line_botanical, vintage_paper_texture, soft_brush_strokes, botanical_herbarium, geometric_art_deco
happy_new_month  : watercolor_florals_sparse, abundant_garden_borders, geometric_confetti, minimalist_line_botanical, balloon_streamer, soft_brush_strokes, watercolor_abstract, sunset_gradient
mothers_day      : watercolor_florals_sparse, abundant_garden_borders, soft_brush_strokes, botanical_herbarium, watercolor_abstract
fathers_day      : minimalist_line_botanical, vintage_paper_texture, soft_brush_strokes, botanical_herbarium, geometric_art_deco, sunset_gradient
valentines_day   : watercolor_florals_sparse, abundant_garden_borders, celestial_dust, soft_brush_strokes, watercolor_abstract
eid              : celestial_dust, vintage_paper_texture
christmas        : celestial_dust, vintage_paper_texture, geometric_art_deco
new_year         : geometric_confetti, celestial_dust, balloon_streamer, geometric_art_deco, sunset_gradient
easter           : watercolor_florals_sparse, abundant_garden_borders, celestial_dust, minimalist_line_botanical, vintage_paper_texture, soft_brush_strokes, botanical_herbarium, watercolor_abstract
independence_day : watercolor_florals_sparse, geometric_confetti, minimalist_line_botanical, balloon_streamer, sunset_gradient

Compatibility (vibe | compatible themes):
elegant  : watercolor_florals_sparse, abundant_garden_borders, celestial_dust, minimalist_line_botanical, vintage_paper_texture, soft_brush_strokes, botanical_herbarium, geometric_art_deco, watercolor_abstract
warm     : watercolor_florals_sparse, abundant_garden_borders, geometric_confetti, celestial_dust, vintage_paper_texture, balloon_streamer, soft_brush_strokes, watercolor_abstract, sunset_gradient
playful  : geometric_confetti, balloon_streamer
bold     : geometric_confetti, balloon_streamer, geometric_art_deco, sunset_gradient
church   : abundant_garden_borders, minimalist_line_botanical, vintage_paper_texture, botanical_herbarium
minimal  : watercolor_florals_sparse, celestial_dust, minimalist_line_botanical, soft_brush_strokes, botanical_herbarium, watercolor_abstract, sunset_gradient

Sender awareness:
If the user's notes mention WHO is sending the card (e.g. 'from his sister', 'love from Mama', 'on behalf of the team'), incorporate the sender naturally into the signoff. Examples:

- User notes: 'for my mom, from her daughter Ada'
  → signoff: 'With love, Ada' or 'Always, your daughter Ada'

- User notes: 'from the team at Kojo's Barbershop'
  → signoff: 'The Kojo's Barbershop Team'

- User notes: 'love from grandma'
  → signoff: 'With love, Grandma'

If no sender is mentioned, use a warm impersonal closer like 'With love', 'Warmly', 'Thinking of you', etc. — depending on occasion tone.

The sender mention should feel natural and warm, never formulaic. Don't append the sender as a separate line if it doesn't read smoothly with the closer.

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
4. `copy.body.length <= 130`
5. `copy.signoff.length <= 24`
6. `design_brief.layoutId` is one of the 7 valid layoutId values
7. `design_brief.typographyId` is one of the 12 valid typographyId values
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
if (parsed.copy && typeof parsed.copy.recipient_name === 'string' && parsed.copy.recipient_name) {
  parsed.copy.recipient_name = sanitizeRecipientName(parsed.copy.recipient_name);
}

const validOccasions = [
  'birthday', 'sympathy', 'congrats', 'business', 'invitation',
  'happy_new_month', 'mothers_day', 'fathers_day', 'valentines_day',
  'eid', 'christmas', 'new_year', 'easter', 'independence_day'
];
const validLayouts = ['centered_framed', 'asymmetric_diagonal', 'top_heavy', 'magazine_split', 'vignette_center', 'banner_horizontal', 'hero_name_radial'];
const validTypography = ['classical_elegant', 'modern_clean', 'bold_impact', 'romantic_serif', 'warm_handwritten', 'minimal_swiss', 'script_romance', 'editorial_serif', 'playful_display', 'bold_geometric', 'warm_personal', 'urban_modern'];
const validDensity = ['sparse', 'moderate', 'rich'];
const validThemes = [
  'watercolor_florals_sparse', 'abundant_garden_borders',
  'geometric_confetti', 'celestial_dust', 'minimalist_line_botanical',
  'vintage_paper_texture', 'balloon_streamer', 'soft_brush_strokes',
  'botanical_herbarium', 'geometric_art_deco', 'watercolor_abstract',
  'sunset_gradient'
];

const errors = [];
if (!parsed.copy) errors.push('missing copy');
else {
  if (!parsed.copy.headline || parsed.copy.headline.length > 28) errors.push(`headline length ${parsed.copy.headline?.length} exceeds 28`);
  if (typeof parsed.copy.recipient_name !== 'string' || parsed.copy.recipient_name.length > 30) errors.push(`recipient_name must be a string, max 30 chars`);
  if (!parsed.copy.body || parsed.copy.body.length > 130) errors.push(`body length ${parsed.copy.body?.length} exceeds 130`);
  if (!parsed.copy.signoff || parsed.copy.signoff.length > 24) errors.push(`signoff length exceeds 24`);
}
if (!parsed.design_brief) errors.push('missing design_brief');
else {
  if (!validLayouts.includes(parsed.design_brief.layoutId)) errors.push(`invalid layoutId: ${parsed.design_brief.layoutId}`);
  if (!validTypography.includes(parsed.design_brief.typographyId)) errors.push(`invalid typographyId: ${parsed.design_brief.typographyId}`);
  if (!validDensity.includes(parsed.design_brief.decoration_density)) errors.push(`invalid decoration_density: ${parsed.design_brief.decoration_density}`);
  if (!validThemes.includes(parsed.design_brief.decorative_theme)) errors.push(`invalid decorative_theme: ${parsed.design_brief.decorative_theme}`);
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
const THEMES_DECORATION_PROMPTS = {
  watercolor_florals_sparse: 'Soft watercolor florals in muted peach, blush, or cream tones. Two small floral clusters in opposite corners with abundant breathing room. Hand-painted feel, gentle washes, no harsh lines.',
  abundant_garden_borders: 'Rich watercolor garden composition with multiple flower types — roses, peonies, eucalyptus leaves, small wildflowers — covering 2-3 edges of the canvas with fullness. Lush but not overwhelming, with clear text zones still respected. Cream, dusty pink, sage green, and gold tones.',
  geometric_confetti: 'Playful geometric confetti scattered in the decorated zones — small circles, triangles, dots, irregular splash shapes, and confetti strands. Mix of bright and pastel tones. Modern and energetic but not chaotic. No floral elements.',
  celestial_dust: 'Subtle celestial decoration — small gold stars, scattered sparkles, soft fairy dust, and tiny constellations. Dreamy and ethereal, mostly negative space with delicate accents. Warm gold and soft cream tones, with optional gentle navy or rose hints. No floral elements.',
  minimalist_line_botanical: 'Single thin continuous line drawing of a botanical element — a leafy branch, simple flower stem, or olive sprig — placed in the decorated zones. Monochrome fine ink line on cream background. Modern, restrained, and quiet. Negative space is the dominant aesthetic.',
  vintage_paper_texture: 'Aged vintage paper aesthetic — soft sepia or cream paper grain, faded ink stamps or wax seal motifs, subtle deckle edges, and old-letter elements. Warm tobacco and ivory tones, possibly with a faint border or aged corner accents. Quiet and timeless. No bright colors.',
  balloon_streamer: 'Festive party decoration — illustrated balloons in primary or pastel colors, curling streamers, confetti bursts, and small celebration accents. Joyful and energetic, occupying the decorated zones with movement. No floral elements.',
  soft_brush_strokes: 'Abstract painterly brush strokes — soft watercolor washes of color in the decorated zones, with no specific objects or shapes. Purely textural. Calming and atmospheric, like watercolor experiments on paper. Warm muted tones.',
  botanical_herbarium: 'Detailed pressed-leaf or pressed-flower botanical illustration in herbarium style — finely rendered single specimens like a fern, eucalyptus branch, or wildflower, on cream paper. Refined and quiet, with naturalist precision. Sage and olive tones, with subtle warm browns.',
  geometric_art_deco: 'Art deco geometric ornament — fine gold linear frames, fan motifs, sunburst patterns, and structured chevron details. Elegant linear precision, no organic shapes. Cream background with gold and deep navy accents.',
  watercolor_abstract: 'Cloudy abstract watercolor washes in the decorated zones — soft drifting clouds of color, no specific shapes or objects. Atmospheric and dreamy. Tones blend softly: blush, lavender, peach, butter yellow, or soft sage. Gentle and understated.',
  sunset_gradient: 'Subtle full-canvas gradient evoking sunrise, sunset, or dusk — soft transitions between warm cream, blush, peach, and golden hues. Minimal additional decoration: perhaps one or two delicate accent shapes. Modern and vibe-driven.',
};

const GPT_ZONE_INSTRUCTIONS = {
  centered_framed: 'The canvas has two regions. Content zone — the rectangle from (x: 200–824, y: 233–791) — will have text overlaid on it. Low-contrast decoration is welcome inside: subtle background washes, paper textures, low-opacity florals, faint geometric flourishes, soft tonal gradients, muted brush strokes, or gentle vignettes. No high-contrast shapes, no solid color blocks, no bright accent splashes inside this zone. Decorative zone — everything outside the rectangle, framing the four canvas edges — has full creative freedom. Vary placement, density, and motifs to feel intentional and balanced. The transition between zones should be gradual, not a hard boundary.',
  asymmetric_diagonal: 'The canvas has two content zones and two decorative zones arranged diagonally. Content zones — (x: 0–512, y: 0–512) upper-left and (x: 512–1024, y: 512–1024) lower-right — will have text overlaid. Inside each: low-contrast decoration only — subtle washes, soft textures, muted tonal gradients, faint low-opacity motifs. No high-contrast shapes, no solid blocks, no bright splashes inside either content zone. Decorative zones — (x: 512–1024, y: 0–512) upper-right and (x: 0–512, y: 512–1024) lower-left — have full creative freedom. Aim for a balanced diagonal flow of decoration. Transitions between zones should be gradual and natural.',
  top_heavy: 'The canvas has two regions. Content zone — the rectangle from (x: 80–944, y: 387–971) — will have text overlaid. Low-contrast decoration is welcome inside: subtle background washes, paper textures, soft tonal gradients, low-opacity florals, gentle vignettes. No high-contrast shapes, no solid blocks, no bright accent splashes. Decorative zone — the upper area (y: 0–387) spanning the full canvas width — has full creative freedom. Rich detail that gradually and naturally fades downward into the content zone. The upper area should feel abundant and vibrant.',
  magazine_split: 'The canvas has two regions. Content zone — the rectangle from (x: 60–580, y: 0–1024) on the left — will have text overlaid. Low-contrast decoration is welcome inside: subtle washes, paper textures, soft gradients, faint low-opacity motifs. No high-contrast elements, no solid blocks, no bright splashes inside. Decorative zone — the right portion (x: 580–1024, y: 0–1024) — has full creative freedom. Use it to make a strong visual statement with rich color and full-bleed detail. The transition at x: 580 should feel natural, not a hard seam.',
  vignette_center: 'The canvas has two regions. Content zone — the rectangle from (x: 200–824, y: 253–771) in the center — will have text overlaid. Subtle decoration is welcome inside: a faint background wash, soft paper texture, or very gentle tonal vignette. The zone should feel open and airy. No medallions, no wreaths, no bold shapes, no high-contrast elements inside. Decorative zone — everything outside this rectangle — forms a soft vignette around all four canvas edges. It should fade naturally inward toward the center zone, atmospheric and delicate, not heavy.',
  banner_horizontal: 'The canvas has two regions. Content zone — the rectangle from (x: 60–964, y: 213–811) — will have text overlaid. Low-contrast decoration is welcome inside: subtle background washes, paper textures, soft tonal gradients, faint low-opacity motifs. No high-contrast shapes, no solid blocks, no bright splashes inside. Decorative zone — the top band (y: 0–213) and bottom band (y: 811–1024) spanning the full canvas width — has full creative freedom. Rich, full-bleed detail that feels like deliberate bookends. Transitions from the bands into the content zone should be gradual and natural.',
  hero_name_radial: 'The canvas has two regions. Content zone — the rectangle from (x: 80–944, y: 467–971) — will have body text overlaid. Low-contrast decoration is welcome inside: subtle washes, paper textures, faint gradients, soft low-opacity motifs. No high-contrast shapes, no solid blocks, no bright splashes. Decorative zone — the upper area (y: 0–467): place a soft radial composition centered around (x: 512, y: 253) with decorative accents radiating outward. The inner sub-rectangle (x: 320–704, y: 160–347) within the decorative zone will also have a name overlaid — keep decoration there low-contrast and text-friendly (same rules as the main content zone). Do not use heavy central elements, medallions, or wreaths. The transition at y: 467 should feel natural.',
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
  `Decorative theme: ${design_brief.decorative_theme}.`,
  `Theme aesthetic: ${THEMES_DECORATION_PROMPTS[design_brief.decorative_theme] || ''}`,
  `Additional decorative direction: ${design_brief.decorative_direction}.`,
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
    "decorative_theme": "watercolor_florals_sparse",
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
