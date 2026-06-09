'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { DeleteAccountModal } from './DeleteAccountModal';

export function AuthButton() {
  const [user, setUser]         = useState<User | null>(null);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]               = useState(false);
  const [avatarErr, setAvatarErr]     = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const wrapRef                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sub: { unsubscribe: () => void } | null = null;
    try {
      const supabase = createClient();
      supabase.auth.getUser()
        .then(({ data }) => { setUser(data.user); setLoading(false); })
        .catch(() => setLoading(false));
      const { data } = supabase.auth.onAuthStateChange((_e, session) => {
        setUser(session?.user ?? null);
        setAvatarErr(false);
      });
      sub = data.subscription;
    } catch { setLoading(false); }
    return () => sub?.unsubscribe();
  }, []);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!open) return;
    function onMouse(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown',   onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown',   onKey);
    };
  }, [open]);

  if (loading) {
    return <div className="w-7 h-7 rounded-full bg-warm-700 animate-pulse" />;
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

  const avatarUrl  = user.user_metadata?.avatar_url as string | undefined;
  const fullName   = user.user_metadata?.full_name   as string | undefined;
  const displayName = fullName ?? (user.email?.split('@')[0] ?? 'You');
  const initial    = (fullName?.[0] ?? user.email?.[0] ?? '?').toUpperCase();

  return (
    <div ref={wrapRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 min-h-[44px] px-1 rounded transition-colors hover:bg-warm-700/30"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {/* Avatar — falls back to initials if URL fails to load */}
        {avatarUrl && !avatarErr ? (
          <img
            src={avatarUrl}
            alt={displayName}
            onError={() => setAvatarErr(true)}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-warm-600 shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-amber-400/15 ring-1 ring-amber-400/30 flex items-center justify-center text-amber-400 text-[11px] font-semibold shrink-0 select-none">
            {initial}
          </div>
        )}

        {/* Name — hidden on narrow screens */}
        <span className="hidden sm:block text-xs text-[#9A8A7A] max-w-[96px] truncate leading-none">
          {displayName}
        </span>

        {/* Chevron — hidden on narrow screens */}
        <svg
          className={`hidden sm:block w-3 h-3 text-[#6B5B4E] transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 12 12" fill="none" aria-hidden="true"
        >
          <path d="M2 4.5l4 3.5 4-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown — anchored to right edge */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-warm-800 border border-warm-600 rounded-lg shadow-2xl z-50 overflow-hidden">
          <Link
            href="/history"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-3 text-xs text-[#9A8A7A] hover:text-zinc-200 hover:bg-warm-700/50 transition-colors"
          >
            My cards
          </Link>
          <Link
            href="/privacy"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-3 text-xs text-[#9A8A7A] hover:text-zinc-200 hover:bg-warm-700/50 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-3 text-xs text-[#9A8A7A] hover:text-zinc-200 hover:bg-warm-700/50 transition-colors"
          >
            Terms of Service
          </Link>
          <div className="border-t border-warm-600/60" />
          <form action="/sign-out" method="POST">
            <button
              type="submit"
              className="w-full text-left flex items-center px-4 py-3 text-xs text-[#6B5B4E] hover:text-[#9A8A7A] hover:bg-warm-700/50 transition-colors"
            >
              Sign out
            </button>
          </form>
          <div className="border-t border-warm-600/40" />
          <button
            onClick={() => { setOpen(false); setShowDeleteModal(true); }}
            className="w-full text-left flex items-center px-4 py-3 text-xs text-red-400/50 hover:text-red-400/80 hover:bg-warm-700/50 transition-colors"
          >
            Delete my account
          </button>
        </div>
      )}

      {showDeleteModal && (
        <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
      )}
    </div>
  );
}
