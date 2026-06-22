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
    <div
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 64,
        zIndex: 5,
        background: '#241C13',
        border: '1px solid #33281B',
        borderRadius: 12,
        padding: '14px 16px',
        boxShadow: '0 18px 40px -12px rgba(0,0,0,0.5)',
      }}
    >
      <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 17, fontWeight: 600, color: '#F1E8DB', lineHeight: 1.3 }}>
        Want to keep track of your cards?
      </p>
      <p style={{ marginTop: 4, fontSize: 12, color: '#8A7560', lineHeight: 1.5 }}>
        Sign in and I&rsquo;ll save your future cards so you can come back to them
        anytime. (This one stays just yours — saving starts from your next card.)
      </p>
      <Link
        href="/sign-in"
        className="btn-gold"
        style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 40, padding: '0 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, textDecoration: 'none' }}
      >
        Sign in
      </Link>
    </div>
  );
}
