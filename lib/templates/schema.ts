export type Slot = {
  id: 'headline' | 'body' | 'signoff' | 'meta';
  ideal_chars: [number, number];
  max_chars: number;
  hard_max_chars: number;
  font_family: string;
  font_weight: number;
  ideal_size_px: number;
  min_size_px: number;
  zone: { x: number; y: number; width: number; height: number };
  alignment: 'left' | 'center' | 'right';
  line_height: number;
  max_lines: number;
  color_token: 'primary' | 'accent' | 'highlight';
};

export type Palette = { primary: string; accent: string; highlight: string };

export type Template = {
  id: string;
  category: 'birthday' | 'sympathy' | 'congrats' | 'business' | 'invitation';
  vibe_tags: string[];
  dimensions: { width: number; height: number };
  background_url: string;
  slots: Slot[];
  palettes: Palette[];
};
