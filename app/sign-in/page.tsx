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
    <main
      style={{
        minHeight: '100dvh',
        background: 'radial-gradient(120% 80% at 50% 0%, #221A11, #16110C)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ maxWidth: 380, width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(150deg,#E3A93C,#B47C2A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1C160F', fontSize: 20, fontWeight: 700 }}>◈</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#F1E8DB' }}>CARDONICA</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8A7560' }}>AI CARDS &amp; FLYERS</div>
            </div>
          </div>
          <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 30, fontWeight: 600, color: '#F1E8DB', lineHeight: 1.2, marginBottom: 8 }}>Save every card you make.</p>
          <p style={{ fontSize: 13, color: '#8A7560', lineHeight: 1.5 }}>Sign in to save your cards and revisit them any time.</p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#FCA5A5', lineHeight: 1.5 }}>{error}</p>
          </div>
        )}

        {/* Google OAuth button — follows Google brand guidelines */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            minHeight: 52,
            padding: '12px 16px',
            background: '#F6F1EA',
            color: '#1f1f1f',
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 12,
            border: '1px solid #dadce0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginBottom: 16,
            transition: 'filter 0.15s',
          }}
        >
          {loading ? (
            <span style={{ color: '#5f6368' }}>Signing in…</span>
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
        <p style={{ textAlign: 'center', fontSize: 11, color: '#5E4E3E', lineHeight: 1.6, marginBottom: 20 }}>
          By signing in, you agree to our{' '}
          <Link href="/terms" style={{ color: '#9A8472', textDecoration: 'underline' }}>Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" style={{ color: '#9A8472', textDecoration: 'underline' }}>Privacy Policy</Link>.
        </p>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Link href="/" style={{ fontSize: 12, color: '#6B5742', textDecoration: 'none' }}>← Back to Cardonica</Link>
        </div>

        {/* Footer links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
          <Link href="/privacy" style={{ fontSize: 10, color: '#6B5742' }}>Privacy</Link>
          <Link href="/terms" style={{ fontSize: 10, color: '#6B5742' }}>Terms</Link>
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
