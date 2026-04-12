// ──────────────────────────────────────────────
// Core flyer data types
// ──────────────────────────────────────────────

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
  tagline?: string;
  eventDate?: string;
  venue?: string;
  contactInfo?: string;
  style?: string;
  colorScheme?: string;
  primaryColor?: string;
  fontStyle?: string;
  additionalContext?: string;
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
// Redis job state (two-key pattern)
// ──────────────────────────────────────────────

export interface JobMeta {
  status: 'pending' | 'done' | 'error';
  copy?: FlyerCopy;
  designSpec?: DesignSpec;
  dallePrompt?: string;
  error?: string;
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
  copy: FlyerCopy;
  designSpec: DesignSpec;
  dallePrompt: string;
  createdAt: number;
}
