import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientProvider } from '../components/ClientProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FXONS | Trade Forex, Crypto, Stocks & Indices',
  description: 'FXONS — trade forex, crypto, stocks, commodities and indices with Binance-grade execution, instant crypto deposits and MT5 integration.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-bn-bg font-sans text-bnText-primary antialiased">
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
