const d = $input.first().json;
const isSympathy = d.occasion === 'sympathy';
const model = isSympathy ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';
const recentThemes = Array.isArray(d.recentThemes) ? d.recentThemes : [];
const recentThemesLine = recentThemes.length > 0
  ? `RECENT THEMES USED (avoid repeating these): ${recentThemes.join(', ')}`
  : '';
const recentPairings = Array.isArray(d.recentPairings) ? d.recentPairings : [];
const recentPairingsLine = recentPairings.length > 0
  ? `RECENT_PAIRINGS (avoid reusing): ${recentPairings.join(', ')}`
  : '';
const systemPrompt = 'You are writing the words and design direction for a digital greeting card. Output ONLY valid JSON, no other text, no markdown fences.';
const FONT_STYLE_TO_TYPO_ID = { modern: 'bold_impact', classic: 'classical_elegant', clean: 'modern_clean', highContrast: 'urban_modern', vintage: 'classical_elegant', minimalType: 'minimal_swiss', script_romance: 'script_romance', editorial_serif: 'editorial_serif', playful_display: 'playful_display', bold_geometric: 'bold_geometric', warm_personal: 'warm_personal', urban_modern: 'urban_modern' };
const mappedTypoId = d.fontStyle ? FONT_STYLE_TO_TYPO_ID[d.fontStyle] || null : null;
const typographyPickLine = mappedTypoId ? `USER TYPOGRAPHY OVERRIDE: You MUST set typographyId to "${mappedTypoId}" — the user explicitly selected this font style. The typography variety rotation rule does NOT apply when the user has made an explicit pick. User choice wins over variety.` : '';

