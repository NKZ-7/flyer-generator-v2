import { createClient } from '@/lib/supabase/server';
import { getCardById } from '@/lib/supabase/db';
import { AuthButton } from '@/components/AuthButton';
import { DownloadButton } from '@/components/DownloadButton';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CardPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const card = await getCardById(id, user.id);
  if (!card) redirect('/history');

  const date = new Date(card.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Build prefill URL for 'Make a similar one'
  const prefill = encodeURIComponent(
    JSON.stringify({
      additionalContext: card.user_description ?? '',
      occasion: card.occasion ?? undefined,
      vibe: card.vibe ?? undefined,
    }),
  );

  return (
    <div className="min-h-dvh bg-warm-900 text-zinc-200 font-sans">
      <header className="flex items-center justify-between px-5 h-12 border-b border-warm-600 bg-warm-800 shrink-0">
        <Link
          href="/history"
          className="flex items-center gap-1.5 text-xs text-[#9A8A7A] hover:text-zinc-200 transition-colors min-h-[44px]"
        >
          ← Your cards
        </Link>
        <AuthButton />
      </header>

      <main className="max-w-lg mx-auto px-5 py-8 space-y-6">
        {/* Card image */}
        <div className="rounded overflow-hidden border border-warm-600">
          {card.image_url ? (
            <img
              src={card.image_url}
              alt={card.title}
              className="w-full"
            />
          ) : (
            <div className="aspect-square bg-warm-800 flex items-center justify-center text-[#3D3228]">
              <span className="text-5xl">◈</span>
            </div>
          )}
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-base font-semibold text-zinc-200 leading-snug">
            {card.title}
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
            {card.body}
          </p>
          <p className="text-xs text-[#9A8A7A] italic">{card.signoff}</p>
        </div>

        {/* Meta tags */}
        <div className="flex flex-wrap gap-2">
          {card.occasion && (
            <span className="text-[10px] px-2 py-1 rounded bg-warm-800 border border-warm-600 text-[#9A8A7A] capitalize">
              {card.occasion.replace(/_/g, ' ')}
            </span>
          )}
          {card.vibe && (
            <span className="text-[10px] px-2 py-1 rounded bg-warm-800 border border-warm-600 text-[#9A8A7A] capitalize">
              {card.vibe}
            </span>
          )}
          <span className="text-[10px] px-2 py-1 rounded bg-warm-800 border border-warm-600 text-[#6B5B4E]">
            {date}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          {card.image_url && (
            <DownloadButton
              url={card.image_url}
              filename={`cardonica-${id.slice(0, 8)}.png`}
              className="flex-1 py-3 min-h-[44px] text-sm font-medium text-center border border-warm-600 text-[#C4B4A4] rounded hover:bg-warm-700 transition-colors flex items-center justify-center"
            />
          )}
          <Link
            href={`/?prefill=${prefill}`}
            className="flex-1 py-3 min-h-[44px] text-sm font-semibold text-center bg-amber-400 text-zinc-950 rounded hover:bg-amber-300 transition-colors flex items-center justify-center"
          >
            Make a similar one →
          </Link>
        </div>
      </main>
    </div>
  );
}
