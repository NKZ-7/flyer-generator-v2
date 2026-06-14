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
    "occasion": "birthday | sympathy | motivation | congrats | business | invitation | happy_new_month | mothers_day | fathers_day | valentines_day | eid | christmas | new_year | easter | independence_day",
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

> **Accent color removed (2026-05-16):** `primaryColor` is no longer sent in the preferences payload. Text colors are now defined per-theme in `lib/render/themes.ts` (`textColorAccent` for title/signoff, `textColorLegibility` for body) and applied directly by the Satori renderer. No canvas sampling, no user-facing color picker.

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

TITLE CONSTRUCTION — the title slot replaces both headline and recipient_name. It is the single hero line on the card.

The title must read as a coherent human statement, not two fragments. Fuse the occasion signal and recipient identity into one line.

Per-occasion patterns (starting points — vary them):
- Birthday: 'HAPPY BIRTHDAY, AMA' / 'HAPPY 25TH, AMA!' / 'HERE'S TO YOU, JAMES' / 'MANY MORE, MENSAH FAMILY'
- Sympathy: 'WITH DEEPEST SYMPATHY, MENSAH FAMILY' / 'WE GRIEVE WITH YOU' / 'REMEMBERING MR. EDWARD'
- Congrats: 'CONGRATS, JAMES!' / 'YOU DID IT, AMA!' / 'WELL DONE, DR. MENSAH'
- Business: 'FRESH CUTS AT KOJO'S' / 'GRAND OPENING!' / 'NEW MENU — WHO'S IN?'
- Invitation: 'YOU'RE INVITED!' / 'JOIN US, FRIEND' / 'HOUSEWARMING — ESI & KWAME'
- Motivation: 'YOU GOT THIS' / 'YOU'VE GOT THIS, [NAME]' / 'KEEP GOING' / 'I BELIEVE IN YOU' / 'THINKING OF YOU' / 'FOR [NAME]' / 'STAY STRONG' / 'YOU CAN DO HARD THINGS'
  (avoid clichés: never 'HANG IN THERE', 'CHIN UP', 'BETTER DAYS')

Collective nouns: if the user wrote "family," "household," "team," the title MUST include that word.
- "the Mensah family" → title contains 'Mensah Family' (e.g. 'WITH SYMPATHY, MENSAH FAMILY')
- Never just the surname: 'Mensah' alone is wrong when user wrote 'Mensah family'

Naming rules:
- Natural-case names: "AMA" in input → 'Ama' in title (never 'AMA')
- No invented names: if no name given, use 'YOU' or 'FRIEND' or omit
- Max 36 characters total
- Reads naturally when spoken aloud

Produce JSON in EXACTLY this shape:

{
  "copy": {
    "title": "string — unified hero slot, max 36 chars. One statement fusing occasion signal + recipient. Examples: 'HAPPY BIRTHDAY, AMA' / 'CONGRATS, JAMES!' / 'WITH SYMPATHY, MENSAH FAMILY'. Natural-case names. Family collectives preserved. No invented names.",
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
    "text_treatment": "description of the empty text zone, e.g. soft cream wash with subtle paper texture",
    "focal_motif": "OPTIONAL — empty string or 1-4 word descriptor personalizing the anchor element. Examples: 'graduation cap with diploma scroll', 'paper airplane in flight', 'stethoscope', 'barber razor and comb'. Return empty string when no specific motif emerges from input."
  }
}

Rules:

CRITICAL — slot semantics:
- title: The single hero line — one statement fusing occasion + recipient. See TITLE CONSTRUCTION above. Max 36 chars.
- body: The longer warm message. 50-90 chars ideal.
- signoff: The short closer. 8-18 chars ideal.

