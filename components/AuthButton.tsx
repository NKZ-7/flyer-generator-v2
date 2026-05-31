'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const supabase = createClient();

      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user);
        setLoading(false);
      }).catch(() => setLoading(false));

      const { data } = supabase.auth.onAuthStateChange(
        (_event, session) => setUser(session?.user ?? null),
      );
      subscription = data.subscription;
    } catch {
      setLoading(false);
    }
    return () => subscription?.unsubscribe();
  }, []);

  if (loading) {
    return <div className="w-14 h-4 bg-warm-700 rounded animate-pulse" />;
  }

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="text-xs text-[#9A8A7A] hover:text-zinc-200 transition-colors px-3 min-h-[44px] flex items-center"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/history"
        className="text-xs text-[#9A8A7A] hover:text-zinc-200 transition-colors px-2 min-h-[44px] flex items-center hidden sm:flex truncate max-w-[140px]"
        title={user.email}
      >
        {user.email}
      </Link>
      <form action="/sign-out" method="POST">
        <button
          type="submit"
          className="text-xs text-[#6B5B4E] hover:text-[#9A8A7A] transition-colors px-2 min-h-[44px] flex items-center"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
