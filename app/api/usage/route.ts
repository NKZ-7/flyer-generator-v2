import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getAnonymousUsage,
  getSignedInUsage,
  ANONYMOUS_LIMIT,
  SIGNED_IN_LIMIT,
} from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Read the middleware-refreshed session.
  let userId: string | undefined;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  } catch { /* non-fatal */ }

  if (userId) {
    try {
      const u   = await getSignedInUsage(userId);
      const resetInHours = Math.max(0, Math.ceil((u.resetAt.getTime() - Date.now()) / 3_600_000));
      return Response.json({
        isAuthenticated: true,
        used:         u.used,
        limit:        u.limit,
        remaining:    u.remaining,
        resetInHours,
        resetWindow:  'daily',
      });
    } catch {
      // Fail open — never block the UI because Redis is down.
      return Response.json({
        isAuthenticated: true,
        used: 0, limit: SIGNED_IN_LIMIT, remaining: SIGNED_IN_LIMIT,
        resetInHours: 24, resetWindow: 'daily',
      });
    }
  }

  // Anonymous path — need cookie + IP.
  const ip     = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const anonId = request.cookies.get('sendly_anon_id')?.value ?? 'unknown';

  try {
    const u   = await getAnonymousUsage(anonId, ip);
    const resetInHours = Math.max(0, Math.ceil((u.resetAt.getTime() - Date.now()) / 3_600_000));
    return Response.json({
      isAuthenticated: false,
      used:         u.used,
      limit:        u.limit,
      remaining:    u.remaining,
      resetInHours,
      resetWindow:  'rolling_3_days',
    });
  } catch {
    return Response.json({
      isAuthenticated: false,
      used: 0, limit: ANONYMOUS_LIMIT, remaining: ANONYMOUS_LIMIT,
      resetInHours: 72, resetWindow: 'rolling_3_days',
    });
  }
}
