'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../lib/api';

interface MarketPrice {
  symbol: string;
  label: string;
  price: number;
  change: number;
  decimals: number;
}

const FALLBACK_MARKETS: MarketPrice[] = [
  { symbol: 'BITSTAMP:BTCUSD', label: 'BTC', price: 0, change: 0, decimals: 2 },
  { symbol: 'BITSTAMP:ETHUSD', label: 'ETH', price: 0, change: 0, decimals: 2 },
  { symbol: 'BINANCE:BNBUSDT', label: 'BNB', price: 0, change: 0, decimals: 2 },
  { symbol: 'BINANCE:SOLUSDT', label: 'SOL', price: 0, change: 0, decimals: 2 },
  { symbol: 'BINANCE:XRPUSDT', label: 'XRP', price: 0, change: 0, decimals: 4 },
  { symbol: 'FX:EURUSD', label: 'EUR', price: 0, change: 0, decimals: 5 },
];

export default function Hero() {
  const [markets, setMarkets] = useState<MarketPrice[]>(FALLBACK_MARKETS);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await api.get('/public/markets');
        if (res.data?.prices) {
          const p = res.data.prices;
          setMarkets([
            { symbol: 'BITSTAMP:BTCUSD', label: 'BTC', price: p['BITSTAMP:BTCUSD'] ?? 0, change: 0, decimals: 2 },
            { symbol: 'BITSTAMP:ETHUSD', label: 'ETH', price: p['BITSTAMP:ETHUSD'] ?? 0, change: 0, decimals: 2 },
            { symbol: 'BINANCE:BNBUSDT', label: 'BNB', price: p['BINANCE:BNBUSDT'] ?? 0, change: 0, decimals: 2 },
            { symbol: 'BINANCE:SOLUSDT', label: 'SOL', price: p['BINANCE:SOLUSDT'] ?? 0, change: 0, decimals: 2 },
            { symbol: 'BINANCE:XRPUSDT', label: 'XRP', price: p['BINANCE:XRPUSDT'] ?? 0, change: 0, decimals: 4 },
            { symbol: 'FX:EURUSD', label: 'EUR', price: p['FX:EURUSD'] ?? 0, change: 0, decimals: 5 },
          ]);
        }
      } catch {}
    };
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden bg-bn-bg">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(240,185,11,0.06),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-6 sm:px-6 md:pt-20 md:pb-10 lg:pt-24">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: Headline + CTA */}
          <div className="animate-slide-up">
            <h1 className="text-3xl font-bold leading-tight text-bnText-primary sm:text-4xl md:text-5xl lg:text-6xl">
              The Multi-Asset Trading Platform
            </h1>
            <p className="mt-4 text-sm text-bnText-secondary sm:text-base md:mt-6 md:text-lg">
              Trade forex, crypto, stocks, indices and commodities on MetaTrader 5. Ultra-low spreads, lightning execution, and instant crypto deposits.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row md:mt-8">
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 rounded-bn bg-yellow px-6 py-3 text-sm font-bold text-bn-bg transition hover:bg-yellow-hover"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/markets"
                className="rounded-bn border border-bn-border bg-bn-secondary px-6 py-3 text-center text-sm font-medium text-bnText-primary transition hover:border-yellow hover:text-yellow"
              >
                View Markets
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-bnText-muted">
              <ShieldCheck className="h-4 w-4 text-bnGreen" />
              Segregated funds · Negative balance protection · 256-bit encryption
            </div>
          </div>

          {/* Right: Popular markets table */}
          <div className="animate-fade">
            <div className="rounded-bn border border-bn-border bg-bn-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-bn-border px-4 py-3">
                <h3 className="text-sm font-bold text-bnText-primary">Popular Markets</h3>
                <Link href="/markets" className="text-xs text-bnText-secondary transition hover:text-yellow">
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-bn-border">
                {markets.map((m) => {
                  const up = m.change >= 0;
                  return (
                    <div key={m.symbol} className="flex items-center justify-between px-4 py-3 transition hover:bg-bn-hover">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bn-secondary text-xs font-bold text-yellow">
                          {m.label.slice(0, 3)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-bnText-primary">{m.label}</div>
                          <div className="text-[10px] text-bnText-muted">{m.symbol.split(':')[0]}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-bnText-primary">
                          {m.price > 0 ? m.price.toFixed(m.decimals) : '—'}
                        </div>
                        <div className={`flex items-center justify-end gap-0.5 text-[10px] font-medium ${up ? 'text-bnGreen' : 'text-bnRed'}`}>
                          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {up ? '+' : ''}{m.change.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
