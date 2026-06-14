import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Sendly',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-warm-900 text-zinc-200 font-sans flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 h-12 border-b border-warm-600 bg-warm-800 shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-amber-400 text-lg leading-none">◈</span>
          <span className="font-display text-sm font-semibold tracking-[0.2em] uppercase text-zinc-200">
            Sendly
          </span>
        </Link>
        <Link href="/" className="text-xs text-[#6B5B4E] hover:text-[#9A8A7A] transition-colors">
          ← Back
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-5 py-12">
        <h1 className="font-display text-2xl font-semibold text-zinc-100 mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#6B5B4E] mb-8">Last updated: June 9, 2026</p>

        <p className="text-[#9A8A7A] leading-relaxed mb-10">
          Sendly is a small tool, and we want to be upfront about what we collect and why.
          This policy explains the data that flows through Sendly, where it goes, and what you can do about it.
        </p>

        <Section title="What we collect">
          <ul className="space-y-3 text-[#9A8A7A] text-sm leading-relaxed">
            <li>
              <span className="text-zinc-300 font-medium">From Google sign-in:</span>{' '}
              your name, email address, and profile picture — the basics Google shares when you choose to sign in.
            </li>
            <li>
              <span className="text-zinc-300 font-medium">When you make a card:</span>{' '}
              the text you enter — your description, recipient name, occasion choice, vibe, and region.
              This is sent to our AI partners to generate the card.
            </li>
            <li>
              <span className="text-zinc-300 font-medium">Generated cards:</span>{' '}
              if you&rsquo;re signed in, your cards are saved to your account so you can view them later.
            </li>
            <li>
              <span className="text-zinc-300 font-medium">Usage data:</span>{' '}
              which cards you generated and when. We use this only to enforce the rate limit — not for analytics or profiling.
            </li>
          </ul>
        </Section>

        <Section title="Where it goes">
          <ul className="space-y-3 text-[#9A8A7A] text-sm leading-relaxed">
            <li>
              <span className="text-zinc-300 font-medium">Account info and saved cards:</span>{' '}
              stored in Supabase (database hosted in eu-west-1, Ireland).
            </li>
            <li>
              <span className="text-zinc-300 font-medium">Card images:</span>{' '}
              stored in Supabase Storage, same region.
            </li>
            <li>
              <span className="text-zinc-300 font-medium">Rate-limit data:</span>{' '}
              temporarily stored in Upstash Redis. It auto-expires within 3 days for anonymous users and 24 hours for signed-in users.
            </li>
            <li>
              <span className="text-zinc-300 font-medium">Card generation:</span>{' '}
              the text you enter is sent to Anthropic (Claude) to write the copy, and to OpenAI (gpt-image-1) to generate the image.
              Their privacy policies apply to how they handle those requests.
            </li>
            <li>
              <span className="text-zinc-300 font-medium">Workflow orchestration:</span>{' '}
              requests are routed through n8n, which we self-host.
            </li>
          </ul>
        </Section>

        <Section title="What we don't do">
          <ul className="space-y-3 text-[#9A8A7A] text-sm leading-relaxed">
            <li>We don&rsquo;t sell your data — not to anyone, not ever.</li>
            <li>We don&rsquo;t show you ads.</li>
            <li>We don&rsquo;t train AI models on your content.</li>
            <li>
              We don&rsquo;t share your cards with other users.
              Your cards are private unless you download and share them yourself.
            </li>
          </ul>
        </Section>

        <Section title="Cookies">
          <ul className="space-y-3 text-[#9A8A7A] text-sm leading-relaxed">
            <li>
              <span className="text-zinc-300 font-medium">Authentication cookies:</span>{' '}
              used to keep you signed in across visits.
            </li>
            <li>
              <span className="text-zinc-300 font-medium">Rate-limit identification cookie:</span>{' '}
              a random ID we set for users who aren&rsquo;t signed in, so we can apply rate limits fairly.
            </li>
            <li>No advertising cookies. No tracking cookies. No third-party analytics.</li>
          </ul>
        </Section>

        <Section title="Your rights">
          <ul className="space-y-3 text-[#9A8A7A] text-sm leading-relaxed">
            <li>
              <span className="text-zinc-300 font-medium">See what we have on you:</span>{' '}
              email us at{' '}
              <a href="mailto:gabas2424@gmail.com" className="text-amber-400/80 hover:text-amber-400 transition-colors">
                gabas2424@gmail.com
              </a>{' '}
              and we&rsquo;ll tell you everything.
            </li>
            <li>
              <span className="text-zinc-300 font-medium">Delete your account:</span>{' '}
              use &ldquo;Delete my account&rdquo; in the account dropdown menu. This permanently removes your account,
              all your cards, and your data. There&rsquo;s no waiting period.
            </li>
            <li>
              <span className="text-zinc-300 font-medium">Correct anything wrong:</span>{' '}
              email us at{' '}
              <a href="mailto:gabas2424@gmail.com" className="text-amber-400/80 hover:text-amber-400 transition-colors">
                gabas2424@gmail.com
              </a>.
            </li>
          </ul>
        </Section>

        <Section title="Children">
          <p className="text-[#9A8A7A] text-sm leading-relaxed">
            Sendly is not intended for anyone under 13. We don&rsquo;t knowingly collect data from children under 13.
            If you believe a child has used Sendly, email us at{' '}
            <a href="mailto:gabas2424@gmail.com" className="text-amber-400/80 hover:text-amber-400 transition-colors">
              gabas2424@gmail.com
            </a>{' '}
            and we&rsquo;ll delete the account.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p className="text-[#9A8A7A] text-sm leading-relaxed">
            If anything here changes, we&rsquo;ll update this page. If the change is significant,
            we&rsquo;ll email signed-in users to let them know.
          </p>
        </Section>

        <Section title="Contact">
          <p className="text-[#9A8A7A] text-sm leading-relaxed">
            Questions? Email us at{' '}
            <a href="mailto:gabas2424@gmail.com" className="text-amber-400/80 hover:text-amber-400 transition-colors">
              gabas2424@gmail.com
            </a>.
          </p>
        </Section>
      </main>

      {/* Footer */}
      <footer className="border-t border-warm-600 py-5 px-5 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-[11px] text-[#6B5B4E]">
          <span>&copy; 2026 Sendly by Asarri</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#9A8A7A] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#9A8A7A] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-sm font-semibold text-zinc-300 mb-4 pb-2 border-b border-warm-600/60 uppercase tracking-wider">
        {title}
      </h2>
      {children}
    </section>
  );
}