const compositionLibrary = `COMPOSITION DIRECTION LIBRARY — pick one direction that fits this card's occasion, vibe, and copy weight. Output it as design_brief.compositionDirection. Use it to inform your layoutId, decorative_theme, focal_motif, and decorative_direction. Vary — never default to the same direction card to card. These are a mood board, not rigid rules: borrow a composition idea, mix freely, invent beyond them.

Birthday (leads with message + recipient name):
• Confetti Spotlight — name in a colored pill/badge, confetti scatter around it, warm message below → layoutId: vignette_center, decorative_theme: geometric_confetti, focal_motif: "confetti scatter with ribbon streamers"
• Modern Milestone — age or number as the visual hero (large), message in the lower third → layoutId: top_heavy or hero_name_radial, decorative_theme: celestial_dust
• Elegant Soirée — inset double-rule frame, delicate balloon line-art, message-led → layoutId: centered_framed, decorative_theme: minimalist_line_botanical, focal_motif: "delicate line-art balloons"
• Type Stacker — full-bleed color blocks, "Dear ___" message panel in contrasting section → layoutId: magazine_split or asymmetric_diagonal
• Garland & Glow — cozy bunting/garland motif + candle glow, warm personal note → layoutId: vignette_center, decorative_theme: soft_brush_strokes, focal_motif: "bunting garland with glowing candle"
• Polaroid Memory — polaroid-frame photo slot as hero element, handwritten-style note below → layoutId: top_heavy, decorative_theme: vintage_paper_texture, focal_motif: "Polaroid photo frame"
• Balloon Bouquet — held balloon cluster anchors the top, message below in clear zone → layoutId: top_heavy, decorative_theme: balloon_streamer, focal_motif: "cluster of balloons with curling ribbons"
• Retro Sunburst — 70s-style radiating sunburst rays, message on a cream or warm panel → layoutId: vignette_center, decorative_theme: retro_sunburst, focal_motif: "retro sunburst rays"
• Botanical Wreath — delicate botanical sprigs frame the message in a wreath ring → layoutId: centered_framed, decorative_theme: watercolor_florals_sparse, focal_motif: "botanical wreath with ribbon"
• Midnight Wish — deep night-sky palette, gold stars, "make a wish" sentiment → layoutId: vignette_center, decorative_theme: celestial_dust, focal_motif: "crescent moon with scattered gold stars"

Congrats (leads with achievement + message):
• Laurel Honor — laurel branches flank the recipient name like an award plaque → layoutId: hero_name_radial or centered_framed, decorative_theme: botanical_herbarium, focal_motif: "laurel wreath with gold ribbon"
• Confetti Burst — "you did it!", burst of streamers from center, high energy → layoutId: top_heavy or asymmetric_diagonal, decorative_theme: geometric_confetti, focal_motif: "confetti burst with streamers"
• Bravo — single oversized hero word (BRAVO / YOU DID IT), graphic and minimal → layoutId: banner_horizontal, decorative_theme: soft_brush_strokes
• Grad Cap — mortarboard as central motif, navy & gold or warm palette → layoutId: centered_framed, decorative_theme: vintage_paper_texture, focal_motif: "graduation cap with diploma scroll"
• Rising Star — upward-pointing motif (arrow, rising bar, ascending stars), clean career-win energy → layoutId: magazine_split, decorative_theme: geometric_art_deco, focal_motif: "upward-pointing star with rising line"
• Gold Seal — medal & ribbon seal as the decorative anchor, "achievement unlocked" → layoutId: centered_framed, decorative_theme: geometric_art_deco, focal_motif: "gold medal with ribbon seal"
• Champagne Toast — two champagne flutes + bubbles, warm celebratory message → layoutId: vignette_center, decorative_theme: watercolor_abstract, focal_motif: "two champagne flutes with bubbles"
• Minimal Elegant — abundant whitespace, message as visual hero, typography-forward → layoutId: centered_framed, decorative_theme: minimalist_line_botanical
• Spotlight Marquee — theatre marquee lightbulbs framing the name/achievement → layoutId: banner_horizontal, decorative_theme: geometric_confetti, focal_motif: "theatre marquee lightbulbs"
• Fireworks Night — fireworks bursts on a dark sky, joyful message → layoutId: vignette_center, decorative_theme: celestial_dust, focal_motif: "fireworks burst on night sky"

Invitation (leads with event-details block — date · time · venue · RSVP):
• Formal Engraved — double inset rule frame, black-tie precision, classical serif → layoutId: centered_framed, decorative_theme: geometric_art_deco
• Modern Editorial — asymmetric; type and eyebrow left, details block right → layoutId: magazine_split, decorative_theme: minimalist_line_botanical
• Art Deco — 1920s gold fan/sunburst geometry, rich ornamental border → layoutId: centered_framed, decorative_theme: geometric_art_deco, focal_motif: "art deco gold fan geometry"
• Garden Party — botanical corner elements, soft pastel, airy → layoutId: centered_framed or vignette_center, decorative_theme: abundant_garden_borders
• Intimate Dinner — moody and candlelit, close and warm, evening palette → layoutId: vignette_center, decorative_theme: soft_brush_strokes, focal_motif: "candle flame with soft glow"
• Ticket Pass — admit-one ticket stub shape, dashed tear-line motif → layoutId: banner_horizontal, focal_motif: "ticket stub with dashed tear line"
• Bold Banner — large date numeral as hero, color blocks bookend the details → layoutId: banner_horizontal or top_heavy, decorative_theme: geometric_confetti
• Save the Date — huge date numerals dominate, minimal else → layoutId: hero_name_radial, decorative_theme: minimalist_line_botanical
• Tropical Summer — vibrant palms & sun, warm tropical palette → layoutId: top_heavy, decorative_theme: sunset_gradient, focal_motif: "palm leaves with tropical sun"
• Vintage Postcard — stamp & postmark motif, "wish you were here" nostalgia → layoutId: centered_framed, decorative_theme: vintage_paper_texture, focal_motif: "vintage postage stamp with postmark"

Business / Grand Opening (leads with offer + contact strip):
• Grand Opening Ribbon — festive ceremonial ribbon-cut motif, first-day offer hero → layoutId: top_heavy, decorative_theme: geometric_art_deco, focal_motif: "ceremonial ribbon with scissors"
• Mega Sale Burst — starburst price-seal motif, high-contrast retail energy → layoutId: vignette_center, decorative_theme: geometric_confetti, focal_motif: "starburst price seal"
• Minimal Luxe — premium boutique/spa feel, abundant whitespace, one fine motif → layoutId: centered_framed, decorative_theme: minimalist_line_botanical
• Bold Promo Split — diagonal color blocks, modern retail energy → layoutId: asymmetric_diagonal or magazine_split, decorative_theme: soft_brush_strokes
• Menu Special — chalkboard-style aesthetic, dish & price block → layoutId: centered_framed, decorative_theme: vintage_paper_texture
• Corporate Webinar — clean, professional, register-CTA structure → layoutId: magazine_split, decorative_theme: minimalist_line_botanical
• Coupon Voucher — dashed tear-off border frames the offer, promo code strip → layoutId: banner_horizontal, decorative_theme: vintage_paper_texture
• Tech Launch — gradient field, "now live" status pill, product-forward → layoutId: asymmetric_diagonal, decorative_theme: sunset_gradient
• Workshop Poster — bold class promo, "limited seats" urgency → layoutId: top_heavy, decorative_theme: geometric_art_deco
• Open House — real estate photo-slot hero, agent strip footer → layoutId: magazine_split

Wedding Thank-You (leads with couple names + gratitude message):
• Fine Art Script — romantic script names as hero, cream & ink palette → layoutId: centered_framed, decorative_theme: watercolor_florals_sparse
• Modern Monogram — initials crest as central element, contemporary → layoutId: centered_framed or hero_name_radial, decorative_theme: minimalist_line_botanical, focal_motif: "monogram crest with laurel"
• Botanical Arch — greenery arch sweeps over the names, natural and lush → layoutId: top_heavy, decorative_theme: abundant_garden_borders, focal_motif: "greenery arch with botanical sprigs"
• Photo Keepsake — couple photo slot as hero, thank-you message below → layoutId: top_heavy or magazine_split, decorative_theme: watercolor_florals_sparse
• Art Deco Gold — Gatsby-era geometry, black & gold palette, fan motifs → layoutId: centered_framed, decorative_theme: geometric_art_deco, focal_motif: "art deco gold fan geometry"
• Minimal Gratitude — vast whitespace, one fine typographic line, restrained → layoutId: centered_framed, decorative_theme: minimalist_line_botanical
• Photo Overlay — full-bleed photo feel, overlaid gratitude text → layoutId: vignette_center, decorative_theme: soft_brush_strokes
• Editorial Bold — oversized serif couple names, fashion-editorial feeling → layoutId: banner_horizontal, decorative_theme: soft_brush_strokes
• Dusty Romance — mauve, sage, watercolor washes, soft romantic → layoutId: vignette_center, decorative_theme: watercolor_abstract
• Just Married — celebratory confetti burst, joy-forward thank-you → layoutId: top_heavy, decorative_theme: balloon_streamer, focal_motif: "confetti burst with 'just married' ribbon"

Sympathy — restrained, lots of negative space, single quiet motif. Prefer: centered_framed or vignette_center + botanical_herbarium or watercolor_florals_sparse.
Motivation — poster energy, strength-forward. Prefer: top_heavy or asymmetric_diagonal + sunset_gradient or soft_brush_strokes.
Thank You — warm and simple. Prefer: centered_framed or vignette_center + watercolor_florals_sparse or minimalist_line_botanical.`;

