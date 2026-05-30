'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setLoading(false);

    if (otpError) {
      setError(otpError.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <main className="min-h-dvh bg-warm-900 flex items-center justify-center p-5">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-4xl mb-2">✉️</div>
          <h1 className="font-display text-2xl font-semibold text-zinc-200">
            Check your inbox
          </h1>
          <p className="text-sm text-[#9A8A7A] leading-relaxed">
            I sent a sign-in link to{' '}
            <span className="text-zinc-200 font-medium">{email.trim()}</span>.
            It expires in 1 hour.
          </p>
          <Link
            href="/"
            className="inline-block mt-4 text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            ← Back to Sendly
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-warm-900 flex items-center justify-center p-5">
      <div className="max-w-sm w-full space-y-7">
        {/* Wordmark */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-amber-400 text-2xl leading-none">◈</span>
            <span className="font-display text-xl font-semibold tracking-[0.2em] uppercase text-zinc-200">
              Sendly
            </span>
          </div>
          <p className="text-sm text-[#9A8A7A] leading-relaxed">
            Sign in to save your cards.{' '}
            <span className="text-[#6B5B4E]">I&rsquo;ll send you a link.</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            autoFocus
            className="w-full bg-warm-800 border border-warm-600 text-zinc-200 text-sm rounded px-4 py-3 placeholder-[#5A4C40] focus:outline-none focus:ring-1 focus:border-amber-400/50 focus:ring-amber-400/20 transition-colors"
          />
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-3 min-h-[44px] text-sm font-semibold bg-amber-400 text-zinc-950 rounded hover:bg-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending…' : 'Send me a link'}
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-[#6B5B4E] hover:text-[#9A8A7A] transition-colors"
          >
            ← Back to Sendly
          </Link>
        </div>
      </div>
    </main>
  );
}
