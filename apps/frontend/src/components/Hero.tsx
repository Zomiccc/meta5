'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { getSymbolName } from '../lib/symbolUtils';
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(252,213,53,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(14,203,129,0.04),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 md:pt-24 md:pb-12 lg:pt-28">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-bn border border-bn-border bg-bn-card px-3 py-1.5 text-xs font-medium text-bnText-secondary">
              <span className="flex h-2 w-2 rounded-full bg-bnGreen animate-pulse" />
              Live trading · MT5 integrated
            </div>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-bnText-primary sm:text-5xl lg:text-6xl">
              The Multi-Asset<br />Trading Platform
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-bnText-secondary sm:text-base md:mt-6 md:text-lg">
              Trade forex, crypto, stocks and indices on MetaTrader 5. Ultra-low spreads, lightning execution, and instant crypto deposits.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group flex items-center justify-center gap-2 rounded-bn bg-yellow px-6 py-3.5 text-sm font-bold text-black transition-all duration-200 hover:bg-yellow-hover active:scale-[0.97] shadow-glow-yellow"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/markets"
                className="rounded-bn border border-bn-border-light bg-bn-elevated px-6 py-3.5 text-center text-sm font-medium text-bnText-primary transition-all duration-200 hover:border-yellow/50 hover:text-yellow active:scale-[0.97]"
              >
                View Markets
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs text-bnText-muted">
              <ShieldCheck className="h-4 w-4 text-bnGreen" />
              Segregated funds · Negative balance protection · 256-bit encryption
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rounded-bn-lg border border-bn-border bg-bn-card overflow-hidden shadow-card-hover">
              <div className="flex items-center justify-between border-b border-bn-border px-5 py-4">
                <h3 className="text-sm font-bold text-bnText-primary">Popular Markets</h3>
                <Link href="/markets" className="text-xs text-bnText-secondary transition hover:text-yellow">
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-bn-border">
                {markets.map((m, i) => {
                  const up = m.change >= 0;
                  return (
                    <motion.div
                      key={m.symbol}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06, duration: 0.3 }}
                      className="flex items-center justify-between px-5 py-3.5 transition-colors duration-200 hover:bg-bn-hover"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bn-elevated text-xs font-bold text-yellow">
                          {m.label.slice(0, 3)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-bnText-primary">{m.label}</div>
                          <div className="text-2xs text-bnText-muted">{getSymbolName(m.symbol)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold tnum text-bnText-primary">
                          {m.price > 0 ? m.price.toFixed(m.decimals) : '—'}
                        </div>
                        <div className={`flex items-center justify-end gap-0.5 text-2xs font-medium ${up ? 'text-bnGreen' : 'text-bnRed'}`}>
                          {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {up ? '+' : ''}{m.change.toFixed(2)}%
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
