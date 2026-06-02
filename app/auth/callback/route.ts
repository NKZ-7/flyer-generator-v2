import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Validates that a next param is a safe same-origin path.
// Rejects: empty, protocol-relative (//…), anything containing a scheme.
function safeNext(raw: string | null): string {
  if (!raw) return '/';
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith('/') && !decoded.startsWith('//') && !decoded.includes(':')) {
      return decoded;
    }
  } catch {
    // malformed encoding — fall through
  }
  return '/';
}

// Builds a redirect URL to /sign-in, preserving next so a retry still lands correctly.
function signInError(base: URL, code: string, next: string): NextResponse {
  const nextQuery = next !== '/' ? `&next=${encodeURIComponent(next)}` : '';
  return NextResponse.redirect(new URL(`/sign-in?error=${code}${nextQuery}`, base));
}

export async function GET(request: NextRequest) {
  const url  = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeNext(url.searchParams.get('next'));

  // Supabase sometimes delivers error params directly to the callback URL
  // (e.g., when the magic link itself is invalid or the token has already been used).
  if (url.searchParams.get('error')) {
    return signInError(url, 'auth_failed', next);
  }

  if (!code) {
    return signInError(url, 'missing_code', next);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession:', error.message);
    return signInError(url, 'auth_failed', next);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
