import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FXONS | Trade Forex, Crypto, Stocks & Indices on MT5',
  description: 'FXONS is a global multi-asset broker. Trade 1,000+ instruments on MetaTrader 5 with ultra-low spreads, fast execution, instant crypto deposits and 24/7 support.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-navy-900 font-sans text-white antialiased">{children}</body>
    </html>
  );
}
