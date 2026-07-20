'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardShell from '../../../components/DashboardShell';
import { api } from '../../../lib/api';
import { getDisplaySymbol, formatPriceForSymbol } from '../../../lib/symbolUtils';
import { Loader2 } from 'lucide-react';

interface Instrument {
  label: string;
  symbol: string;
  price: number;
  contractSize: number;
  category: string;
}

const CATEGORY_ORDER = ['Forex', 'Crypto', 'Stocks', 'Indices'];

export default function DashboardMarketsPage() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [category, setCategory] = useState<string>('Forex');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/mt5/instruments')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setInstruments(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (instruments.length === 0) return;
    const fetchPrices = async () => {
      try {
        const symbols = instruments.map((i) => i.symbol).join(',');
        const res = await api.get(`/public/markets?symbols=${encodeURIComponent(symbols)}`);
        setPrices(res.data?.prices || {});
      } catch {
        // ignore
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 1000);
    return () => clearInterval(interval);
  }, [instruments]);

  const categories = useMemo(() => {
    const map: Record<string, Instrument[]> = {};
    for (const inst of instruments) {
      if (!map[inst.category]) map[inst.category] = [];
      map[inst.category].push(inst);
    }
    return map;
  }, [instruments]);

  const activeList = categories[category] || [];

  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-6xl space-y-4 pb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-bnText-primary">Markets</h1>
          <p className="text-xs text-bnText-secondary">Tradeable instruments only</p>
        </div>

        <div className="w-full overflow-hidden">
          <div className="flex overflow-x-auto gap-2 scrollbar-hide pb-1">
            {CATEGORY_ORDER.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${
                  category === cat ? 'bg-yellow text-black' : 'bg-bn-card text-bnText-secondary hover:text-bnText-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-yellow" />
          </div>
        ) : activeList.length === 0 ? (
          <div className="rounded-bn border border-bn-border bg-bn-card p-6 text-center text-sm text-bnText-secondary">
            No tradeable instruments in this category.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeList.map((inst) => {
              const live = prices[inst.symbol];
              const change = live && inst.price ? ((live - inst.price) / inst.price) * 100 : 0;
              return (
                <Link
                  key={inst.symbol}
                  href={`/dashboard/trade?symbol=${encodeURIComponent(inst.symbol)}`}
                  className="flex items-center justify-between rounded-bn border border-bn-border bg-bn-card p-4 transition hover:border-yellow/30"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-bnText-primary">{getDisplaySymbol(inst.symbol)}</div>
                    <div className="text-xs text-bnText-secondary">{inst.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold tnum text-bnText-primary">
                      {live ? formatPriceForSymbol(inst.symbol, live) : '—'}
                    </div>
                    {live && (
                      <div className={`text-xs tnum ${change >= 0 ? 'text-bnGreen' : 'text-bnRed'}`}>
                        {change >= 0 ? '+' : ''}
                        {change.toFixed(2)}%
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
