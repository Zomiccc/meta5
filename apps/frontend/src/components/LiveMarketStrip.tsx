'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PriceChange } from './ui/PriceChange';

interface MarketPair {
  symbol: string;
  price: number;
  change24h: number;
  flash: 'green' | 'red' | null;
  history: number[];
  decimals: number;
}

const INITIAL_PAIRS: { symbol: string; basePrice: number; change24h: number; decimals: number }[] = [
  { symbol: 'BTC/USDT', basePrice: 67500.45, change24h: 1.24, decimals: 2 },
  { symbol: 'ETH/USDT', basePrice: 3520.18, change24h: -0.86, decimals: 2 },
  { symbol: 'EUR/USD', basePrice: 1.08564, change24h: 0.32, decimals: 5 },
  { symbol: 'GBP/USD', basePrice: 1.27432, change24h: -0.14, decimals: 5 },
  { symbol: 'XAU/USD', basePrice: 2385.6, change24h: 0.95, decimals: 2 },
  { symbol: 'USOIL', basePrice: 82.45, change24h: -1.12, decimals: 2 },
  { symbol: 'S&P 500', basePrice: 5432.15, change24h: 0.45, decimals: 2 },
  { symbol: 'AAPL', basePrice: 223.45, change24h: 1.05, decimals: 2 },
];

function formatPrice(price: number, decimals: number) {
  return price.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function LiveMarketStrip() {
  const [markets, setMarkets] = useState<MarketPair[]>(
    INITIAL_PAIRS.map((p) => ({
      ...p,
      price: p.basePrice,
      flash: null,
      history: Array.from({ length: 20 }, () => p.basePrice),
    }))
  );
  const flashTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setMarkets((prev) =>
        prev.map((m) => {
          const volatility = m.symbol.includes('BTC')
            ? 0.0015
            : m.symbol.includes('ETH')
            ? 0.002
            : 0.0008;
          const delta = m.price * (Math.random() - 0.5) * volatility;
          const newPrice = Math.max(m.price * 0.999, m.price + delta);
          const newChange24h = m.change24h + (Math.random() - 0.5) * 0.03;
          const flash = newPrice > m.price ? 'green' : newPrice < m.price ? 'red' : null;

          if (flashTimers.current[m.symbol]) clearTimeout(flashTimers.current[m.symbol]);
          if (flash) {
            flashTimers.current[m.symbol] = setTimeout(() => {
              setMarkets((current) =>
                current.map((cm) => (cm.symbol === m.symbol ? { ...cm, flash: null } : cm))
              );
            }, 600);
          }

          const newHistory = [...m.history.slice(1), newPrice];
          return { ...m, price: newPrice, change24h: newChange24h, flash, history: newHistory };
        })
      );
    }, 2000);

    return () => {
      clearInterval(interval);
      Object.values(flashTimers.current).forEach(clearTimeout);
    };
  }, []);

  const maxChart = Math.max(...markets.map((m) => Math.max(...m.history)));
  const minChart = Math.min(...markets.map((m) => Math.min(...m.history)));

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
    <div className="w-full overflow-x-auto border-y border-bn-border bg-bn-secondary/60 py-3 scrollbar-hide">
      <div className="flex min-w-full items-stretch gap-2 px-4 sm:px-6 lg:px-8">
        {markets.map((m) => (
          <motion.div
            key={m.symbol}
            layout
            className={`relative flex min-w-[10.5rem] flex-1 flex-col justify-between rounded-bn border border-bn-border bg-bn-card p-3 transition ${
              m.flash === 'green' ? 'animate-flash-green' : m.flash === 'red' ? 'animate-flash-red' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-bnText-primary">{m.symbol}</span>
              <PriceChange value={m.change24h} />
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums text-bnText-primary">
              {formatPrice(m.price, m.decimals)}
            </div>
            <svg viewBox="0 0 100 100" className="mt-2 h-10 w-full" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke={m.change24h >= 0 ? '#0ECB81' : '#F6465D'}
                strokeWidth="2"
                points={sparkline(m.history)}
              />
            </svg>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
