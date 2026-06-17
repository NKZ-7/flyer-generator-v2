import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Cardonica',
};

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-warm-900 text-zinc-200 font-sans flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 h-12 border-b border-warm-600 bg-warm-800 shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-amber-400 text-lg leading-none">◈</span>
          <span className="font-display text-sm font-semibold tracking-[0.2em] uppercase text-zinc-200">
            Cardonica
          </span>
        </Link>
        <Link href="/" className="text-xs text-[#6B5B4E] hover:text-[#9A8A7A] transition-colors">
          ← Back
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-5 py-12">
        <h1 className="font-display text-2xl font-semibold text-zinc-100 mb-2">Terms of Service</h1>
        <p className="text-sm text-[#6B5B4E] mb-8">Last updated: June 9, 2026</p>

        <p className="text-[#9A8A7A] text-sm leading-relaxed mb-10">
          These terms are the agreement between you and Cardonica. They&rsquo;re written in plain language
          because we think that&rsquo;s more respectful of your time than a wall of legalese.
        </p>

        <Section title="Who we are">
          <p className="text-[#9A8A7A] text-sm leading-relaxed">
            Cardonica is a tool for creating digital cards and flyers, made by Asarri, based in Ghana.
            If you have questions, you can reach us at{' '}
            <a href="mailto:gabas2424@gmail.com" className="text-amber-400/80 hover:text-amber-400 transition-colors">
              gabas2424@gmail.com
            </a>.
          </p>
        </Section>

        <Section title="Your account">
          <ul className="space-y-3 text-[#9A8A7A] text-sm leading-relaxed">
            <li>You&rsquo;re responsible for your account and everything done with it.</li>
            <li>You must be at least 13 years old to use Cardonica.</li>
            <li>One person per account — please don&rsquo;t share your credentials with others.</li>
          </ul>
        </Section>

        <Section title="What you can make">
          <ul className="space-y-3 text-[#9A8A7A] text-sm leading-relaxed">
            <li>You can create cards and flyers for personal or business use.</li>
            <li>
              <span className="text-zinc-300 font-medium">You own the cards you create.</span>{' '}
              We claim no rights over your content.
            </li>
            <li>
              You&rsquo;re responsible for the content you put into your cards.
              Don&rsquo;t make content that is defamatory, illegal, or hateful.
            </li>
          </ul>
        </Section>

        <Section title="What we ask you not to do">
          <ul className="space-y-3 text-[#9A8A7A] text-sm leading-relaxed">
            <li>Don&rsquo;t use Cardonica to create content that promotes hate, violence, or illegal activity.</li>
            <li>
              Don&rsquo;t attempt to abuse or break the service — including excessive automated requests
              or exploiting bugs to bypass rate limits.
            </li>
            <li>Don&rsquo;t impersonate someone else in your cards or account.</li>
            <li>Don&rsquo;t try to extract, reverse-engineer, or copy our AI prompts or system design.</li>
          </ul>
        </Section>

        <Section title="Service availability">
          <ul className="space-y-3 text-[#9A8A7A] text-sm leading-relaxed">
            <li>
              Cardonica is offered as-is. We genuinely try to keep it working well,
              but we can&rsquo;t guarantee uninterrupted service.
            </li>
            <li>
              We may change features, pause access, or shut down the service.
              If anything significant changes, we&rsquo;ll give reasonable notice.
            </li>
          </ul>
        </Section>

        <Section title="Liability">
          <ul className="space-y-3 text-[#9A8A7A] text-sm leading-relaxed">
            <li>
              We&rsquo;re not liable for damages arising from your use of Cardonica beyond what&rsquo;s
              required by applicable law.
            </li>
            <li>You use Cardonica at your own risk.</li>
          </ul>
        </Section>

        <Section title="Changes to these terms">
          <p className="text-[#9A8A7A] text-sm leading-relaxed">
            We may update these terms from time to time. If the change is significant,
            we&rsquo;ll email signed-in users to let them know.
            Continuing to use Cardonica after an update means you accept the new terms.
          </p>
        </Section>

        <Section title="Contact">
          <p className="text-[#9A8A7A] text-sm leading-relaxed">
            Questions about these terms? Email us at{' '}
            <a href="mailto:gabas2424@gmail.com" className="text-amber-400/80 hover:text-amber-400 transition-colors">
              gabas2424@gmail.com
            </a>.
          </p>
        </Section>
      </main>

      {/* Footer */}
      <footer className="border-t border-warm-600 py-5 px-5 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-[11px] text-[#6B5B4E]">
          <span>&copy; 2026 Cardonica by Asarri</span>
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
