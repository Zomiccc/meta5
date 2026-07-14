'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { PriceChange } from './ui/PriceChange';

interface MarketPair {
  symbol: string;
  label: string;
  price: number;
  change24h: number | null;
  flash: 'green' | 'red' | null;
  history: number[];
  decimals: number;
  source: string;
}

const MARKETS: { symbol: string; label: string; decimals: number }[] = [
  { symbol: 'BITSTAMP:BTCUSD', label: 'BTC/USDT', decimals: 2 },
  { symbol: 'BITSTAMP:ETHUSD', label: 'ETH/USDT', decimals: 2 },
  { symbol: 'FX:EURUSD', label: 'EUR/USD', decimals: 5 },
  { symbol: 'FX:GBPUSD', label: 'GBP/USD', decimals: 5 },
  { symbol: 'OANDA:XAUUSD', label: 'XAU/USD', decimals: 2 },
  { symbol: 'TVC:USOIL', label: 'USOIL', decimals: 2 },
  { symbol: 'FOREXCOM:SPXUSD', label: 'S&P 500', decimals: 2 },
  { symbol: 'NASDAQ:AAPL', label: 'AAPL', decimals: 2 },
];

function formatPrice(price: number, decimals: number) {
  return price.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function LiveMarketStrip() {
  const [markets, setMarkets] = useState<MarketPair[]>(
    MARKETS.map((m) => ({
      ...m,
      price: 0,
      change24h: null,
      flash: null,
      history: [],
      source: 'loading',
    }))
  );
  const flashTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const symbols = MARKETS.map((m) => m.symbol).join(',');

  const fetchPrices = async () => {
    try {
      const res = await api.get(`/public/markets?symbols=${encodeURIComponent(symbols)}`);
      const { prices, changes, sources } = res.data as {
        prices: Record<string, number>;
        changes: Record<string, number | null>;
        sources: Record<string, string>;
      };

      setMarkets((prev) =>
        prev.map((m) => {
          const newPrice = prices[m.symbol];
          if (!newPrice || isNaN(newPrice)) return m;

          const prevPrice = m.price || newPrice;
          const flash = newPrice > prevPrice ? 'green' : newPrice < prevPrice ? 'red' : null;

          if (flashTimers.current[m.symbol]) clearTimeout(flashTimers.current[m.symbol]);
          if (flash) {
            flashTimers.current[m.symbol] = setTimeout(() => {
              setMarkets((current) =>
                current.map((cm) => (cm.symbol === m.symbol ? { ...cm, flash: null } : cm))
              );
            }, 600);
          }

          const newHistory = [...m.history.slice(-19), newPrice];
          return {
            ...m,
            price: newPrice,
            change24h: changes[m.symbol] ?? m.change24h,
            source: sources[m.symbol] || 'live',
            flash,
            history: newHistory,
          };
        })
      );
    } catch (err) {
      // keep last known prices on failure
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 3000);
    return () => {
      clearInterval(interval);
      Object.values(flashTimers.current).forEach(clearTimeout);
    };
  }, []);

  const sparkline = (history: number[]) => {
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    const points = history.map((v, i) => {
      const x = (i / (history.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    });
    return points.join(' ');
  };

  return (
    <div className="w-full overflow-x-auto border-y border-bn-border bg-bn-secondary/60 py-2 scrollbar-hide md:py-3">
      <div className="flex min-w-full items-stretch gap-1.5 px-3 sm:px-6 lg:px-8 md:gap-2">
        {markets.map((m) => (
          <motion.div
            key={m.symbol}
            layout
            className={`relative flex min-w-[8.5rem] flex-1 flex-col justify-between rounded-bn border border-bn-border bg-bn-card p-2 transition md:min-w-[10.5rem] md:p-3 ${
              m.flash === 'green' ? 'animate-flash-green' : m.flash === 'red' ? 'animate-flash-red' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-bnText-primary">{m.label}</span>
              {m.change24h !== null ? <PriceChange value={m.change24h} /> : <span className="text-xs text-bnText-muted">—</span>}
            </div>
            <div className="mt-0.5 text-sm font-bold tabular-nums text-bnText-primary md:mt-1 md:text-lg">
              {m.price ? formatPrice(m.price, m.decimals) : '—'}
            </div>
            <div className="mt-1 flex items-center justify-between gap-1">
              <span className="text-[9px] uppercase tracking-wider text-bnText-muted md:text-[10px]">{m.source}</span>
              {m.price > 0 && m.history.length > 1 && (
                <svg viewBox="0 0 100 100" className="h-6 w-14 md:h-8 md:w-20" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke={m.change24h === null ? '#848E9C' : m.change24h >= 0 ? '#0ECB81' : '#F6465D'}
                    strokeWidth="2"
                    points={sparkline(m.history)}
                  />
                </svg>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
