import { createClient } from '@/lib/supabase/server';
import { getUserCards } from '@/lib/supabase/db';
import { AuthButton } from '@/components/AuthButton';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { CardRecord } from '@/lib/supabase/db';

function CardTile({ card }: { card: CardRecord }) {
  const label = card.occasion ? card.occasion.replace(/_/g, ' ') : 'Card';
  const date = new Date(card.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link href={`/cards/${card.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          aspectRatio: '4/5',
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid #33281B',
          marginBottom: 8,
          transition: 'border-color 0.15s',
          cursor: 'pointer',
          background: '#241C13',
        }}
      >
        {card.image_url ? (
          <img src={card.image_url} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3D3228', fontSize: 36 }}>◈</div>
        )}
      </div>
      <p style={{ fontSize: 12, fontWeight: 500, color: '#D8C9B4', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.title || 'Untitled'}</p>
      <p style={{ fontSize: 10.5, color: '#6B5742', textTransform: 'capitalize' }}>
        {label} · {date}
      </p>
    </Link>
  );
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const cards = await getUserCards(user.id);

  return (
    <div style={{ minHeight: '100dvh', background: '#16110C', color: '#F1E8DB', fontFamily: 'var(--font-sans)' }}>
      {/* Header — same as studio */}
      <header style={{ height: 60, background: '#1C160F', borderBottom: '1px solid #2E2418', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(150deg,#E3A93C,#B47C2A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1C160F', fontSize: 15, fontWeight: 700 }}>◈</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#F1E8DB' }}>CARDONICA</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#8A7560' }}>AI CARDS &amp; FLYERS</div>
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" className="btn-gold" style={{ borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>+ New card</Link>
          <AuthButton />
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 30, fontWeight: 600, color: '#F1E8DB', marginBottom: 4 }}>Your cards</h1>
          <p style={{ fontSize: 13, color: '#8A7560' }}>{cards.length} card{cards.length !== 1 ? 's' : ''} saved</p>
        </div>

        {cards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: 24, color: '#8A7560', marginBottom: 8 }}>No cards yet</p>
            <p style={{ fontSize: 13, color: '#6B5742', marginBottom: 20 }}>Generate your first card to see it here.</p>
            <Link href="/" className="btn-gold" style={{ borderRadius: 9, padding: '10px 24px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Make your first card →</Link>
          </div>
        ) : (
          <div className="history-grid">
            {cards.map((card) => (
              <CardTile key={card.id} card={card} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
