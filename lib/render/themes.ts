export type ThemeId =
  | 'watercolor_florals_sparse'
  | 'abundant_garden_borders'
  | 'geometric_confetti'
  | 'celestial_dust'
  | 'minimalist_line_botanical'
  | 'vintage_paper_texture'
  | 'balloon_streamer'
  | 'soft_brush_strokes'
  | 'botanical_herbarium'
  | 'geometric_art_deco'
  | 'watercolor_abstract'
  | 'sunset_gradient';

export type DecorativeTheme = {
  id: ThemeId;
  displayName: string;
  gpt_decoration_prompt: string;
  compatible_vibes: ('elegant' | 'warm' | 'playful' | 'bold' | 'church' | 'minimal')[];
  compatible_occasions: (
    | 'birthday' | 'sympathy' | 'congrats' | 'business' | 'invitation'
    | 'happy_new_month' | 'mothers_day' | 'fathers_day' | 'valentines_day'
    | 'eid' | 'christmas' | 'new_year' | 'easter' | 'independence_day'
  )[];
  /** Hex color for headline + signoff slots — decorative, character-bearing, theme-matched. */
  textColorAccent: string;
  /** Hex color for recipient name + body slots — high contrast, guaranteed legible on cream. */
  textColorLegibility: string;
};

export const THEMES: Record<ThemeId, DecorativeTheme> = {
  watercolor_florals_sparse: {
    id: 'watercolor_florals_sparse',
    displayName: 'Watercolor florals — sparse corners',
    gpt_decoration_prompt:
      'Soft watercolor florals in muted peach, blush, or cream tones. ' +
      'Two small floral clusters in opposite corners with abundant breathing room. ' +
      'Hand-painted feel, gentle washes, no harsh lines.',
    compatible_vibes: ['elegant', 'warm', 'minimal'],
    compatible_occasions: ['birthday', 'sympathy', 'congrats', 'invitation',
      'happy_new_month', 'mothers_day', 'valentines_day', 'easter', 'independence_day'],
    textColorAccent:      '#7A3838',
    textColorLegibility:  '#1F1A14',
  },

  abundant_garden_borders: {
    id: 'abundant_garden_borders',
    displayName: 'Abundant garden — full bloom borders',
    gpt_decoration_prompt:
      'Rich watercolor garden composition with multiple flower types — roses, peonies, ' +
      'eucalyptus leaves, small wildflowers — covering 2-3 edges of the canvas with ' +
      'fullness. Lush but not overwhelming, with clear text zones still respected. ' +
      'Cream, dusty pink, sage green, and gold tones.',
    compatible_vibes: ['elegant', 'warm', 'church'],
    compatible_occasions: ['birthday', 'sympathy', 'congrats', 'invitation',
      'happy_new_month', 'mothers_day', 'valentines_day', 'easter'],
    textColorAccent:      '#5A4A28',
    textColorLegibility:  '#1F1A14',
  },

  geometric_confetti: {
    id: 'geometric_confetti',
    displayName: 'Geometric confetti — scattered shapes',
    gpt_decoration_prompt:
      'Playful geometric confetti scattered in the decorated zones — small circles, ' +
      'triangles, dots, irregular splash shapes, and confetti strands. Mix of bright ' +
      'and pastel tones. Modern and energetic but not chaotic. No floral elements.',
    compatible_vibes: ['playful', 'bold', 'warm'],
    compatible_occasions: ['birthday', 'congrats', 'invitation',
      'happy_new_month', 'new_year', 'independence_day'],
    textColorAccent:      '#C2410C',
    textColorLegibility:  '#1F1A14',
  },

  celestial_dust: {
    id: 'celestial_dust',
    displayName: 'Celestial dust — stars and sparkles',
    gpt_decoration_prompt:
      'Subtle celestial decoration — small gold stars, scattered sparkles, soft fairy ' +
      'dust, and tiny constellations. Dreamy and ethereal, mostly negative space with ' +
      'delicate accents. Warm gold and soft cream tones, with optional gentle navy or ' +
      'rose hints. No floral elements.',
    compatible_vibes: ['elegant', 'warm', 'minimal'],
    compatible_occasions: ['birthday', 'sympathy', 'congrats', 'invitation',
      'christmas', 'new_year', 'eid', 'easter', 'valentines_day'],
    textColorAccent:      '#7B5C1E',
    textColorLegibility:  '#1F1A14',
  },

  minimalist_line_botanical: {
    id: 'minimalist_line_botanical',
    displayName: 'Minimalist line botanical',
    gpt_decoration_prompt:
      'Single thin continuous line drawing of a botanical element — a leafy branch, ' +
      'simple flower stem, or olive sprig — placed in the decorated zones. Monochrome ' +
      'fine ink line on cream background. Modern, restrained, and quiet. Negative space ' +
      'is the dominant aesthetic.',
    compatible_vibes: ['minimal', 'elegant', 'church'],
    compatible_occasions: ['sympathy', 'business', 'invitation', 'birthday',
      'happy_new_month', 'fathers_day', 'independence_day', 'easter'],
    textColorAccent:      '#3C4A3A',
    textColorLegibility:  '#1F1A14',
  },

  vintage_paper_texture: {
    id: 'vintage_paper_texture',
    displayName: 'Vintage paper — aged and timeless',
    gpt_decoration_prompt:
      'Aged vintage paper aesthetic — soft sepia or cream paper grain, faded ink stamps ' +
      'or wax seal motifs, subtle deckle edges, and old-letter elements. Warm tobacco ' +
      'and ivory tones, possibly with a faint border or aged corner accents. Quiet and ' +
      'timeless. No bright colors.',
    compatible_vibes: ['elegant', 'church', 'warm'],
    compatible_occasions: ['sympathy', 'invitation', 'business',
      'fathers_day', 'christmas', 'easter', 'eid'],
    textColorAccent:      '#6B4C2A',
    textColorLegibility:  '#2A1F0F',
  },

  balloon_streamer: {
    id: 'balloon_streamer',
    displayName: 'Balloons and streamers — festive',
    gpt_decoration_prompt:
      'Festive party decoration — illustrated balloons in primary or pastel colors, ' +
      'curling streamers, confetti bursts, and small celebration accents. Joyful and ' +
      'energetic, occupying the decorated zones with movement. No floral elements.',
    compatible_vibes: ['playful', 'bold', 'warm'],
    compatible_occasions: ['birthday', 'congrats', 'invitation',
      'happy_new_month', 'new_year', 'independence_day'],
    textColorAccent:      '#9B1C1C',
    textColorLegibility:  '#1F1A14',
  },

  soft_brush_strokes: {
    id: 'soft_brush_strokes',
    displayName: 'Soft brush strokes — painterly abstract',
    gpt_decoration_prompt:
      'Abstract painterly brush strokes — soft watercolor washes of color in the ' +
      'decorated zones, with no specific objects or shapes. Purely textural. Calming ' +
      'and atmospheric, like watercolor experiments on paper. Warm muted tones.',
    compatible_vibes: ['elegant', 'minimal', 'warm'],
    compatible_occasions: ['sympathy', 'business', 'invitation', 'congrats',
      'happy_new_month', 'mothers_day', 'fathers_day', 'valentines_day', 'easter'],
    textColorAccent:      '#6B4E37',
    textColorLegibility:  '#1F1A14',
  },

  botanical_herbarium: {
    id: 'botanical_herbarium',
    displayName: 'Botanical herbarium — pressed-leaf elegance',
    gpt_decoration_prompt:
      'Detailed pressed-leaf or pressed-flower botanical illustration in herbarium ' +
      'style — finely rendered single specimens like a fern, eucalyptus branch, or ' +
      'wildflower, on cream paper. Refined and quiet, with naturalist precision. Sage ' +
      'and olive tones, with subtle warm browns.',
    compatible_vibes: ['elegant', 'minimal', 'church'],
    compatible_occasions: ['sympathy', 'congrats', 'invitation', 'business',
      'mothers_day', 'fathers_day', 'easter'],
    textColorAccent:      '#3D5A3E',
    textColorLegibility:  '#1F1A14',
  },

  geometric_art_deco: {
    id: 'geometric_art_deco',
    displayName: 'Geometric art deco — gold linear ornament',
    gpt_decoration_prompt:
      'Art deco geometric ornament — fine gold linear frames, fan motifs, sunburst ' +
      'patterns, and structured chevron details. Elegant linear precision, no organic ' +
      'shapes. Cream background with gold and deep navy accents.',
    compatible_vibes: ['elegant', 'bold'],
    compatible_occasions: ['invitation', 'business', 'congrats', 'birthday',
      'new_year', 'christmas', 'fathers_day'],
    textColorAccent:      '#7B5C1E',
    textColorLegibility:  '#1F1A14',
  },

  watercolor_abstract: {
    id: 'watercolor_abstract',
    displayName: 'Watercolor abstract — atmospheric',
    gpt_decoration_prompt:
      'Cloudy abstract watercolor washes in the decorated zones — soft drifting clouds ' +
      'of color, no specific shapes or objects. Atmospheric and dreamy. Tones blend ' +
      'softly: blush, lavender, peach, butter yellow, or soft sage. Gentle and ' +
      'understated.',
    compatible_vibes: ['warm', 'elegant', 'minimal'],
    compatible_occasions: ['sympathy', 'birthday', 'congrats',
      'happy_new_month', 'mothers_day', 'valentines_day', 'easter'],
    textColorAccent:      '#7A4060',
    textColorLegibility:  '#1F1A14',
  },

  sunset_gradient: {
    id: 'sunset_gradient',
    displayName: 'Sunset gradient — modern atmospheric',
    gpt_decoration_prompt:
      'Subtle full-canvas gradient evoking sunrise, sunset, or dusk — soft transitions ' +
      'between warm cream, blush, peach, and golden hues. Minimal additional decoration: ' +
      'perhaps one or two delicate accent shapes. Modern and vibe-driven.',
    compatible_vibes: ['warm', 'minimal', 'bold'],
    compatible_occasions: ['birthday', 'congrats', 'invitation',
      'happy_new_month', 'new_year', 'independence_day', 'fathers_day'],
    textColorAccent:      '#9A4400',
    textColorLegibility:  '#1F1A14',
  },
};

export function getCompatibleThemes(occasion: string, vibe: string): ThemeId[] {
  return Object.values(THEMES)
    .filter(
      t =>
        t.compatible_occasions.includes(occasion as DecorativeTheme['compatible_occasions'][number]) &&
        t.compatible_vibes.includes(vibe as DecorativeTheme['compatible_vibes'][number])
    )
    .map(t => t.id);
}