Title quality rules:
1. Reads as a coherent human statement — occasion signal + recipient fused, not two fragments.
2. Occasion must be unambiguous — include at least one signal word (BIRTHDAY, SYMPATHY, CONGRATS, INVITED, etc.) unless context makes it obvious.
3. Natural-case names: 'AMA' in input → 'Ama' in title (never 'AMA').
4. No invented names: if no recipient given, use 'YOU' / 'FRIEND' or omit.
5. Family collective nouns preserved: 'Mensah Family' not 'Mensah'.
6. Max 36 characters — trim signal word if needed ('BDAY' not 'BIRTHDAY').
7. Sympathy titles lead with empathy ('WITH SYMPATHY', 'WE GRIEVE WITH YOU') — never a eulogy headline.

Title is the hero:
The title is the single most important visual element — it renders in the largest, most prominent typography. Keep it short and powerful. A tight title ('CONGRATS, JAMES!') has more visual impact than a sprawling one ('HUGE CONGRATULATIONS TO YOU, JAMES!'). If you approach the 36-character budget, trim the occasion signal first — a short title lands harder.

Easter egg behavior:
If the user description is fewer than ~5 characters, contains no recognizable words, or is clearly nonsense (e.g. asdf, kkkk, ..., ?), treat this as an easter egg request. Generate a card that is playful, chaotic-but-charming, and surprising — something that leans hard into the selected occasion and vibe but with a self-aware, fun twist. The card should feel like a delightful surprise, not a generic fallback.
Examples of the spirit: a 'mystery person' birthday card that's warm and absurd, a sympathy card with quietly witty phrasing, a business card for a 'definitely real business.'
Stay within the picked occasion and vibe — chaos-birthday-playful, not chaos-into-anything. The title slot should carry something playful like "Happy Birthday, Mystery Guest", "A Cosmic Celebration", or "Welcome, Person of Mystery" — lean hard into the absurdity rather than defaulting to a generic occasion phrase like "HAPPY BIRTHDAY!". All character budget rules still apply (title ~36, body 130, signoff 24).

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
- If body length is under 70 characters AND title is short (20 characters or fewer): hero_name_radial and banner_horizontal become available.
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
  - Include key practical details (date, time, venue) in the body when the user provided them — see "Invitation and Business Promo bodies" rule below.

motivation:
  - Cards in this category exist to lift the recipient up. The sender is reminding the recipient of their strength, capability, or worth — or quietly supporting them through a hard moment without grief framing.
  - Address the recipient directly in second person ("you," "your"). Always.
  - Avoid greeting-card boilerplate like "Hang in there!" / "Better days ahead!" Real friends don't write that.
  - The body should feel specific to a person, even when the user input is sparse. Use the user's emotional language when they provided it.
  - Never assume the cause. Don't write "I know your divorce has been hard" unless the user mentioned divorce. Stay supportive without naming what isn't named.
  - The card should leave the recipient feeling stronger, more seen, or more capable — not pitied.
  - NEVER use phrases like "I'm so sorry for your loss," "sending condolences," or any grief-coded language for Motivation cards. These belong to sympathy, not motivation.
  - Vibe determines register:
    - warm/heartfelt → quietly supportive, intimate — "I'm here with you, you've got this."
    - bold/energetic → active push, exclamatory — "YOU GOT THIS. KEEP GOING."
    - elegant/classy → measured strength — "You have what it takes. I believe in you."
    - playful/fun → bright and chipper — "Reminder: you're amazing. That's the message."
    - minimal/clean → spare and direct — "Keep going. You're doing it."
    - church/traditional → faith-anchored — "He's with you in this season. You are stronger than you know."

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

REGION SIGNAL HANDLING

If the user provided a region value (from the "Where you're from" field), treat it as soft permission to incorporate region-specific language, idioms, or greeting conventions where culturally fitting. Apply these rules:

Region is a soft signal, not a template. The user's own phrasing always dominates.
- If their description is in standard English with no regional cues, lean neutral with at most one small regional touch.
- If their description already uses regional phrasing, preserve and lightly polish it — do NOT "translate" their voice to neutral or to a different region.

