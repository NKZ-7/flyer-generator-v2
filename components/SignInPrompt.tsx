'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function SignInPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const supabase = createClient();

      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) setShow(true);
      }).catch(() => setShow(true));

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setShow(!session?.user);
      });
      subscription = data.subscription;
    } catch {
      setShow(true);
    }
    return () => subscription?.unsubscribe();
  }, []);

  if (!show) return null;

  return (
    <div className="relative shrink-0 px-5 py-4 border-t border-cream-border bg-[#C8B89A]/30">
      <p className="text-sm font-semibold text-[#2A211A] leading-snug">
        Want to keep track of your cards?
      </p>
      <p className="mt-1 text-xs text-[#6B5B4E] leading-relaxed">
        Sign in and I&rsquo;ll save your future cards so you can come back to them
        anytime. (This one stays just yours — saving starts from your next card.)
      </p>
      <Link
        href="/sign-in"
        className="mt-3 inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-semibold bg-amber-400 text-zinc-950 rounded hover:bg-amber-300 transition-colors"
      >
        Sign in
      </Link>
    </div>
  );
}