const hasPhotos = d.hasUserAssets && Array.isArray(d.userAssets) && d.userAssets.length > 0;
const primaryPhotoRole = hasPhotos ? (d.userAssets[0].role || 'main_person') : null;
const photoLine = hasPhotos
  ? `PHOTOS: User has uploaded ${d.userAssets.length} photo(s). Primary photo role: "${primaryPhotoRole}". The photo will be composited onto the card as a circular portrait element in the upper area of the card. Therefore:\n- Prefer compositions where the upper area is the decorative zone (top_heavy, hero_name_radial, vignette_center) so the AI-generated decoration naturally frames the portrait zone.\n- Good photo-aware directions: "Modern Milestone", "Medallion Honor", "Garland & Glow", "Botanical Wreath" (birthday); "Laurel Honor", "Gold Seal", "Grad Cap" (congrats); "Photo Keepsake", "Botanical Arch" (wedding).\n- Avoid banner_horizontal and magazine_split — the portrait would clash with the left/right split layout.\n- Set decoration_density to sparse or moderate — dense decoration competes with the portrait.\n- The focal_motif should complement a portrait (e.g. "botanical wreath with ribbon", "laurel branches with gold ring", "confetti scatter", "celestial dust around portrait") rather than crowd the same zone.`
  : '';

