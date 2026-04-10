import type { Metadata } from 'next';
import { DM_Sans, Syne, Space_Mono } from 'next/font/google';
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

export const metadata: Metadata = {
  title: 'FlyerCraft — AI Flyer Generator',
  description: 'Generate professional marketing flyers in seconds with AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${syne.variable} ${spaceMono.variable} h-full`}
    >
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
