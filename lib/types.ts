// ──────────────────────────────────────────────
// Core flyer data types
// ──────────────────────────────────────────────

export interface TemplateCopy {
  headline: string;
  body: string;
  signoff: string;
}

export interface FlyerCopy {
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  tagline: string;
}

export interface DesignNodeStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  color?: string;
  fontFamily?: 'Inter' | 'Oswald' | 'Playfair Display';
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  borderRadius?: number;
  opacity?: number;
  letterSpacing?: number;
}

export interface DesignNode {
  id: string;
  type: 'text' | 'shape' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  style?: DesignNodeStyle;
}

export interface DesignSpec {
  width: number;
  height: number;
  background: {
    type: 'solid' | 'gradient';
    color: string;
    gradient?: [string, string];
  };
  nodes: DesignNode[];
}

export interface FlyerPreferences {
  title: string;
  // ── New fields ────────────────────────────────────────────────
  occasion?: 'birthday' | 'sympathy' | 'congrats' | 'business' | 'invitation';
  vibe?: 'elegant' | 'warm' | 'playful' | 'bold' | 'church' | 'minimal';
  // ── Style hints (still sent to n8n for palette/font guidance) ─
  colorScheme?: string;
  primaryColor?: string;
  fontStyle?: string;
  // ── Content fields ────────────────────────────────────────────
  tagline?: string;
  eventDate?: string;
  venue?: string;
  contactInfo?: string;
  additionalContext?: string;
  region?: string;
  // ── Deprecated (kept for StudioLayout defaultPrefs compat) ────
  style?: string;
}

export type AssetRole =
  | 'main_person'
  | 'additional_person'
  | 'product_item'
  | 'logo'
  | 'background_scene'
  | 'other';

export interface UserAsset {
  id: string;
  previewUrl: string;
  imageBase64: string;
  mimeType: 'image/jpeg';
  originalFilename: string;
  role: AssetRole;
  placementInstructions: string;
}

// ──────────────────────────────────────────────
// GPT-canvas path types (new hybrid architecture)
// ──────────────────────────────────────────────

export type LayoutId =
  | 'centered_framed'
  | 'asymmetric_diagonal'
  | 'top_heavy'
  | 'magazine_split'
  | 'vignette_center'
  | 'banner_horizontal'
  | 'hero_name_radial';

export type TypographyPairingId =
  | 'classical_elegant'
  | 'modern_clean'
  | 'bold_impact'
  | 'romantic_serif'
  | 'warm_handwritten'
  | 'minimal_swiss';

export type DesignBrief = {
  palette_mood: string;
  decorative_direction: string;
  energy_tags: string[];
  layoutId: LayoutId;
  typographyId: TypographyPairingId;
  text_treatment: string;
};

// 4-field copy shape for GPT-canvas path.
// Named FlyerCopyV2 to avoid collision with legacy 5-field FlyerCopy (composite path).
export type FlyerCopyV2 = {
  headline: string;
  recipient_name: string;
  body: string;
  signoff: string;
};

// ──────────────────────────────────────────────
// Redis job state (two-key pattern)
// ──────────────────────────────────────────────

export interface JobMeta {
  status: 'pending' | 'done' | 'error';
  error?: string;
  // ── Template path (new standard branch) ──────────────────────
  templateId?: string;
  copy?: TemplateCopy;
  paletteIndex?: number; // use !== undefined checks — 0 is a valid index
  dalleArtUrl?: string; // base64 data URL of DALL-E art element (no-occasion fallback only)
  // ── GPT-canvas path (hybrid: GPT-image-1 canvas + Satori text overlay) ──
  designBrief?: DesignBrief;
  copyV2?: FlyerCopyV2;
  hasGptCanvas?: boolean; // canvas base64 stored separately in job:{id}:canvas key
  // ── Composite/legacy path (preserved — do not remove) ─────────
  // REVIEW: Remove legacyCopy/legacyDesignSpec/legacyDallePrompt when composite branch is refactored
  legacyCopy?: FlyerCopy;
  legacyDesignSpec?: DesignSpec;
  legacyDallePrompt?: string;
}

export interface JobRender {
  status: 'pending' | 'done' | 'error';
  error?: string;
  // dataUrl is NOT stored in Redis — returned directly in the status HTTP response
  // prerenderedDataUrl is set by the composite branch (Sharp-composited image, skips Satori)
  prerenderedDataUrl?: string;
}

// ──────────────────────────────────────────────
// API response shapes
// ──────────────────────────────────────────────

export interface JobStatusResponse {
  meta: JobMeta;
  render: JobRender;
  dataUrl?: string; // present only on the single poll that triggers rendering
}

// ──────────────────────────────────────────────
// UI state
// ──────────────────────────────────────────────

export type GeneratorPhase = 'idle' | 'generating' | 'done' | 'error';

export type DownloadFormat = 'png' | 'jpg' | 'pdf';

export interface VersionEntry {
  jobId: string;
  imageDataUrl: string;
  copy: TemplateCopy | FlyerCopy; // composite uses FlyerCopy, template uses TemplateCopy
  templateId?: string;
  paletteIndex?: number;
  createdAt: number;
}
