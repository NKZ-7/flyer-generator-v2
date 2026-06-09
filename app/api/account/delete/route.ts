import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServiceClient } from '@/lib/supabase/service';
import { Redis } from '@upstash/redis';

function getRedis() {
  return new Redis({
    url:                  process.env.UPSTASH_REDIS_REST_URL!,
    token:                process.env.UPSTASH_REDIS_REST_TOKEN!,
    enableAutoPipelining: false,
  });
}

function serviceHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey:         process.env.SUPABASE_SERVICE_ROLE_KEY!,
    Authorization:  `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
  };
}

function restUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1${path}`;
}

export async function POST() {
  // 1. Verify auth — reject anonymous callers
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;

  try {
    const supabaseService = getServiceClient();

    // 2. Fetch the user's card records to find storage paths
    const cardsRes = await fetch(
      restUrl(`/cards?user_id=eq.${encodeURIComponent(userId)}&select=id,image_url`),
      { headers: serviceHeaders() },
    );

    const cards = cardsRes.ok
      ? (await cardsRes.json() as { id: string; image_url: string | null }[])
      : [];

    // 3. Delete card images from Supabase Storage
    const imagePaths = cards
      .map(c => c.image_url)
      .filter((url): url is string => Boolean(url))
      .map(url => {
        // URLs look like: https://.../storage/v1/object/public/card-images/<path>
        const marker = '/card-images/';
        const idx = url.indexOf(marker);
        return idx !== -1 ? url.slice(idx + marker.length) : null;
      })
      .filter((p): p is string => Boolean(p));

    if (imagePaths.length > 0) {
      const { error: storageErr } = await supabaseService.storage
        .from('card-images')
        .remove(imagePaths);
      if (storageErr) {
        // Log but don't abort — card records and auth deletion still proceed
        console.error('[delete-account] storage removal error:', storageErr.message);
      }
    }

    // 4. Delete card records from Postgres
    const deleteCardsRes = await fetch(
      restUrl(`/cards?user_id=eq.${encodeURIComponent(userId)}`),
      { method: 'DELETE', headers: serviceHeaders() },
    );
    if (!deleteCardsRes.ok) {
      console.error('[delete-account] card record deletion error:', await deleteCardsRes.text());
    }

    // 5. Delete Redis rate-limit key for this user
    try {
      const redis = getRedis();
      await redis.del(`rl:user:${userId}`);
    } catch (redisErr) {
      // Non-fatal — key will expire naturally
      console.error('[delete-account] Redis key deletion error:', redisErr);
    }

    // 6. Delete the user from Supabase Auth (uses service role — never expose this key client-side)
    const { error: authErr } = await supabaseService.auth.admin.deleteUser(userId);
    if (authErr) {
      console.error('[delete-account] auth user deletion error:', authErr.message);
      return NextResponse.json({ error: 'Failed to delete account. Please try again.' }, { status: 500 });
    }

    // 7. Audit log
    console.log(`[delete-account] user_id=${userId} deleted_at=${new Date().toISOString()}`);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[delete-account] unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
