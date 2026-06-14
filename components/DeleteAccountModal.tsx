'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  onClose: () => void;
}

export function DeleteAccountModal({ onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });

      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(json.error ?? 'Something went wrong. Please try again.');
      }

      // Sign out client-side (belt-and-suspenders — server already invalidated the session)
      const supabase = createClient();
      await supabase.auth.signOut();

      // Redirect home with toast trigger
      window.location.href = '/?account=deleted';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="w-full max-w-sm bg-warm-800 border border-warm-600 rounded-xl shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-base font-semibold text-zinc-100 mb-2">Delete your account?</h2>
          <p className="text-sm text-[#9A8A7A] leading-relaxed">
            This will permanently delete your account, all cards you&rsquo;ve made, and your usage history.
            This can&rsquo;t be undone.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-500/30 px-3 py-2.5">
            <p className="text-xs text-red-300 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full min-h-[44px] px-4 py-2.5 bg-red-700/15 hover:bg-red-700/25 active:bg-red-700/30 border border-red-600/35 text-red-400 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Deleting…' : 'Yes, delete my account'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full min-h-[44px] px-4 py-2.5 text-sm text-[#9A8A7A] hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