Match register to the occasion, not to the region.
- Sympathy and religious-tinged occasions land most naturally with regional/spiritual phrasing.
- Business promo and motivation should stay relatively neutral — overlay regional touches only if the user's description clearly invites it.
- Birthday, congratulations, invitation, just_because can go either way — read the user's input.

Never use regional language the user did not signal.
- Don't invent slang or local terms the user didn't write.
- Don't use a non-English language (Twi, Swahili, Yoruba, Pidgin, etc.) unless the user wrote in that language, OR the phrase is a widely-recognized regional phrase used in English contexts (e.g., "Ayekoo" in Ghanaian English).
- When unsure whether a phrase will land, choose neutral phrasing.

Region-specific guidance (use sparingly, only when occasion + user voice support it):
- Ghana: "Ayekoo" for congratulations/well-done; "may the Lord richly bless you"; "abundant blessings"; "chale" only in clearly playful contexts. Avoid heavy Twi unless user wrote in Twi.
- Nigeria: "Wishing you plenty good things"; "may God continue to bless your hustle"; "more grease to your elbow". Avoid heavy Pidgin unless user wrote in Pidgin.
- Kenya: "Hongera" for congratulations; "Pole sana" for deep sympathy; "may God bless you mightily". Avoid heavy Swahili unless user wrote in Swahili.
- South Africa: highly variable by community — default to neutral, use regional touches only when user input gives strong cues.
- Other / unrecognized region: stay neutral. Do NOT invent phrases or guess.

When in doubt, lean neutral. A slightly generic card is better than a culturally tin-eared one.
If no region is provided, behavior is unchanged — cultural neutrality remains the default.

Typography guidance:

User typography override (highest precedence):
If the request includes a USER TYPOGRAPHY OVERRIDE line, you MUST use that exact typographyId. The variety rotation rule does not apply when the user has explicitly picked a font. User choice wins over variety.

VARY your typographyId — never default to the same pairing repeatedly. Check RECENT_PAIRINGS and pick something different. (Only applies when no user override is present.)

Pairing catalog (hero = title slot, the largest typography on the card):
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
motivation       : watercolor_florals_sparse, celestial_dust, minimalist_line_botanical, vintage_paper_texture, soft_brush_strokes, botanical_herbarium, watercolor_abstract, sunset_gradient
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

Focal motif selection:
Based on the user's free-text input, infer a focal motif that personalizes the card. The motif is a 1-4 word descriptor of an object, symbol, or scene that visually anchors the recipient's identity, profession, hobby, age, or the occasion's context.

Look for explicit signals:
- Profession: "medical student" → 'stethoscope'; "engineer" → 'gears and tools'; "teacher" → 'open book with pencil'; "chef" → 'whisk with herbs'; "musician" → 'relevant instrument silhouette'
- Hobby: "loves planes" → 'paper airplane in flight'; "soccer fan" → 'soccer ball'; "reader" → 'stack of books'; "gardener" → 'watering can with plants'; "gamer" → 'controller silhouette'
- Age + context: "12 year old loves planes" → 'paper airplane in flight'; "retiring" → 'sunset over open road'; "graduation" → 'graduation cap with tassel'
- Achievement: "Stanford grad" → 'graduation cap with diploma scroll'; "new baby" → 'baby footprints'; "wedding" → 'wedding rings'; "anniversary" → 'two intertwined rings'
- Cultural occasion: "Eid card" → 'crescent moon with star'; "Christmas" → 'evergreen branch with ornaments'; "Independence Day, Ghana" → 'Ghana flag with star'
- Religious (when explicit): "baptism" → 'dove with olive branch'; "first communion" → 'chalice with bread'

When no clear motif emerges: return focal_motif: "" (empty string). Do not invent details. "Birthday card for Ama turning 25" with no other context → return empty.
Aggressive inference: when signal is clear, commit. "Kojo becoming a doctor" → 'stethoscope'. "James graduating Stanford" → 'graduation cap with diploma scroll'.

