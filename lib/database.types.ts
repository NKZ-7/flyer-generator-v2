// Minimal hand-written Database type for Cardonica.
// Replace with generated types once the Supabase project is live:
//   npx supabase gen types typescript --project-id <id> > lib/database.types.ts

export type Database = {
  public: {
    Tables: {
      cards: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          title: string;
          body: string;
          signoff: string;
          occasion: string | null;
          vibe: string | null;
          typography_id: string | null;
          theme_id: string | null;
          layout_id: string | null;
          focal_motif: string | null;
          image_url: string | null;
          user_description: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string;
          created_at?: string;
          title: string;
          body: string;
          signoff: string;
          occasion?: string | null;
          vibe?: string | null;
          typography_id?: string | null;
          theme_id?: string | null;
          layout_id?: string | null;
          focal_motif?: string | null;
          image_url?: string | null;
          user_description?: string | null;
        };
        Update: {
          title?: string;
          body?: string;
          signoff?: string;
          occasion?: string | null;
          vibe?: string | null;
          typography_id?: string | null;
          theme_id?: string | null;
          layout_id?: string | null;
          focal_motif?: string | null;
          image_url?: string | null;
          user_description?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
