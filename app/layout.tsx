import type { Metadata } from 'next';
import {
  DM_Sans, Syne, Space_Mono, Oswald, Playfair_Display,
  Great_Vibes, Cormorant_Garamond, Dancing_Script, Raleway, Caveat, Bebas_Neue,
} from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const syne = Syne({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

const spaceMono = Space_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
});

const oswald = Oswald({
  variable: '--font-oswald',
  subsets: ['latin'],
  weight: ['400', '700'],
});

const playfairDisplay = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
});

const greatVibes = Great_Vibes({ variable: '--font-great-vibes', subsets: ['latin'], weight: ['400'] });
const cormorant = Cormorant_Garamond({ variable: '--font-cormorant', subsets: ['latin'], weight: ['400', '700'] });
const dancingScript = Dancing_Script({ variable: '--font-dancing', subsets: ['latin'], weight: ['400', '700'] });
const raleway = Raleway({ variable: '--font-raleway', subsets: ['latin'], weight: ['400', '700'] });
const caveat = Caveat({ variable: '--font-caveat', subsets: ['latin'], weight: ['400', '700'] });
const bebasNeue = Bebas_Neue({ variable: '--font-bebas', subsets: ['latin'], weight: ['400'] });

export const metadata: Metadata = {
  title: 'Sendly — AI Card & Flyer Maker',
  description: 'Create beautiful cards and flyers in seconds with AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${syne.variable} ${spaceMono.variable} ${oswald.variable} ${playfairDisplay.variable} ${greatVibes.variable} ${cormorant.variable} ${dancingScript.variable} ${raleway.variable} ${caveat.variable} ${bebasNeue.variable} h-full`}
    >
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