For Motivation cards, focal motifs should be hopeful, strengthening, or warm visual symbols — never sympathy-coded (wreaths, lilies, white roses). Good motif options:
- "Sunrise over a horizon"
- "Mountain peak with light breaking"
- "Open hand reaching upward"
- "Two hands clasped"
- "Blooming flower against soft light"
- "Bird in flight against open sky"
- "Path leading forward through landscape"
- "Star or constellation"
- "Warm hearth or candle flame"
When the user's input is specific (profession, hobby, or moment), lean into those signals: a runner before a marathon → "running shoes on a road"; a musician before a concert → "instrument in soft light."

Safety — never return a motif involving: weapons designed to harm (guns, knives as weapons, military weaponry; hunter's rifle acceptable when user explicitly frames a hunting context), hate symbols (swastikas, Confederate flag, white nationalist or terrorist iconography), explicit sexual imagery, drug paraphernalia in a celebratory context. Return focal_motif: "" if a banned motif is requested.

Focal motif must be a visual concept only — no numbers, dates, or text:
GPT image generation is unreliable when asked to render specific numbers, ages, dates, or words inside images. The focal motif description must describe a visual object or scene, never a textual or numerical element.

WRONG — focal motifs that include text or numbers:
- "30th birthday number with sunburst" (the "30" will render incorrectly)
- "graduation cap with 'Class of 2026' banner" (the text will be garbled)
- "anniversary card with '30 years' in the center" (the number will be wrong)
- "champagne bottle with date label"
- "calendar showing the wedding date"
- "milestone marker with the age"

RIGHT — focal motifs as pure visual concepts:
- "celebratory sunburst with confetti" (instead of "30th birthday number")
- "champagne flutes with bubbles rising" (instead of "30th anniversary")
- "graduation cap with diploma scroll" (no text — visual object only)
- "two intertwined wedding rings with floral spray" (no date — visual symbol)
- "balloon cluster with streaming ribbons" (no numbers — pure visual)
- "single peony in full bloom" (no labels — botanical object)

Translate any age/date/year/text-containing input into a purely visual equivalent. For milestone birthdays, use celebratory visual symbols (sunbursts, balloons, confetti bursts, champagne, stars) — never numbers. For anniversaries, use unity symbols (intertwined rings, paired florals, two birds) — never year counts. For graduations, use achievement symbols (caps, scrolls, books) — never institution names or years.

Before finalizing the focal_motif field, check:
- Does the description contain any digits (0-9)? If yes, rewrite without them.
- Does the description specify any text to render (words, names, labels)? If yes, rewrite as a pure visual concept.
- Could a designer draw this without writing anything? If no, rewrite.

Examples:
"Birthday card for my friend Kwame, who's a chef. He's turning 30." → focal_motif: "chef's whisk with herbs"
"Congratulations card for James on his graduation from Stanford." → focal_motif: "graduation cap with diploma scroll"
"Sympathy card for the Mensah family on the loss of their father." → focal_motif: "" (sympathy — use theme-default florals or wreath)
"Birthday card for my 12-year-old nephew who loves planes." → focal_motif: "paper airplane in flight"
"Eid card for my parents." → focal_motif: "crescent moon with star"
"Promo for Kojo's Barbershop — fresh cuts every weekend" → focal_motif: "barber razor and comb"
"Anniversary card for my wife. 10 years married." → focal_motif: "two intertwined wedding rings"

Motivation worked examples:

EXAMPLE — Motivation, Warm vibe, friend going through a hard season:
User input: "A card for my friend Akua. She's going through a really tough season — divorce, work stress, just a lot. I want her to know she's loved and she'll come through this."
WRONG (sympathy-coded, generic):
  Title: "WITH SYMPATHY" — wrong occasion framing
  Body: "I'm so sorry you're going through this difficult time. Sending you my deepest love and support." — reads as a death notice
RIGHT (motivation, warm, addressed to her):
  Title: "THINKING OF YOU, AKUA"
  Body: "This is a hard season, but you are not the season. You're strong, loved, and going to come through this."
  Signoff: "Always in your corner"

EXAMPLE — Motivation, Bold vibe, encouragement before a big exam:
User input: "Card for my brother Kojo — he has his medical school finals next week. He's been studying like crazy."
  Title: "YOU GOT THIS, KOJO"
  Body: "All those late nights, every page memorized — it all comes together this week. Go show them."
  Signoff: "Proud of you, brother"

EXAMPLE — Motivation, Warm vibe, no specific cause given:
User input: "A quiet card for someone going through a hard time."
  Title: "THINKING OF YOU"
  Body: "I don't know exactly what you're carrying right now, but I know it's heavy. You're stronger than you feel today."
  Signoff: "Always here"
  (Notice: no assumption about the cause. No "your loss" framing. Just present, supportive, warm.)

General rules:
- Forbidden: cliches, hollow phrases, anything generic.
- The copy should feel personal, not template-stamped.
- Stay within character budgets. Meaning over decoration.

Invitation and Business Promo bodies — include practical details:
When the user's input includes specific date, time, venue, address, or contact information for an Invitation or Business Promo occasion, include the most important practical details in the body copy. Don't drop the address if the user took the trouble to mention it.
Prioritization when space is tight:
1. Date + time (most essential)
2. Venue or address (next most essential)
3. Contact or RSVP info (only if room)
Examples:
- Input: "Housewarming from Esi and Kwame, this Saturday at 7pm, 23 Oxford Street"
  → Acceptable body: "Join us Saturday at 7pm, 23 Oxford Street. Can't wait to see you there."
  → Acceptable body: "Saturday, 7pm at 23 Oxford Street. Come hang with us."
- Input: "Birthday party for Ama, Saturday March 5 at Bloom Café from 6pm"
  → Acceptable body: "Saturday March 5 at Bloom Café, from 6pm. Come celebrate Ama!"
Don't pad addresses with extra prose when the budget is tight. "Saturday at 7pm, 23 Oxford Street" is more useful than "We can't wait to see you on Saturday."
Birthday, Sympathy, and Congratulations cards don't typically require addresses or times in the body — Stage A should not invent or force them.
Only include address/time/venue when the user explicitly mentioned them. Never invent or assume.

CRITICAL — Terminal completeness before finalizing:
Before outputting the JSON, re-read every text field (title, body, signoff). Each field's FINAL character must be ., !, or ?.
It is not enough for the field to contain a complete sentence somewhere. The entire field must end as a complete grammatical thought. No trailing fragments, no hanging clauses, no incomplete additions after the last period.
Examples of incorrect endings (the rule applies to the FINAL state of the field, not just the first sentence):
  WRONG: "Join us this Saturday at 7pm, 23 Oxford Street. Let's" — has a period mid-field but ends with hanging "Let's"
  RIGHT: "Join us this Saturday at 7pm, 23 Oxford Street. Let's celebrate together."
  WRONG: "Come celebrate her 25th. So proud of" — ends with hanging "of"
  RIGHT: "Come celebrate her 25th. So proud of all you've done."
  WRONG: "May this year be everything you hoped. And more" — ends with hanging "more"
  RIGHT: "May this year be everything you hoped for and more."
Before producing the JSON, check each field this way:
1. What is the very last character?
2. Is it ., !, or ??
3. If not, rewrite the field to end with terminal punctuation, even if it means cutting the trailing fragment entirely.
No exceptions. A field's final character is its punctuation rule. Don't add a fragment after a complete sentence — finish the thought or don't include it.
```

#### Validation rules in the parse node

The n8n parse node (Code node) must check ALL of the following. If ANY check fails, set `parseSuccess: false` and include a `parseError` field describing what failed — this routes into the retry branch:

1. JSON parses cleanly
2. `copy.title.length <= 36`
3. `copy.body.length <= 130`
4. `copy.signoff.length <= 24`
5. `design_brief.layoutId` is one of the 7 valid layoutId values
6. `design_brief.typographyId` is one of the 12 valid typographyId values
7. `design_brief.decoration_density` is one of: `'sparse'`, `'moderate'`, `'rich'`

```javascript
const raw = $input.item.json.content[0].text;
let parsed;
try {
  parsed = JSON.parse(raw);
} catch (e) {
  return [{ json: { parseSuccess: false, parseError: 'Invalid JSON: ' + e.message } }];
}

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
  if (!parsed.copy.title || parsed.copy.title.length > 36) errors.push(`title length ${parsed.copy.title?.length} exceeds 36`);
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
const focalMotif = (design_brief.focal_motif || '').trim();

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
  'Composition balance:',
  `The content zone occupies only a portion of the canvas — it may be centered, in a corner, top-heavy, or asymmetric depending on the layout. The remaining canvas area is your decorative space. This space must feel designed and intentional, not "decoration scattered around an empty middle."`,
  'Principles for the decorative zone:',
  '- Anchor the empty regions. Wherever the canvas has a large area outside the content zone (e.g. the right half if text is on the left, the lower half if text is at the top), place a substantial decorative element there — a focal floral arrangement, a textural composition, a larger illustration, or whatever fits the theme. The empty regions should feel filled with intent, not left blank.',
  '- Balance the weight. If the content zone is in the upper-left, the lower-right should have visual weight that balances it. If the content zone is centered, decoration can frame it symmetrically. The composition should feel stable, not lopsided.',
  `- Vary the scale. Don't only use small repeating elements (small dots, scattered confetti, tiny petals). Include at least one larger focal element in the decorative zone — a substantial flower, a bold motif, a textural region — to give the eye somewhere to rest after reading the text.`,
  `- Respect theme aesthetic. The focal element and the supporting decoration should belong to the same visual world. A celebration theme's focal element could be a confetti burst or party motif; a sympathy theme's focal element could be a single large wreath or quiet floral spray; a business theme's focal element could be a strong abstract shape or pattern.`,
  '- Edge composition matters. Even subtle elements at the edges of the canvas — a vine trailing off the right side, a wash of color in the bottom corner — make the composition feel framed and intentional. Avoid hard empty edges.',
  'Think of the canvas as a complete designed piece where the content zone is the focal text area and the rest is the designed environment around it. Not a piece of paper with text in one spot and confetti randomly thrown around it.',
  ...(focalMotif ? [
    '',
    `Focal motif: "${focalMotif}"`,
    'Render this as the substantial anchor element in the decorative zone. It should occupy a meaningful portion of the canvas outside the content zone (a corner, quadrant, or half). It is the hero of the decoration — other theme elements (petals, dots, strokes) support around it.',
    'Render in theme visual style: watercolor themes (watercolor_florals_sparse, watercolor_abstract, abundant_garden_borders) → soft watercolor illustration with bleeding edges and pigment washes; geometric themes (geometric_confetti, geometric_art_deco) → flat bold illustration with clean shapes in theme colors; line-art themes (minimalist_line_botanical) → single continuous-line drawing, monochrome; atmospheric themes (soft_brush_strokes, sunset_gradient) → motif blended into soft atmospheric wash; paper/vintage themes (vintage_paper_texture, botanical_herbarium) → pressed-specimen or vintage plate style.',
  ] : [
    '',
    'No focal motif specified — use the theme default substantial anchor element (large floral cluster, bold confetti burst, atmospheric color wash, etc., as appropriate for the chosen theme).',
  ]),
  '',
  `The empty text zones must be visually treated as: ${design_brief.text_treatment}. These zones are an INTENTIONAL part of the design -- they should feel like deliberate negative space, not blank gaps.`,
  '',
  'Premium quality, professional design, no text whatsoever, no letters, no numbers, no signatures, no watermarks.',
].join('\n');

return [{ json: { ...d, imagePrompt, imageRequestBody: { model: 'gpt-image-1', prompt: imagePrompt, n: 1, size: '1024x1024', quality: 'low' } } }];
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
    "text_treatment": "...",
    "focal_motif": "graduation cap with diploma scroll"
  },
  "copy": {
    "title": "...",
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
