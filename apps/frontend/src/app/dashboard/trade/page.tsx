'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardShell from '../../../components/DashboardShell';
import LiveChart from '../../../components/LiveChart';
import { useAuth } from '../../../lib/useAuth';
import { api, consumeSse } from '../../../lib/api';
import { Loader2, Zap, X, AlertTriangle, Search, ChevronDown } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { getDisplaySymbol, getSymbolName, formatPriceForSymbol } from '../../../lib/symbolUtils';

interface Instrument {
  label: string;
  symbol: string;
  price: number;
  contractSize: number;
  category: string;
}

const DEFAULT_INSTRUMENT: Instrument = { label: 'EUR/USD', symbol: 'FX:EURUSD', price: 1.0856, contractSize: 100000, category: 'Forex' };
const CATEGORY_ORDER = ['All', 'Forex', 'Crypto', 'Commodities', 'Stocks', 'Indices'];

const LEVERAGE = 1000;

interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  openTime: string;
}

interface TradingSnapshot {
  account: any;
  trades: Trade[];
  prices: Record<string, number>;
  serverTime: number;
  error?: string;
}

export default function TradePage() {
  const { user, loading } = useAuth();
  const [instruments, setInstruments] = useState<Instrument[]>([DEFAULT_INSTRUMENT]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<Instrument>(DEFAULT_INSTRUMENT);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [volume, setVolume] = useState('0.10');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [account, setAccount] = useState<any>(null);
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [funding, setFunding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [streamConnected, setStreamConnected] = useState(false);
  const [tvPrice, setTvPrice] = useState<number | null>(null);

  // Listen to TradingView price updates to sync watchlist with chart
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.name === 'quoteUpdate' || event.data?.price) {
        const price = event.data.price || event.data?.p;
        if (price && typeof price === 'number') {
          setTvPrice(parseFloat(price.toString()));
          // Also update livePrices for the active symbol so watchlist matches chart
          setLivePrices((prev) => ({ ...prev, [active.symbol]: parseFloat(price.toString()) }));
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [active.symbol]);

  const hasMt5 = !!user?.mt5Account;
  const balance = Number(account?.balance ?? user?.mt5Account?.balance ?? 0);
  const equity = Number(account?.equity ?? user?.mt5Account?.equity ?? 0);
  const margin = Number(account?.margin ?? user?.mt5Account?.margin ?? 0);
  const freeMargin = equity - margin;
  const marginLevel = margin > 0 ? (equity / margin) * 100 : 0;

  const showToast = (type: 'success' | 'error' | 'info', msg: string) => {
    if (type === 'success') toastSuccess(msg);
    else if (type === 'error') toastError(msg);
    else toastInfo(msg);
  };

  // Load instrument catalog
  useEffect(() => {
    api.get('/mt5/instruments')
      .then((res) => {
        const list: Instrument[] = res.data.map((i: any) => ({
          label: i.label,
          symbol: i.symbol,
          price: i.basePrice,
          contractSize: i.contractSize,
          category: i.category || 'Other',
        }));
        if (list.length) {
          setInstruments(list);
          setActive((prev) => list.find((x) => x.symbol === prev.symbol) || list[0]);
        }
      })
      .catch(() => undefined);
  }, []);

  // Poll live prices for all instruments every 3 seconds via REST (faster than SSE alone)
  useEffect(() => {
    if (loading || instruments.length === 0) return;

    const controller = new AbortController();
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const symbols = encodeURIComponent(instruments.map((instrument) => instrument.symbol).join(','));

    const connect = async () => {
      try {
        await consumeSse<TradingSnapshot>(`/mt5/stream?symbols=${symbols}`, (snapshot) => {
          if (snapshot.error) return;
          setStreamConnected(true);
          setLivePrices((current) => ({ ...current, ...snapshot.prices }));
          setTrades(snapshot.trades);
          setAccount(snapshot.account);
        }, controller.signal);
      } catch {
        if (!controller.signal.aborted) {
          setStreamConnected(false);
          retryTimer = setTimeout(connect, 1000);
        }
      }
    };

    connect();

    return () => {
      controller.abort();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [loading, instruments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return instruments.filter((i) => {
      const matchesCat = category === 'All' || i.category === category;
      const matchesSearch = !q || i.label.toLowerCase().includes(q) || i.symbol.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [instruments, category, search]);

  const refreshAccount = useCallback(async () => {
    if (!hasMt5) return;
    try {
      const res = await api.get('/mt5/account');
      setAccount(res.data);
    } catch {
      // ignore
    }
  }, [hasMt5]);

  const refreshTrades = useCallback(async () => {
    if (!hasMt5) return;
    try {
      const res = await api.get('/mt5/trades');
      setTrades(res.data);
      // Also refresh account since equity changes with P&L
      await refreshAccount();
    } catch {
      // ignore
    }
  }, [hasMt5, refreshAccount]);

  // Initial load + poll for live P&L every 1 second
  useEffect(() => {
    if (loading || !hasMt5) return;
    refreshAccount();
    refreshTrades();
    const tradesInterval = setInterval(refreshTrades, 1000);
    const accountInterval = setInterval(refreshAccount, 1000);
    return () => {
      clearInterval(tradesInterval);
      clearInterval(accountInterval);
    };
  }, [loading, hasMt5, refreshAccount, refreshTrades]);

  const activeLivePrice = livePrices[active.symbol] ?? active.price;

  const estMargin = useMemo(() => {
    const vol = parseFloat(volume) || 0;
    const notional = vol * active.contractSize * activeLivePrice;
    return (notional / LEVERAGE).toFixed(2);
  }, [volume, active, activeLivePrice]);

  const addTestFunds = async () => {
    setFunding(true);
    try {
      const res = await api.post('/mt5/test-fund', { amount: 10000 });
      showToast('success', res.data.message);
      await refreshAccount();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to add test funds');
    } finally {
      setFunding(false);
    }
  };

  const placeOrder = async () => {
    const vol = parseFloat(volume);
    if (!vol || vol <= 0) {
      showToast('error', 'Enter a valid volume');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/mt5/trade', { symbol: active.symbol, type: side, volume: vol });
      showToast('success', res.data.message);
      await refreshTrades();
      await refreshAccount();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Order failed');
    } finally {
      setSubmitting(false);
    }
  };

  const closeTrade = async (tradeId: string) => {
    setClosingId(tradeId);
    try {
      const res = await api.post(`/mt5/trades/${tradeId}/close`);
      showToast('info', res.data.message);
      await refreshTrades();
      await refreshAccount();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to close position');
    } finally {
      setClosingId(null);
    }
  };

  const [mobileTab, setMobileTab] = useState<'markets' | 'chart' | 'trade' | 'positions'>('chart');
  const [showInstrumentPicker, setShowInstrumentPicker] = useState(false);

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-yellow" />
        </div>
      </DashboardShell>
    );
  }

  const criticalMargin = marginLevel > 0 && marginLevel < 60;

  // ---- Shared sections ----

  const watchlistContent = (
    <>
      <div className="relative p-2 flex-shrink-0">
        <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-bnText-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full rounded bg-bn-input py-1.5 pl-8 pr-2 text-xs text-bnText-primary placeholder:text-bnText-muted focus:outline-none"
        />
      </div>
      <div className="flex flex-shrink-0 gap-1 overflow-x-auto border-b border-bn-border px-2 pb-1.5 scrollbar-hide">
        {CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 rounded px-2 py-1 text-[10px] font-medium transition ${
              category === cat ? 'bg-yellow text-bn-bg' : 'text-bnText-secondary hover:text-bnText-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto p-1">
        {filtered.map((item) => {
          const live = livePrices[item.symbol];
          const up = live ? live >= item.price : false;
          return (
            <button
              key={item.symbol}
              onClick={() => setActive(item)}
              className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left transition ${
                active.symbol === item.symbol ? 'bg-yellow/10' : 'hover:bg-bn-hover'
              }`}
            >
              <div className="flex min-w-0 flex-col">
                <span className={`text-xs font-medium ${active.symbol === item.symbol ? 'text-yellow' : 'text-bnText-primary'}`}>{getDisplaySymbol(item.symbol)}</span>
                <span className="truncate text-[9px] text-bnText-muted">{getSymbolName(item.symbol)}</span>
              </div>
              <div className="text-right">
                <span className={`font-mono text-[11px] ${live ? (up ? 'text-bnGreen' : 'text-bnRed') : 'text-bnText-muted'}`}>
                  {live ? formatPriceForSymbol(item.symbol, live) : '—'}
                </span>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-4 text-center text-xs text-bnText-muted">No matches</p>
        )}
      </div>
    </>
  );

  const chartContent = (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-bn-border px-3 py-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-bnText-primary">{getDisplaySymbol(active.symbol)}</span>
          <span className={`font-mono text-xs ${livePrices[active.symbol] ? (activeLivePrice >= active.price ? 'text-bnGreen' : 'text-bnRed') : 'text-bnText-muted'}`}>
            {livePrices[active.symbol] ? formatPriceForSymbol(active.symbol, activeLivePrice) : '—'}
          </span>
        </div>
        <span className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${streamConnected ? 'bg-bnGreen/10 text-bnGreen' : 'bg-yellow/10 text-yellow'}`}>
          <span className={`h-1 w-1 animate-pulse rounded-full ${streamConnected ? 'bg-bnGreen' : 'bg-yellow'}`} />
          {streamConnected ? 'LIVE' : '...'}
        </span>
      </div>
      <div className="flex-1 overflow-hidden">
        <LiveChart symbol={active.symbol} price={activeLivePrice} height={1000} />
      </div>
    </div>
  );

  const orderPanel = (
    <div className="flex h-full flex-col overflow-y-auto p-3">
      <div className="mb-3 flex flex-shrink-0 gap-1">
        <button
          onClick={() => setSide('BUY')}
          className={`flex-1 rounded py-2 text-xs font-bold transition ${
            side === 'BUY' ? 'bg-bnGreen text-bn-bg' : 'bg-bn-input text-bnText-secondary hover:bg-bn-border'
          }`}
        >
          BUY
        </button>
        <button
          onClick={() => setSide('SELL')}
          className={`flex-1 rounded py-2 text-xs font-bold transition ${
            side === 'SELL' ? 'bg-bnRed text-white' : 'bg-bn-input text-bnText-secondary hover:bg-bn-border'
          }`}
        >
          SELL
        </button>
      </div>

      <label className="mb-1 block text-[10px] font-medium text-bnText-secondary">Volume (lots)</label>
      <input
        type="number"
        step="0.01"
        min="0.01"
        value={volume}
        onChange={(e) => setVolume(e.target.value)}
        className="mb-2 w-full rounded border border-bn-border bg-bn-input px-2 py-1.5 text-sm text-bnText-primary focus:outline-none"
      />
      <div className="mb-3 flex flex-wrap gap-1">
        {['0.01', '0.10', '0.50', '1.00'].map((v) => (
          <button
            key={v}
            onClick={() => setVolume(v)}
            className="rounded bg-bn-input px-2 py-0.5 text-[10px] text-bnText-secondary hover:bg-bn-border hover:text-bnText-primary"
          >
            {v}
          </button>
        ))}
      </div>

      <div className="mb-3 space-y-1.5 rounded bg-bn-input p-2.5 text-[11px]">
        <div className="flex justify-between"><span className="text-bnText-muted">Est. margin</span><span className="text-bnText-primary">${estMargin}</span></div>
        <div className="flex justify-between"><span className="text-bnText-muted">Leverage</span><span className="text-bnText-primary">1:{LEVERAGE}</span></div>
        <div className="flex justify-between"><span className="text-bnText-muted">Live price</span><span className="font-mono text-bnText-primary">{formatPriceForSymbol(active.symbol, activeLivePrice)}</span></div>
        {margin > 0 && (
          <div className="flex justify-between border-t border-bn-border pt-1.5">
            <span className="text-bnText-muted">Margin level</span>
            <span className={`font-bold ${marginLevel < 60 ? 'text-bnRed' : marginLevel < 100 ? 'text-yellow' : 'text-bnGreen'}`}>
              {marginLevel.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {criticalMargin && (
        <div className="mb-3 flex items-center gap-1.5 rounded border border-red-500/30 bg-bnRed/10 px-2 py-1.5 text-[10px] text-bnRed">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" /> Margin call: {marginLevel.toFixed(1)}%
        </div>
      )}

      <button
        onClick={placeOrder}
        disabled={!hasMt5 || submitting}
        className={`w-full rounded py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          side === 'BUY' ? 'bg-bnGreen text-bn-bg hover:bg-green-600' : 'bg-bnRed text-white hover:bg-red-600'
        }`}
      >
        {submitting ? 'Submitting...' : `Open ${side} ${getDisplaySymbol(active.symbol)}`}
      </button>

      {hasMt5 && (
        <button
          onClick={addTestFunds}
          disabled={funding}
          className="mt-2 w-full rounded border border-yellow/30 bg-yellow/10 py-1.5 text-[10px] font-bold text-yellow transition hover:bg-yellow/20 disabled:opacity-50"
        >
          <Zap className="mr-1 inline h-3 w-3" />
          {funding ? 'Adding...' : 'Add $10,000 Test Funds'}
        </button>
      )}

      {/* Account summary at bottom */}
      {hasMt5 && (
        <div className="mt-auto flex-shrink-0 space-y-1.5 border-t border-bn-border pt-3 text-[11px]">
          <div className="flex justify-between"><span className="text-bnText-muted">Balance</span><span className="font-mono text-bnText-primary">${balance.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-bnText-muted">Equity</span><span className={`font-mono ${equity >= balance ? 'text-bnGreen' : 'text-bnRed'}`}>${equity.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-bnText-muted">Free margin</span><span className="font-mono text-bnText-primary">${freeMargin.toFixed(2)}</span></div>
        </div>
      )}
    </div>
  );

  const positionsPanel = (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-bn-border px-3 py-1.5">
        <span className="text-xs font-semibold text-bnText-primary">Open Positions ({trades.length})</span>
      </div>
      {trades.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-xs text-bnText-muted">No open positions</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-[11px]">
            <thead className="sticky top-0 border-b border-bn-border bg-bn-card text-bnText-muted">
              <tr>
                <th className="px-2 py-1.5 font-medium">Symbol</th>
                <th className="px-2 py-1.5 font-medium">Side</th>
                <th className="px-2 py-1.5 font-medium">Vol</th>
                <th className="px-2 py-1.5 font-medium">Open</th>
                <th className="px-2 py-1.5 font-medium">Current</th>
                <th className="px-2 py-1.5 font-medium">P&L</th>
                <th className="px-2 py-1.5 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => {
                const liveP = livePrices[t.symbol] ?? t.currentPrice;
                return (
                  <tr key={t.id} className="border-b border-bn-border/50">
                    <td className="px-2 py-1.5 font-medium text-bnText-primary">{getDisplaySymbol(t.symbol)}</td>
                    <td className={`px-2 py-1.5 font-bold ${t.type === 'BUY' ? 'text-bnGreen' : 'text-bnRed'}`}>{t.type}</td>
                    <td className="px-2 py-1.5 text-bnText-secondary">{t.volume.toFixed(2)}</td>
                    <td className="px-2 py-1.5 font-mono text-bnText-secondary">{formatPriceForSymbol(t.symbol, t.openPrice)}</td>
                    <td className="px-2 py-1.5 font-mono text-bnText-primary">{formatPriceForSymbol(t.symbol, liveP)}</td>
                    <td className={`px-2 py-1.5 font-bold ${t.profit >= 0 ? 'text-bnGreen' : 'text-bnRed'}`}>
                      ${t.profit.toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        onClick={() => closeTrade(t.id)}
                        disabled={closingId === t.id}
                        className="rounded bg-bnRed/10 px-1.5 py-0.5 text-[10px] font-bold text-bnRed transition hover:bg-bnRed/20 disabled:opacity-50"
                      >
                        {closingId === t.id ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <X className="h-2.5 w-2.5" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ---- Desktop layout: fixed 3-column, no page scroll ----
  const desktopLayout = (
    <div className="hidden h-full flex-row overflow-hidden lg:flex">
      {/* Left — Watchlist */}
      <div className="flex w-56 flex-shrink-0 flex-col overflow-hidden border-r border-bn-border bg-bn-card">
        {watchlistContent}
      </div>

      {/* Center — Chart + Positions */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">{chartContent}</div>
        {hasMt5 && (
          <div className="h-44 flex-shrink-0 border-t border-bn-border">{positionsPanel}</div>
        )}
      </div>

      {/* Right — Order panel */}
      <div className="flex w-72 flex-shrink-0 flex-col overflow-hidden border-l border-bn-border bg-bn-card">
        {orderPanel}
      </div>
    </div>
  );

  // ---- Mobile instrument picker modal ----
  const instrumentPicker = showInstrumentPicker && (
    <div className="fixed inset-0 z-[60] flex flex-col bg-bn-bg lg:hidden">
      <div className="flex h-12 flex-shrink-0 items-center border-b border-bn-border px-3">
        <button onClick={() => setShowInstrumentPicker(false)} className="flex h-8 w-8 items-center justify-center rounded text-bnText-primary">
          <X className="h-5 w-5" />
        </button>
        <span className="ml-2 text-sm font-bold text-bnText-primary">Select Instrument</span>
      </div>
      <div className="flex-shrink-0 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bnText-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search instruments..."
            className="w-full rounded bg-bn-input py-2 pl-9 pr-3 text-sm text-bnText-primary placeholder:text-bnText-muted focus:outline-none"
          />
        </div>
      </div>
      <div className="flex flex-shrink-0 gap-1.5 overflow-x-auto px-3 pb-2 scrollbar-hide">
        {CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition ${
              category === cat ? 'bg-yellow text-bn-bg' : 'bg-bn-input text-bnText-secondary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((item) => {
          const live = livePrices[item.symbol];
          const up = live ? live >= item.price : false;
          return (
            <button
              key={item.symbol}
              onClick={() => {
                setActive(item);
                setShowInstrumentPicker(false);
                setMobileTab('chart');
              }}
              className={`flex w-full items-center justify-between border-b border-bn-border px-4 py-3 text-left transition ${
                active.symbol === item.symbol ? 'bg-yellow/5' : 'hover:bg-bn-hover'
              }`}
            >
              <div>
                <div className="text-sm font-semibold text-bnText-primary">{getDisplaySymbol(item.symbol)}</div>
                <div className="text-[10px] text-bnText-muted">{getSymbolName(item.symbol)}</div>
              </div>
              <div className="text-right">
                <div className={`font-mono text-sm ${live ? (up ? 'text-bnGreen' : 'text-bnRed') : 'text-bnText-muted'}`}>
                  {live ? formatPriceForSymbol(item.symbol, live) : '—'}
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-bnText-muted">No instruments match your search.</p>
        )}
      </div>
    </div>
  );

  // ---- Mobile layout: bottom tabs, no scroll ----
  const mobileLayout = (
    <div className="flex h-full flex-col overflow-hidden lg:hidden">
      {/* Symbol bar — tappable to open instrument picker */}
      <div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-bn-border px-3">
        <button
          onClick={() => setShowInstrumentPicker(true)}
          className="flex items-center gap-1.5"
        >
          <span className="text-sm font-bold text-bnText-primary">{getDisplaySymbol(active.symbol)}</span>
          <ChevronDown className="h-3.5 w-3.5 text-bnText-muted" />
          <span className={`font-mono text-xs ${livePrices[active.symbol] ? (activeLivePrice >= active.price ? 'text-bnGreen' : 'text-bnRed') : 'text-bnText-muted'}`}>
            {livePrices[active.symbol] ? formatPriceForSymbol(active.symbol, activeLivePrice) : '—'}
          </span>
        </button>
        <span className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${streamConnected ? 'bg-bnGreen/10 text-bnGreen' : 'bg-yellow/10 text-yellow'}`}>
          <span className={`h-1 w-1 animate-pulse rounded-full ${streamConnected ? 'bg-bnGreen' : 'bg-yellow'}`} />
          {streamConnected ? 'LIVE' : '...'}
        </span>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {mobileTab === 'chart' && (
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-hidden">{chartContent}</div>
          </div>
        )}
        {mobileTab === 'trade' && (
          <div className="h-full overflow-y-auto bg-bn-card">{orderPanel}</div>
        )}
        {mobileTab === 'positions' && (
          <div className="h-full bg-bn-card">
            {hasMt5 ? positionsPanel : <div className="flex h-full items-center justify-center text-xs text-bnText-muted">No MT5 account</div>}
          </div>
        )}
        {mobileTab === 'markets' && (
          <div className="flex h-full flex-col bg-bn-card">{watchlistContent}</div>
        )}
      </div>

      {/* Bottom tab bar */}
      <div className="flex h-12 flex-shrink-0 border-t border-bn-border bg-bn-card">
        {[
          { key: 'markets', label: 'Markets' },
          { key: 'chart', label: 'Chart' },
          { key: 'trade', label: 'Trade' },
          { key: 'positions', label: 'Positions' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMobileTab(tab.key as typeof mobileTab)}
            className={`flex-1 py-2 text-[10px] font-medium transition ${
              mobileTab === tab.key ? 'text-yellow' : 'text-bnText-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardShell fullHeight>
      {desktopLayout}
      {mobileLayout}
      {instrumentPicker}
    </DashboardShell>
  );
}
