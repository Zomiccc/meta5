'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DashboardShell from '../../../components/DashboardShell';
import LiveChart from '../../../components/LiveChart';
import { useAuth } from '../../../lib/useAuth';
import { api, consumeSse } from '../../../lib/api';
import { Loader2, TrendingUp, TrendingDown, Info, Wallet, Zap, X, AlertTriangle, Search } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';

interface Instrument {
  label: string;
  symbol: string;
  price: number;
  contractSize: number;
  category: string;
}

const DEFAULT_INSTRUMENT: Instrument = { label: 'EUR/USD', symbol: 'FX:EURUSD', price: 1.0856, contractSize: 100000, category: 'Forex' };
const CATEGORY_ORDER = ['All', 'Forex', 'Crypto', 'Stocks', 'Commodities', 'Indices'];

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
  const [priceSource, setPriceSource] = useState<string>('');
  const [streamConnected, setStreamConnected] = useState(false);

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

  // Fetch price source when active symbol changes
  useEffect(() => {
    api.get(`/mt5/price-source?symbol=${encodeURIComponent(active.symbol)}`)
      .then((res) => setPriceSource(res.data?.source || ''))
      .catch(() => setPriceSource(''));
  }, [active.symbol]);

  // Poll live prices for all instruments every 5 seconds
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

  // Initial load + poll for live P&L
  useEffect(() => {
    if (loading || !hasMt5) return;
    refreshAccount();
    refreshTrades();
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

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-bnText-primary">Trade</h1>
          <p className="text-bnText-secondary">Live charts and order execution on your MT5 account</p>
        </div>
        {hasMt5 && (
          <button
            onClick={addTestFunds}
            disabled={funding}
            className="flex w-full items-center justify-center gap-2 rounded-bn border border-yellow/30 bg-yellow/10 px-4 py-2.5 text-sm font-bold text-yellow transition hover:bg-yellow/20 disabled:opacity-50 sm:w-auto"
          >
            <Zap className="h-4 w-4" />
            {funding ? 'Adding...' : 'Add $10,000 Test Funds'}
          </button>
        )}
      </div>

      {criticalMargin && (
        <div className="mb-6 flex items-center gap-2 rounded-bn border border-red-500/30 bg-bnRed/10 px-4 py-3 text-sm text-bnRed">
          <AlertTriangle className="h-4 w-4 animate-pulse" /> Margin call! Your margin level is {marginLevel.toFixed(1)}%. Positions may be liquidated soon. Consider closing positions or adding funds.
        </div>
      )}

      {/* Account stats bar */}
      {hasMt5 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-bn border border-bn-border bg-bn-card p-4">
            <div className="flex items-center gap-1.5 text-xs text-bnText-secondary"><Wallet className="h-3 w-3" /> Balance</div>
            <div className="mt-1 text-lg font-bold text-bnText-primary">${balance.toFixed(2)}</div>
          </div>
          <div className="rounded-bn border border-bn-border bg-bn-card p-4">
            <div className="text-xs text-bnText-secondary">Equity</div>
            <div className={`mt-1 text-lg font-bold ${equity >= balance ? 'text-bnGreen' : 'text-bnRed'}`}>${equity.toFixed(2)}</div>
          </div>
          <div className="rounded-bn border border-bn-border bg-bn-card p-4">
            <div className="text-xs text-bnText-secondary">Used Margin</div>
            <div className="mt-1 text-lg font-bold text-bnText-primary">${margin.toFixed(2)}</div>
          </div>
          <div className="rounded-bn border border-bn-border bg-bn-card p-4">
            <div className="text-xs text-bnText-secondary">Free Margin</div>
            <div className={`mt-1 text-lg font-bold ${freeMargin > 0 ? 'text-bnText-primary' : 'text-bnRed'}`}>${freeMargin.toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="grid min-w-0 gap-6 lg:grid-cols-4">
        {/* Watchlist */}
        <div className="flex min-w-0 flex-col rounded-bn border border-bn-border bg-bn-card p-3 lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-bnText-muted">Markets</h3>
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${streamConnected ? 'bg-bnGreen/10 text-bnGreen' : 'bg-yellow/10 text-yellow'}`}>
                <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${streamConnected ? 'bg-bnGreen' : 'bg-yellow'}`} />
                {streamConnected ? 'LIVE' : 'CONNECTING'}
              </span>
            </div>
            <span className="text-xs text-bnText-muted">{filtered.length}</span>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bnText-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pair / symbol..."
              className="bn-input w-full py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <div className="mb-3 flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORY_ORDER.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  category === cat ? 'bg-yellow text-bn-bg' : 'bg-bn-input text-bnText-secondary hover:bg-bn-border hover:text-bnText-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="max-h-80 flex-1 space-y-1 overflow-y-auto pr-1 lg:max-h-[520px]">
            {filtered.map((item) => {
              const live = livePrices[item.symbol];
              const up = live ? live >= item.price : false;
              return (
                <button
                  key={item.symbol}
                  onClick={() => setActive(item)}
                  className={`flex w-full items-center justify-between rounded-bn border px-3 py-2.5 text-left transition ${
                    active.symbol === item.symbol ? 'border-yellow bg-yellow/10' : 'border-bn-border bg-bn-card hover:border-bn-border'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-bnText-primary">{item.label}</span>
                    <span className="text-[10px] text-bnText-muted">{item.symbol}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono text-sm ${live ? (up ? 'text-bnGreen' : 'text-bnRed') : 'text-bnText-muted'}`}>
                      {live ? live.toFixed(item.price > 1000 ? 2 : item.price > 10 ? 4 : 5) : '—'}
                    </span>
                    {live && <span className={`ml-2 text-[10px] ${up ? 'text-bnGreen' : 'text-bnRed'}`}>{up ? '▲' : '▼'}</span>}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-bnText-muted">No instruments match your search.</p>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="flex min-w-0 flex-col rounded-bn border border-bn-border bg-bn-card p-1 lg:col-span-2">
          <div className="flex flex-col gap-2 border-b border-bn-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-2">
            <div>
              <span className="font-semibold text-bnText-primary">{active.label}</span>
              <span className={`ml-2 font-mono text-sm ${livePrices[active.symbol] ? (activeLivePrice >= active.price ? 'text-bnGreen' : 'text-bnRed') : 'text-bnText-muted'}`}>
                {livePrices[active.symbol] ? activeLivePrice.toFixed(active.price > 1000 ? 2 : active.price > 10 ? 4 : 5) : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {priceSource && (
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                  priceSource === 'simulated' ? 'bg-bnRed/20 text-bnRed' : 'bg-bnGreen/20 text-bnGreen'
                }`}>
                  {priceSource}
                </span>
              )}
              <span className="text-xs text-bnText-muted">Live · same feed as watchlist</span>
            </div>
          </div>
          <div className="h-[360px] w-full flex-1 sm:h-[460px]">
            <LiveChart symbol={active.symbol} price={activeLivePrice} height={460} />
          </div>
        </div>

        {/* Order ticket */}
        <div className="lg:col-span-1">
          <div className="bn-card">
            <h3 className="mb-4 text-lg font-semibold text-bnText-primary">{active.label}</h3>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setSide('SELL')}
                className={`flex items-center justify-center gap-1.5 rounded-bn py-2.5 text-sm font-bold transition ${
                  side === 'SELL' ? 'bg-bnRed text-bnText-primary' : 'bg-bn-input text-bnText-secondary hover:bg-bn-border'
                }`}
              >
                <TrendingDown className="h-4 w-4" /> Sell
              </button>
              <button
                onClick={() => setSide('BUY')}
                className={`flex items-center justify-center gap-1.5 rounded-bn py-2.5 text-sm font-bold transition ${
                  side === 'BUY' ? 'bg-bnGreen text-bnText-primary' : 'bg-bn-input text-bnText-secondary hover:bg-bn-border'
                }`}
              >
                <TrendingUp className="h-4 w-4" /> Buy
              </button>
            </div>

            <label className="mb-1.5 block text-sm font-medium text-bnText-secondary">Volume (lots)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="bn-input mb-2"
            />
            <div className="mb-4 flex flex-wrap gap-1.5">
              {['0.01', '0.10', '0.50', '1.00'].map((v) => (
                <button
                  key={v}
                  onClick={() => setVolume(v)}
                  className="rounded-md bg-bn-input px-2.5 py-1 text-xs text-bnText-secondary hover:bg-bn-border hover:text-bnText-primary"
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="mb-4 space-y-2 rounded-bn bg-bn-card p-3 text-sm">
              <div className="flex justify-between"><span className="text-bnText-secondary">Est. margin</span><span className="text-bnText-primary">${estMargin}</span></div>
              <div className="flex justify-between"><span className="text-bnText-secondary">Leverage</span><span className="text-bnText-primary">1:{LEVERAGE}</span></div>
              <div className="flex justify-between"><span className="text-bnText-secondary">Live price</span><span className="font-mono text-bnText-primary">{activeLivePrice.toFixed(active.price > 1000 ? 2 : active.price > 10 ? 4 : 5)}</span></div>
              {margin > 0 && (
                <div className="flex justify-between border-t border-bn-border pt-2">
                  <span className="text-bnText-secondary">Margin level</span>
                  <span className={`font-bold ${marginLevel < 60 ? 'text-bnRed' : marginLevel < 100 ? 'text-yellow' : 'text-bnGreen'}`}>
                    {marginLevel.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={placeOrder}
              disabled={!hasMt5 || submitting}
              className={`w-full rounded-bn py-3 text-sm font-bold text-bnText-primary transition disabled:cursor-not-allowed disabled:opacity-50 ${
                side === 'BUY' ? 'bg-bnGreen hover:bg-green-600' : 'bg-bnRed hover:bg-red-600'
              }`}
            >
              {submitting ? 'Submitting...' : `${side} ${active.label}`}
            </button>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-bnText-muted">
              <Info className="h-3 w-3" /> Orders execute instantly on your MT5 account.
            </p>
          </div>
        </div>
      </div>

      {/* Open positions */}
      {hasMt5 && (
        <div className="mt-8 bn-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-bnText-primary">Open Positions</h3>
            {trades.length > 0 && (
              <span className="text-sm text-bnText-muted">{trades.length} active</span>
            )}
          </div>
          {trades.length === 0 ? (
            <p className="py-6 text-center text-bnText-muted">No open positions. Place an order to start trading.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="border-b border-bn-border text-bnText-secondary">
                  <tr>
                    <th className="py-2 font-medium">Symbol</th>
                    <th className="py-2 font-medium">Side</th>
                    <th className="py-2 font-medium">Volume</th>
                    <th className="py-2 font-medium">Open Price</th>
                    <th className="py-2 font-medium">Current</th>
                    <th className="py-2 font-medium">P&L</th>
                    <th className="py-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => (
                    <tr key={t.id} className="border-b border-bn-border">
                      <td className="py-2.5 font-medium text-bnText-primary">{t.symbol}</td>
                      <td className={`py-2.5 font-bold ${t.type === 'BUY' ? 'text-bnGreen' : 'text-bnRed'}`}>{t.type}</td>
                      <td className="py-2.5 text-bnText-secondary">{t.volume.toFixed(2)}</td>
                      <td className="py-2.5 font-mono text-bnText-secondary">{t.openPrice}</td>
                      <td className="py-2.5 font-mono text-bnText-secondary">{t.currentPrice}</td>
                      <td className={`py-2.5 font-bold ${t.profit >= 0 ? 'text-bnGreen' : 'text-bnRed'}`}>
                        ${t.profit.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => closeTrade(t.id)}
                          disabled={closingId === t.id}
                          className="inline-flex items-center gap-1 rounded-md bg-bnRed/10 px-3 py-1.5 text-xs font-bold text-bnRed transition hover:bg-bnRed/20 disabled:opacity-50"
                        >
                          {closingId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                          Close
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
