'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const AUTH_ERRORS: Record<string, string> = {
  auth_failed:     "I couldn't sign you in just now. Try again with the button below.",
  oauth_cancelled: "Looks like you cancelled — no problem, try again whenever you're ready.",
};

function SignInForm() {
  const searchParams = useSearchParams();
  const nextParam    = searchParams.get('next') ?? '/';
  const errorCode    = searchParams.get('error') ?? null;

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(
    errorCode
      ? (AUTH_ERRORS[errorCode] ?? 'Something went wrong signing you in. Try again below.')
      : null,
  );

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);

    const supabase  = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo },
    });

    if (oauthError) {
      // Only reached if the redirect itself fails (rare — Google OAuth normally redirects immediately)
      setLoading(false);
      setError("I couldn't start the sign-in. Try again below.");
    }
    // On success the browser navigates away — no need to reset loading
  }

  return (
    <main className="min-h-dvh bg-warm-900 flex items-center justify-center p-5">
      <div className="max-w-sm w-full space-y-7">

        {/* Wordmark */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-amber-400 text-2xl leading-none">◈</span>
            <span className="font-display text-xl font-semibold tracking-[0.2em] uppercase text-zinc-200">
              Cardonica
            </span>
          </div>
          <p className="text-sm text-[#9A8A7A] leading-relaxed">
            Sign in to save your cards.{' '}
            <span className="text-[#6B5B4E]">One tap and you&rsquo;re in.</span>
          </p>
        </div>

        {/* Error banner — shown when callback redirects back with ?error= */}
        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-500/30 px-4 py-3">
            <p className="text-xs text-red-300 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Google OAuth button — follows Google brand guidelines */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 min-h-[48px] px-4 py-3 bg-white text-[#1f1f1f] text-sm font-medium rounded-lg border border-[#dadce0] hover:bg-[#f8f8f8] active:bg-[#f0f0f0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <span className="text-[#5f6368]">Signing in…</span>
          ) : (
            <>
              {/* Official Google G logo */}
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Legal notice */}
        <p className="text-center text-[11px] text-[#6B5B4E] leading-relaxed -mt-3">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-[#9A8A7A] underline underline-offset-2 hover:text-zinc-300 transition-colors">
            Terms
          </Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-[#9A8A7A] underline underline-offset-2 hover:text-zinc-300 transition-colors">
            Privacy Policy
          </Link>.
        </p>

        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-[#6B5B4E] hover:text-[#9A8A7A] transition-colors"
          >
            ← Back to Cardonica
          </Link>
        </div>

        {/* Footer links */}
        <div className="flex justify-center gap-5 pt-2">
          <Link href="/privacy" className="text-[10px] text-[#6B5B4E] hover:text-[#9A8A7A] transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="text-[10px] text-[#6B5B4E] hover:text-[#9A8A7A] transition-colors">
            Terms
          </Link>
        </div>

      </div>
    </main>
  );
}

// useSearchParams requires a Suspense boundary in Next.js App Router.
export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
