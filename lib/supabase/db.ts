import 'server-only';
import { getServiceClient } from './service';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CardRecord {
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
}

export type CardInsert = Omit<CardRecord, 'id' | 'created_at'>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function restUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1${path}`;
}

function serviceHeaders(extra?: Record<string, string>) {
  return {
    'Content-Type': 'application/json',
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    ...extra,
  };
}

// ── Write operations (REST — bypasses the untyped client generics issue) ──────

export async function insertCard(card: CardInsert): Promise<string | null> {
  const res = await fetch(restUrl('/cards'), {
    method: 'POST',
    headers: serviceHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify(card),
  });

  if (!res.ok) {
    console.error('[db] insertCard error:', await res.text());
    return null;
  }

  const rows = (await res.json()) as { id: string }[];
  return rows[0]?.id ?? null;
}

// ── Read operations (use typed service client) ────────────────────────────────

export async function getUserCards(userId: string): Promise<CardRecord[]> {
  const res = await fetch(
    restUrl(`/cards?user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=20`),
    { headers: serviceHeaders() },
  );

  if (!res.ok) {
    console.error('[db] getUserCards error:', await res.text());
    return [];
  }

  return (await res.json()) as CardRecord[];
}

export async function getCardById(
  cardId: string,
  userId: string,
): Promise<CardRecord | null> {
  const res = await fetch(
    restUrl(`/cards?id=eq.${encodeURIComponent(cardId)}&user_id=eq.${encodeURIComponent(userId)}&limit=1`),
    { headers: serviceHeaders({ Accept: 'application/vnd.pgrst.object+json' }) },
  );

  if (!res.ok) return null;

  return (await res.json()) as CardRecord;
}

// ── Storage ───────────────────────────────────────────────────────────────────

export async function uploadCardImage(
  jobId: string,
  dataUrl: string,
): Promise<string | null> {
  const supabase = getServiceClient();

  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  const path = `${jobId}.png`;

  const { error } = await supabase.storage
    .from('card-images')
    .upload(path, buffer, { contentType: 'image/png', upsert: true });

  if (error) {
    console.error('[db] uploadCardImage error:', error.message);
    return null;
  }

  const { data } = supabase.storage.from('card-images').getPublicUrl(path);
  return data.publicUrl;
}
