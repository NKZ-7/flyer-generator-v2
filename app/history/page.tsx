import { createClient } from '@/lib/supabase/server';
import { getUserCards } from '@/lib/supabase/db';
import { AuthButton } from '@/components/AuthButton';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { CardRecord } from '@/lib/supabase/db';

function CardThumbnail({ card }: { card: CardRecord }) {
  const label = card.occasion
    ? card.occasion.replace(/_/g, ' ')
    : 'Card';

  const date = new Date(card.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link href={`/cards/${card.id}`} className="group space-y-2">
      <div className="relative aspect-square rounded overflow-hidden border border-warm-600 bg-warm-800 group-hover:border-amber-400/40 transition-colors">
        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#3D3228]">
            <span className="text-3xl">◈</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-200 truncate leading-snug">
          {card.title}
        </p>
        <p className="text-[10px] text-[#6B5B4E] capitalize">
          {label} · {date}
        </p>
      </div>
    </Link>
  );
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const cards = await getUserCards(user.id);

  return (
    <div className="min-h-dvh bg-warm-900 text-zinc-200 font-sans">
      <header className="flex items-center justify-between px-5 h-12 border-b border-warm-600 bg-warm-800 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-amber-400 text-lg leading-none">◈</span>
          <span className="font-display text-sm font-semibold tracking-[0.2em] uppercase text-zinc-200 group-hover:text-amber-300 transition-colors">
            Cardonica
          </span>
        </Link>
        <AuthButton />
      </header>

      <main className="max-w-4xl mx-auto px-5 py-8">
        <h1 className="text-base font-semibold text-zinc-200 mb-6">
          Your cards
        </h1>

        {cards.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-sm text-[#9A8A7A]">
              You haven&rsquo;t saved any cards yet.
            </p>
            <p className="text-xs text-[#6B5B4E]">
              Make one and it&rsquo;ll show up here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center mt-4 px-5 py-2.5 min-h-[44px] bg-amber-400 text-zinc-950 text-sm font-semibold rounded hover:bg-amber-300 transition-colors"
            >
              Make a card →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {cards.map((card) => (
              <CardThumbnail key={card.id} card={card} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