const userPrompt = `OCCASION: ${d.occasion}
VIBE: ${d.vibe}
USER DESCRIPTION: ${d.additionalContext}
DATE (if any): ${d.eventDate}
VENUE (if any): ${d.venue}
CONTACT (if any): ${d.contactInfo}
REGION: ${d.region}
${recentThemesLine}
${recentPairingsLine}
${typographyPickLine}
${photoLine}

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
- Motivation: 'YOU GOT THIS' / 'YOU\'VE GOT THIS, [NAME]' / 'KEEP GOING' / 'I BELIEVE IN YOU' / 'THINKING OF YOU' / 'STAY STRONG'
  (avoid: 'HANG IN THERE', 'CHIN UP', 'BETTER DAYS')

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
    "title": "string - unified hero slot, max 36 chars. One statement fusing occasion signal + recipient. Examples: 'HAPPY BIRTHDAY, AMA' / 'CONGRATS, JAMES!' / 'WITH SYMPATHY, MENSAH FAMILY' / 'YOU'RE INVITED!'. Natural-case names. Family collectives preserved ('Mensah Family' not 'Mensah'). No invented names.",
    "body": "string - 50-90 chars ideal, max 130, 1-2 sentences",
    "signoff": "string - 8-18 chars ideal, max 24",
    "date": "OPTIONAL - if a date or time is found in the form fields or user description, include it. Otherwise OMIT this field entirely.",
    "venue": "OPTIONAL - if a location or address is found in the form fields or user description, include it. Otherwise OMIT this field entirely.",
    "contact_url": "OPTIONAL - if a phone number, email, URL, or social handle is found in the form fields or user description, include it. Otherwise OMIT this field entirely.",
    "tagline": "OPTIONAL - if a short punchy tagline phrase is found in the form fields or user description (for invitations / promos), include it. Otherwise OMIT this field entirely."
  },
  "design_brief": {
    "palette_mood": "string describing color direction",
    "decorative_direction": "string describing visual motifs and where they sit",
    "energy_tags": ["array", "of", "mood", "tags"],
    "compositionDirection": "one of the named directions from the library above (e.g. 'Confetti Spotlight', 'Laurel Honor', 'Art Deco') or a creative name you invent for a new direction. This is the single most important design decision — it defines what makes this card compositionally distinct.",
    "layoutId": "one of: centered_framed | asymmetric_diagonal | top_heavy | magazine_split | vignette_center | banner_horizontal | hero_name_radial",
    "typographyId": "one of: classical_elegant | modern_clean | bold_impact | romantic_serif | warm_handwritten | minimal_swiss | script_romance | editorial_serif | playful_display | bold_geometric | warm_personal | urban_modern",
    "decoration_density": "one of: sparse | moderate | rich",
    "text_treatment": "description of the empty text zone, e.g. soft cream wash with subtle paper texture",
    "decorative_theme": "one of: watercolor_florals_sparse | abundant_garden_borders | geometric_confetti | celestial_dust | minimalist_line_botanical | vintage_paper_texture | balloon_streamer | soft_brush_strokes | botanical_herbarium | geometric_art_deco | watercolor_abstract | sunset_gradient | retro_sunburst | laurel_ceremonial",
    "focal_motif": "OPTIONAL — empty string or 1-4 word descriptor personalizing the anchor element. The composition direction above suggests specific motifs — use those as a starting point. Examples from the library: 'confetti scatter with ribbon streamers', 'cluster of balloons with curling ribbons', 'bunting garland with glowing candle', 'laurel wreath with gold ribbon', 'graduation cap with diploma scroll', 'two champagne flutes with bubbles', 'fireworks burst on night sky', 'art deco gold fan geometry', 'ticket stub with dashed tear line', 'vintage postage stamp with postmark', 'ceremonial ribbon with scissors', 'starburst price seal', 'greenery arch with botanical sprigs', 'monogram crest with laurel', 'botanical wreath with ribbon', 'crescent moon with scattered gold stars', 'retro sunburst rays', 'Polaroid photo frame'. Return empty string when no specific motif is needed."
  }
}

Rules:

CRITICAL - slot semantics:
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
If no value is found from any source, OMIT the field entirely - do not invent placeholder text.

Layout selection guidance:

Pick the layoutId that genuinely best serves THIS card's emotional register AND content length. Vary your choice across generations - do not default to the same layout repeatedly.

The compositionDirection above is your primary guide — it already suggests a layoutId. Follow that suggestion unless the copy length or emotional register strongly argues against it.

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

Critical: if you pick hero_name_radial or banner_horizontal, you MUST keep the body under 70 characters. Adjust the body copy to fit, do not pick a layout that does not fit the content.
Voice rules by occasion:

sympathy / memorial:
  Address: FIRST-PERSON from sender to the grieving recipients. The card goes TO the family, FROM the sender.
  Tone: grieve WITH them, not tribute-paying. The body is not a eulogy. The body is a human saying "I'm here."
  Include: acknowledge the loss, mention the deceased by name (using whatever the user gave), echo the sender's own emotional words.
  AVOID: third-person tributes ("leaves behind a legacy"), stock memorial phrases ("tender season," "indelible legacy," "treasured spirit"), anything that reads like an obituary insert.
  GOOD: "I grieve with you on the loss of Mr. Edward. He was a great man, and his absence will be felt by everyone who knew him."
  BAD: "Mr. Edward Mensah leaves behind a legacy of greatness. May his memory be a source of comfort in this tender season."

birthday:
  When sender IS identifiable: first-person from sender to recipient. Warm, personal, specific to what the user shared.
  When sender is NOT identifiable: warm direct address to the recipient ("Today is YOUR day, Ama"). Never corporate or cold.
  Match the energy — quiet pride vs. loud celebration — to the user's own tone.
  CRITICAL: Every birthday card MUST include a real personal message in the body — 1-2 sentences of genuine well-wishes. Not just a title + date. Not just "wishing you well." Something specific to the person or moment the user described.

congrats:
  First-person celebration when sender is identifiable, otherwise direct celebration addressed to recipient.
  Match the user's energy: quiet pride ("So proud of you") vs. loud joy ("YOU DID IT!").
  CRITICAL: Every congrats card MUST include a real message of pride, recognition, or celebration — not just the achievement name repeated.

business / promo:
  Brand voice — "we" or branded second-person ("you'll love..."). NOT personal-from-an-individual.
  Promotional, direct, benefit-led.

invitation:
  Hosts-to-guests. "Join us," "we'd love to have you," "you're invited."
  When sender is named, include as host: "Esi and Kwame invite you to their housewarming."
  Include key practical details (date, time, venue) in the body when the user provided them — see "Invitation and Business Promo bodies" rule below.

motivation:
  Cards in this category exist to lift the recipient up. The sender is reminding the recipient of their strength, capability, or worth — or quietly supporting them through a hard moment without grief framing.
  Address the recipient directly in second person ("you," "your"). Always.
  Avoid greeting-card boilerplate like "Hang in there!" / "Better days ahead!" Real friends don't write that.
  Never assume the cause. Don't write "I know your divorce has been hard" unless the user mentioned divorce. Stay supportive without naming what isn't named.
  The card should leave the recipient feeling stronger, more seen, or more capable — not pitied.
  NEVER use phrases like "I'm so sorry for your loss," "sending condolences," or any grief-coded language for Motivation cards.
  Vibe determines register:
    warm/heartfelt → quietly supportive — "I'm here with you, you've got this."
    bold/energetic → active push — "YOU GOT THIS. KEEP GOING."
    elegant/classy → measured strength — "You have what it takes. I believe in you."
    playful/fun → bright and chipper — "Reminder: you're amazing. That's the message."
    minimal/clean → spare and direct — "Keep going. You're doing it."
    church/traditional → faith-anchored — "He's with you in this season. You are stronger than you know."

Other occasions (happy_new_month, mothers_day, fathers_day, valentines_day, eid, christmas, new_year, easter, independence_day):
  Apply the same first-person/direct-address logic above based on whether a sender is identifiable.
  happy_new_month: hopeful, fresh-start energy. mothers_day: deeply warm, gratitude-focused. fathers_day: warm but understated. valentines_day: romantic or platonic warmth, never saccharine. eid: respectful, joyful. christmas: warm, festive. new_year: hopeful, reflective. easter: gentle, hopeful. independence_day: proud, celebratory.

Copy-writing principles (apply to all occasions):

1. Polish the user's language; don't erase it.
   The user's words are raw material, not noise. "He was such a great man and his death is a huge blow to all of us" → keep the emotional core: "He was a great man, and losing him is felt by everyone who knew him." Do NOT replace with: "His memory leaves an indelible legacy."

2. Specificity over generality.
   When the user names a relationship, role, or quality — use it. "Mr. Edward Mensah" stays "Mr. Edward Mensah," not "your beloved father." "she's so kind" → "kind," not "a treasured soul."

3. Avoid greeting-card boilerplate.
   NEVER write: "tender season," "indelible legacy," "loving memory of a treasured spirit," "in this difficult time of grief," "may you find comfort in the memories," "forever in our hearts," "gone but not forgotten."
   Real people write: "I'm so sorry," "we'll miss him," "thinking of you," "I'm here for you."

4. Match the user's diction level.
   Casual input ("she's so amazing") → warm casual output ("You're amazing, Ama — here's to 25!").
   Formal input ("the loss of their esteemed father") → more formal output. Don't elevate casual to formal or flatten formal to casual.

5. Signoff carries sender voice.
   "With deep sympathy" is acceptable only when sender is unknown.
   When sender is identified: use their name or relationship — "— Efua", "Thinking of you all, [name]", "Love, your friend".

Typography guidance:

VARY your typographyId — never default to the same pairing repeatedly. Check RECENT_PAIRINGS and pick something different.

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
- sparse (default for: warm, elegant, minimal): few decorative elements, abundant breathing room, restraint is the aesthetic. Think: two watercolor florals in opposite corners with gold dust accents. This is the default for premium-feeling cards.
- moderate (default for: church, playful): balanced decoration, enough to feel rich but not crowded. Decoration occupies clearly bounded zones.
- rich (default for: bold, festive contexts): dense, layered decoration. Use sparingly - most cards should not be rich.

When in doubt, default to sparse. Sparse cards photograph better, feel more premium, and are harder to make ugly.

Decorative theme selection:
Choose a decorative_theme that matches the occasion, vibe, AND compositionDirection. Use this compatibility table:
watercolor_florals_sparse — vibes: elegant, warm, minimal — occasions: birthday, sympathy, motivation, congrats, invitation
abundant_garden_borders — vibes: elegant, warm, church — occasions: birthday, sympathy, congrats, invitation
geometric_confetti — vibes: playful, bold, warm — occasions: birthday, congrats, invitation
celestial_dust — vibes: elegant, warm, minimal — occasions: birthday, sympathy, motivation, congrats, invitation
minimalist_line_botanical — vibes: minimal, elegant, church — occasions: sympathy, motivation, business, invitation, birthday
vintage_paper_texture — vibes: elegant, church, warm — occasions: sympathy, motivation, invitation, business
balloon_streamer — vibes: playful, bold, warm — occasions: birthday, congrats, invitation
soft_brush_strokes — vibes: elegant, minimal, warm — occasions: sympathy, motivation, business, invitation, congrats
botanical_herbarium — vibes: elegant, minimal, church — occasions: sympathy, motivation, congrats, invitation, business
geometric_art_deco — vibes: elegant, bold — occasions: invitation, business, congrats, birthday
watercolor_abstract — vibes: warm, elegant, minimal — occasions: sympathy, motivation, birthday, congrats
sunset_gradient — vibes: warm, minimal, bold — occasions: birthday, motivation, congrats, invitation
retro_sunburst — vibes: playful, bold, warm — occasions: birthday, congrats, invitation, business — use for Retro Sunburst and Bold Banner directions
laurel_ceremonial — vibes: elegant, church, minimal — occasions: congrats, invitation, sympathy — use for Laurel Honor and Gold Seal directions

IMPORTANT: If recentThemes lists any theme IDs, do NOT select those themes — vary your output.
If no theme in the table is compatible (edge case), fall back to watercolor_florals_sparse.

Sender awareness:
If the user's notes mention WHO is sending the card (e.g. 'from his sister', 'love from Mama', 'on behalf of the team'), incorporate the sender naturally into the signoff. Examples:

- User notes: 'for my mom, from her daughter Ada'
  -> signoff: 'With love, Ada' or 'Always, your daughter Ada'

- User notes: 'from the team at Kojo's Barbershop'
  -> signoff: 'The Kojo's Barbershop Team'

- User notes: 'love from grandma'
  -> signoff: 'With love, Grandma'

If no sender is mentioned, use a warm impersonal closer like 'With love', 'Warmly', 'Thinking of you', etc. — depending on occasion tone.

The sender mention should feel natural and warm, never formulaic. Don't append the sender as a separate line if it doesn't read smoothly with the closer.
Focal motif selection:
Based on the user's free-text input, infer a focal motif that personalizes the card. The motif is a 1-4 word descriptor of an object, symbol, or scene that visually anchors the recipient's identity, profession, hobby, age, or the occasion's context.

The compositionDirection you chose above already suggests occasion-specific motifs — use those as your primary vocabulary. Then layer in user-specific signals:

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
When the user's input is specific (profession, hobby, or moment), lean into those signals. A runner before a marathon → "running shoes on a road"; a musician before a concert → "instrument in soft light."

Safety — never return a motif involving: weapons designed to harm (guns, knives as weapons, military weaponry; hunter's rifle acceptable when user explicitly frames a hunting context), hate symbols (swastikas, Confederate flag, white nationalist or terrorist iconography), explicit sexual imagery, drug paraphernalia in a celebratory context. Return focal_motif: "" if a banned motif is requested.

Focal motif must be a visual concept only — no numbers, dates, or text:
GPT image generation is unreliable when asked to render specific numbers, ages, dates, or words inside images. The focal motif description must describe a visual object or scene, never a textual or numerical element.
WRONG: "30th birthday number with sunburst" / "graduation cap with 'Class of 2026' banner" / "anniversary card with '30 years'" / "champagne bottle with date label"
RIGHT: "celebratory sunburst with confetti" / "graduation cap with diploma scroll" / "two intertwined wedding rings with floral spray" / "balloon cluster with streaming ribbons"
Before finalizing focal_motif: Does the description contain any digits (0-9)? If yes, rewrite. Does it specify text to render? If yes, rewrite. Could a designer draw this without writing anything? If no, rewrite.

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
User: "A card for my friend Akua. She's going through a really tough season — divorce, work stress, just a lot."
WRONG: Title "WITH SYMPATHY" / Body "I'm so sorry you're going through this difficult time." (grief-coded)
RIGHT: Title "THINKING OF YOU, AKUA" / Body "This is a hard season, but you are not the season. You're strong, loved, and going to come through this." / Signoff "Always in your corner"

EXAMPLE — Motivation, Bold vibe, before a big exam:
User: "Card for my brother Kojo — he has his medical school finals next week."
Title: "YOU GOT THIS, KOJO" / Body: "All those late nights, every page memorized — it all comes together this week. Go show them." / Signoff: "Proud of you, brother"

EXAMPLE — Motivation, Warm vibe, no specific cause given:
User: "A quiet card for someone going through a hard time."
Title: "THINKING OF YOU" / Body: "I don't know exactly what you're carrying right now, but I know it's heavy. You're stronger than you feel today." / Signoff: "Always here"
(No assumption about cause. No grief framing. Present, supportive, warm.)

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
  Acceptable body: "Join us Saturday at 7pm, 23 Oxford Street. Can't wait to see you there."
  Acceptable body: "Saturday, 7pm at 23 Oxford Street. Come hang with us."
- Input: "Birthday party for Ama, Saturday March 5 at Bloom Café from 6pm"
  Acceptable body: "Saturday March 5 at Bloom Café, from 6pm. Come celebrate Ama!"
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

${compositionLibrary}`;

const claudeRequestBody = { model, max_tokens: 2000, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] };
return [{ json: { ...d, claudeRequestBody, claudeModel: model } }];
