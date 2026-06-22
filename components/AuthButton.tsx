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
    return <div className="w-7 h-7 rounded-full animate-pulse" style={{ background: '#2E2417' }} />;
  }

  if (!user) {
    return (
      <Link
        href="/sign-in"
        style={{ background: '#F1E8DB', color: '#1C160F', borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
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
        className="flex items-center gap-1.5 min-h-[44px] px-1 rounded transition-colors hover:bg-[#2E2417]/40"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {/* Avatar — falls back to initials if URL fails to load */}
        {avatarUrl && !avatarErr ? (
          <img
            src={avatarUrl}
            alt={displayName}
            onError={() => setAvatarErr(true)}
            className="w-8 h-8 rounded-full object-cover shrink-0 hover:ring-[#E3A93C] transition-all"
            style={{ boxShadow: '0 0 0 1px #33281B' }}
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 select-none transition-all"
            style={{ background: 'rgba(227,169,60,0.15)', boxShadow: '0 0 0 1px rgba(227,169,60,0.30)', color: '#E3A93C' }}
          >
            {initial}
          </div>
        )}

        {/* Name — hidden on narrow screens */}
        <span className="hidden sm:block text-xs max-w-[96px] truncate leading-none" style={{ color: '#9A8472' }}>
          {displayName}
        </span>

        {/* Chevron — hidden on narrow screens */}
        <svg
          className={`hidden sm:block w-3 h-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ color: '#6B5742' }}
        >
          <path d="M2 4.5l4 3.5 4-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown — anchored to right edge */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-44 rounded-lg shadow-2xl z-50 overflow-hidden"
          style={{ background: '#1F1810', border: '1px solid #33281B' }}
        >
          <Link
            href="/history"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-3 text-xs hover:bg-[#2E2417]/50 transition-colors"
            style={{ color: '#9A8472' }}
          >
            My cards
          </Link>
          <Link
            href="/privacy"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-3 text-xs hover:bg-[#2E2417]/50 transition-colors"
            style={{ color: '#9A8472' }}
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-3 text-xs hover:bg-[#2E2417]/50 transition-colors"
            style={{ color: '#9A8472' }}
          >
            Terms of Service
          </Link>
          <div style={{ borderTop: '1px solid #33281B' }} />
          <form action="/sign-out" method="POST">
            <button
              type="submit"
              className="w-full text-left flex items-center px-4 py-3 text-xs hover:bg-[#2E2417]/50 transition-colors"
              style={{ color: '#6B5742' }}
            >
              Sign out
            </button>
          </form>
          <div style={{ borderTop: '1px solid #33281B' }} />
          <button
            onClick={() => { setOpen(false); setShowDeleteModal(true); }}
            className="w-full text-left flex items-center px-4 py-3 text-xs text-red-400/50 hover:text-red-400/80 hover:bg-[#2E2417]/50 transition-colors"
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
