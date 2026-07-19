'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '../../../components/DashboardShell';
import AdvancedChart from '../../../components/tradingview/AdvancedChart';
import { useAuth } from '../../../lib/useAuth';
import { api, consumeSse } from '../../../lib/api';
import { Loader2, X, AlertTriangle, Search, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
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
const CATEGORY_ORDER = ['All', 'Forex', 'Crypto', 'Stocks', 'Indices'];

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
  const router = useRouter();
  const [instruments, setInstruments] = useState<Instrument[]>([DEFAULT_INSTRUMENT]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<Instrument>(DEFAULT_INSTRUMENT);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [volume, setVolume] = useState('0.10');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [account, setAccount] = useState<any>(null);
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [streamConnected, setStreamConnected] = useState(false);
  const [orderType, setOrderType] = useState<'Market' | 'Limit' | 'Stop Limit'>('Market');
  const [bottomTab, setBottomTab] = useState<'Open Orders' | 'Positions' | 'History' | 'Account Summary'>('Open Orders');
  const [subFilter, setSubFilter] = useState<'All' | 'Working' | 'Filled' | 'Cancelled'>('All');

  const hasMt5 = !!user?.mt5Account;
  const balance = Number(account?.balance ?? user?.mt5Account?.balance ?? 0);
  const equity = Number(account?.equity ?? user?.mt5Account?.equity ?? 0);
  const margin = Number(account?.margin ?? user?.mt5Account?.margin ?? 0);
  const freeMargin = equity - margin;
  const marginLevel = margin > 0 ? (equity / margin) * 100 : 0;
  const totalPnl = trades.reduce((sum, t) => sum + t.profit, 0);
  const filledCount = 0;
  const cancelledCount = 0;

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

  const [mobileTab, setMobileTab] = useState<'markets' | 'chart' | 'trade'>('chart');
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

  if (!user) {
    router.push('/login');
    return (
      <DashboardShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-yellow" />
        </div>
      </DashboardShell>
    );
  }

  const criticalMargin = marginLevel > 0 && marginLevel < 60;
  const activeBaseAsset = getDisplaySymbol(active.symbol).split('/')[0] || getDisplaySymbol(active.symbol);
  const total = (parseFloat(volume) || 0) * activeLivePrice;

  // ---- Top Symbol Bar (48px) ----
  const symbolBar = (
    <div className="flex h-12 flex-shrink-0 items-center gap-2 border-b border-bn-border bg-bn-bg px-3">
      <button onClick={() => setShowInstrumentPicker(true)} className="flex min-w-0 flex-shrink-0 items-center gap-2">
        <span className="truncate text-sm font-bold text-bnText-primary">{getDisplaySymbol(active.symbol)}</span>
        <ChevronDown className="h-3 w-3 flex-shrink-0 text-bnText-secondary" />
      </button>
      <span className={`min-w-0 flex-shrink truncate text-sm font-bold tnum sm:text-base ${livePrices[active.symbol] ? (activeLivePrice >= active.price ? 'text-bnGreen' : 'text-bnRed') : 'text-bnText-secondary'}`}>
        {livePrices[active.symbol] ? formatPriceForSymbol(active.symbol, activeLivePrice) : '—'}
      </span>
      {livePrices[active.symbol] && (
        <span className={`hidden flex-shrink-0 text-xs tnum sm:inline ${activeLivePrice >= active.price ? 'text-bnGreen' : 'text-bnRed'}`}>
          {activeLivePrice >= active.price ? '+' : ''}{((activeLivePrice - active.price) / active.price * 100).toFixed(2)}%
        </span>
      )}
      <div className="ml-auto hidden items-center gap-4 text-xs text-bnText-secondary md:flex">
        <span>24h Change <span className={activeLivePrice >= active.price ? 'text-bnGreen' : 'text-bnRed'}>{livePrices[active.symbol] ? `${activeLivePrice >= active.price ? '+' : ''}${(activeLivePrice - active.price).toFixed(5)}` : '—'}</span></span>
        <span>24h High <span className="text-bnText-primary">{livePrices[active.symbol] ? formatPriceForSymbol(active.symbol, activeLivePrice) : '—'}</span></span>
        <span>24h Low <span className="text-bnText-primary">{livePrices[active.symbol] ? formatPriceForSymbol(active.symbol, active.price) : '—'}</span></span>
      </div>
      <span className={`ml-auto flex flex-shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${streamConnected ? 'bg-bnGreen/10 text-bnGreen' : 'bg-yellow/10 text-yellow'}`}>
        <span className={`h-1 w-1 animate-pulse rounded-full ${streamConnected ? 'bg-bnGreen' : 'bg-yellow'}`} />
        {streamConnected ? 'LIVE' : '...'}
      </span>
    </div>
  );

  const watchlistContent = (
    <>
      <div className="p-2 flex-shrink-0">
        <div className="flex items-center gap-2 rounded bg-bn-input px-2 py-1.5">
          <Search className="h-3 w-3 text-bnText-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent text-xs text-bnText-primary placeholder:text-bnText-muted focus:outline-none"
          />
        </div>
      </div>
      <div className="flex flex-shrink-0 border-b border-bn-border text-xs">
        {CATEGORY_ORDER.slice(0, 3).map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)} className={`flex-1 py-2 ${category === cat ? 'border-b-2 border-yellow text-yellow' : 'text-bnText-secondary'}`}>{cat}</button>
        ))}
      </div>
      <div className="flex flex-shrink-0 border-b border-bn-border text-xs">
        {CATEGORY_ORDER.slice(3).map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)} className={`flex-1 py-1.5 ${category === cat ? 'border-b-2 border-yellow text-yellow' : 'text-bnText-secondary'}`}>{cat}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((item) => {
          const live = livePrices[item.symbol];
          const up = live ? live >= item.price : false;
          return (
            <button key={item.symbol} onClick={() => setActive(item)} className={`flex w-full items-center justify-between px-3 py-2 text-left transition ${active.symbol === item.symbol ? 'bg-bn-secondary' : 'hover:bg-bn-secondary'}`}>
              <div>
                <div className={`text-xs font-semibold ${active.symbol === item.symbol ? 'text-yellow' : 'text-bnText-primary'}`}>{getDisplaySymbol(item.symbol)}</div>
                <div className="text-[10px] text-bnText-muted">{item.category}</div>
              </div>
              <div className="text-right">
                <div className={`tnum text-xs ${live ? (up ? 'text-bnGreen' : 'text-bnRed') : 'text-bnText-muted'}`}>{live ? formatPriceForSymbol(item.symbol, live) : '—'}</div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && <p className="py-4 text-center text-xs text-bnText-muted">No matches</p>}
      </div>
    </>
  );

  const chartContent = (
    <div className="h-full w-full overflow-hidden">
      <AdvancedChart symbol={active.symbol} interval="15" height="100%" allowSymbolChange={false} />
    </div>
  );

  const orderPanel = (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center justify-between border-b border-bn-border p-3">
        <span className="text-sm font-semibold text-bnText-primary">USDT</span>
        <span className="text-xs text-bnText-secondary">···</span>
      </div>
      <div className="flex">
        <button onClick={() => setSide('BUY')} className={`flex-1 py-3 text-sm font-semibold border-b-2 ${side === 'BUY' ? 'border-bnGreen text-bnGreen' : 'border-transparent text-bnText-secondary'}`}>Buy</button>
        <button onClick={() => setSide('SELL')} className={`flex-1 py-3 text-sm font-semibold border-b-2 ${side === 'SELL' ? 'border-bnRed text-bnRed' : 'border-transparent text-bnText-secondary'}`}>Sell</button>
      </div>
      <div className="flex gap-3 px-3 pt-3 text-xs">
        {(['Market', 'Limit', 'Stop Limit'] as const).map((type) => (
          <button key={type} onClick={() => setOrderType(type)} className={orderType === type ? 'font-semibold text-bnText-primary' : 'text-bnText-secondary'}>{type}</button>
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-bnText-secondary">Price (USDT)</span>
            <span className="text-xs text-bnText-secondary">ticks</span>
          </div>
          <div className="flex items-center rounded border border-bn-border-light bg-bn-input px-3 py-2">
            <input type="number" value={activeLivePrice || ''} disabled={orderType === 'Market'} className="flex-1 bg-transparent text-sm text-bnText-primary outline-none font-mono" />
            <div className="ml-2 flex flex-col">
              <ChevronUp className="h-3 w-3 cursor-pointer text-bnText-secondary" onClick={() => {}} />
              <ChevronDown className="h-3 w-3 cursor-pointer text-bnText-secondary" onClick={() => {}} />
            </div>
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs text-bnText-secondary">Amount (lots)</div>
          <div className="flex items-center rounded border border-bn-border-light bg-bn-input px-3 py-2">
            <button onClick={() => setVolume((v) => Math.max(0.01, (parseFloat(v) || 0) - 0.01).toFixed(2))} className="text-lg leading-none text-bnText-secondary">−</button>
            <input type="number" step="0.01" min="0.01" value={volume} onChange={(e) => setVolume(e.target.value)} className="flex-1 bg-transparent text-center text-sm text-bnText-primary outline-none font-mono" />
            <button onClick={() => setVolume((v) => ((parseFloat(v) || 0) + 0.01).toFixed(2))} className="text-lg leading-none text-bnText-secondary">+</button>
          </div>
        </div>
        <div className="flex gap-2">
          {[25, 50, 75, 100].map((pct) => (
            <button key={pct} onClick={() => { const pctBal = (balance * pct / 100) / activeLivePrice; setVolume(pctBal.toFixed(2)); }} className="flex-1 rounded border border-bn-border py-1 text-xs text-bnText-secondary transition hover:border-yellow hover:text-yellow">{pct}%</button>
          ))}
        </div>
        <div>
          <div className="mb-1 text-xs text-bnText-secondary">Total (USDT)</div>
          <div className="rounded border border-bn-border-light bg-bn-input px-3 py-2"><span className="text-sm tnum text-bnText-primary">{total.toFixed(2)}</span></div>
        </div>
        <div className="flex items-center justify-between text-xs"><span className="text-bnText-secondary">Avbl</span><span className="tnum text-bnText-primary">{balance.toFixed(2)} USDT</span></div>
        <div className="flex items-center justify-between text-xs"><span className="text-bnText-secondary">Est. Fee</span><span className="text-bnText-primary">-- {activeBaseAsset}</span></div>
        <button onClick={placeOrder} disabled={!hasMt5 || submitting} className={`w-full rounded-bn py-3 text-sm font-bold transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${side === 'BUY' ? 'bg-bnGreen text-black hover:brightness-110' : 'bg-bnRed text-white hover:brightness-110'}`}>
          {submitting ? 'Submitting...' : `${side === 'BUY' ? 'Buy' : 'Sell'} ${activeBaseAsset}`}
        </button>
        {criticalMargin && (
          <div className="flex items-center gap-1.5 rounded border border-red-500/30 bg-bnRed/10 px-2 py-1.5 text-[10px] text-bnRed">
            <AlertTriangle className="h-3 w-3 flex-shrink-0" /> Margin call: {marginLevel.toFixed(1)}%
          </div>
        )}
      </div>
      {hasMt5 && (
        <div className="space-y-2 border-t border-bn-border p-3">
          <div className="flex justify-between text-xs"><span className="text-bnText-secondary">Account Balance</span><span className="tnum text-bnText-primary">{balance.toFixed(2)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-bnText-secondary">Equity</span><span className={`tnum ${equity >= balance ? 'text-bnGreen' : 'text-bnRed'}`}>{equity.toFixed(2)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-bnText-secondary">Profit</span><span className={`tnum ${totalPnl >= 0 ? 'text-bnGreen' : 'text-bnRed'}`}>{totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}</span></div>
        </div>
      )}
    </div>
  );

  const bottomPanel = (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-bn-border px-4 overflow-x-auto scrollbar-hide">
        {(['Open Orders', 'Positions', 'History', 'Account Summary'] as const).map((tab) => (
          <button key={tab} onClick={() => setBottomTab(tab)} className={`whitespace-nowrap px-4 py-2 text-xs ${bottomTab === tab ? 'border-b-2 border-yellow text-bnText-primary' : 'text-bnText-secondary'}`}>
            {tab} {tab === 'Open Orders' && trades.length > 0 && <span className="ml-1 rounded-full bg-yellow px-1 text-[10px] text-black">{trades.length}</span>}
          </button>
        ))}
        {bottomTab === 'Open Orders' && (
          <div className="ml-auto hidden flex gap-3 text-xs text-bnText-secondary md:flex">
            <button className={subFilter === 'All' ? 'text-bnText-primary' : ''} onClick={() => setSubFilter('All')}>All {trades.length}</button>
            <button className={subFilter === 'Working' ? 'text-bnText-primary' : ''} onClick={() => setSubFilter('Working')}>Working</button>
            <button className={subFilter === 'Filled' ? 'text-bnText-primary' : ''} onClick={() => setSubFilter('Filled')}>Filled {filledCount}</button>
            <button className={subFilter === 'Cancelled' ? 'text-bnText-primary' : ''} onClick={() => setSubFilter('Cancelled')}>Cancelled {cancelledCount}</button>
          </div>
        )}
      </div>
      {bottomTab === 'Open Orders' && (
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[700px] text-xs">
            <thead className="sticky top-0 bg-bn-bg">
              <tr className="text-bnText-secondary">
                <th className="px-4 py-2 text-left">Symbol</th>
                <th className="py-2 text-left">Side</th>
                <th className="py-2 text-left">Type</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Filled Qty</th>
                <th className="py-2 text-right">Entry Price</th>
                <th className="py-2 text-right">Current Price</th>
                <th className="py-2 text-right">P&L</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => {
                const liveP = livePrices[t.symbol] ?? t.currentPrice;
                return (
                  <tr key={t.id} className="border-t border-bn-secondary hover:bg-bn-secondary">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow text-[8px] font-bold text-black">{getDisplaySymbol(t.symbol).slice(0, 2)}</div>
                        <span className="font-semibold text-bnText-primary">{getDisplaySymbol(t.symbol)}</span>
                      </div>
                    </td>
                    <td className={`py-3 font-semibold ${t.type === 'BUY' ? 'text-bnGreen' : 'text-bnRed'}`}>{t.type === 'BUY' ? 'Buy' : 'Sell'}</td>
                    <td className="py-3 text-bnText-secondary">Market</td>
                    <td className="py-3 text-right tnum text-bnText-primary">{t.volume.toFixed(2)}</td>
                    <td className="py-3 text-right tnum text-bnText-primary">{t.volume.toFixed(2)}</td>
                    <td className="py-3 text-right tnum text-bnText-primary">{formatPriceForSymbol(t.symbol, t.openPrice)}</td>
                    <td className="py-3 text-right tnum text-bnText-primary">{formatPriceForSymbol(t.symbol, liveP)}</td>
                    <td className={`py-3 text-right tnum font-semibold ${t.profit >= 0 ? 'text-bnGreen' : 'text-bnRed'}`}>{t.profit >= 0 ? '+' : ''}{t.profit.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => closeTrade(t.id)} disabled={closingId === t.id} className="p-1 text-bnText-secondary transition hover:text-bnRed disabled:opacity-50">
                        {closingId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {trades.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-bnText-secondary">No open orders</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {bottomTab === 'Positions' && (
        <div className="flex-1 overflow-y-auto p-3">
          {trades.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-bnText-secondary">No positions</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {trades.map((t) => {
                const liveP = livePrices[t.symbol] ?? t.currentPrice;
                const roi = t.openPrice > 0 ? (t.profit / (t.openPrice * t.volume)) * 100 : 0;
                return (
                  <div key={t.id} className="rounded border border-bn-border bg-bn-secondary p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-bnText-primary">{getDisplaySymbol(t.symbol)}</span>
                        <span className="text-xs text-bnText-secondary">Perp</span>
                        <span className={`rounded px-1 text-xs ${t.type === 'BUY' ? 'bg-bnGreen/20 text-bnGreen' : 'bg-bnRed/20 text-bnRed'}`}>{t.type === 'BUY' ? 'Long' : 'Short'} 1x</span>
                      </div>
                      <Share2 className="h-4 w-4 text-bnText-secondary" />
                    </div>
                    <div className="mb-2">
                      <div className="text-xs text-bnText-secondary">Unrealized PNL (USDT)</div>
                      <div className={`text-xl font-bold tnum ${t.profit >= 0 ? 'text-bnGreen' : 'text-bnRed'}`}>{t.profit >= 0 ? '+' : ''}{t.profit.toFixed(2)}</div>
                      <div className={`text-xs tnum ${t.profit >= 0 ? 'text-bnGreen' : 'text-bnRed'}`}>ROI: {t.profit >= 0 ? '+' : ''}{roi.toFixed(2)}%</div>
                    </div>
                    <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
                      <div><div className="text-bnText-secondary">Size</div><div className="tnum text-bnText-primary">{t.volume.toFixed(2)}</div></div>
                      <div><div className="text-bnText-secondary">Entry Price</div><div className="tnum text-bnText-primary">{formatPriceForSymbol(t.symbol, t.openPrice)}</div></div>
                      <div><div className="text-bnText-secondary">Mark Price</div><div className="tnum text-bnText-primary">{formatPriceForSymbol(t.symbol, liveP)}</div></div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 rounded border border-bn-border py-2 text-xs text-bnText-primary transition hover:border-yellow">Leverage</button>
                      <button className="flex-1 rounded border border-bn-border py-2 text-xs text-bnText-primary transition hover:border-yellow">TP/SL</button>
                      <button onClick={() => closeTrade(t.id)} disabled={closingId === t.id} className="flex-1 rounded bg-bn-input py-2 text-xs text-bnText-primary transition hover:bg-bnRed disabled:opacity-50">{closingId === t.id ? 'Closing...' : 'Close'}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {bottomTab === 'History' && <div className="flex h-full items-center justify-center text-xs text-bnText-secondary">No trade history</div>}
      {bottomTab === 'Account Summary' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-bn border border-bn-border bg-bn-card p-3 transition-all duration-200 hover:shadow-card"><div className="text-xs text-bnText-secondary">Balance</div><div className="mt-1 text-lg font-bold tnum text-bnText-primary">${balance.toFixed(2)}</div></div>
            <div className="rounded-bn border border-bn-border bg-bn-card p-3 transition-all duration-200 hover:shadow-card"><div className="text-xs text-bnText-secondary">Equity</div><div className={`mt-1 text-lg font-bold tnum ${equity >= balance ? 'text-bnGreen' : 'text-bnRed'}`}>${equity.toFixed(2)}</div></div>
            <div className="rounded-bn border border-bn-border bg-bn-card p-3 transition-all duration-200 hover:shadow-card"><div className="text-xs text-bnText-secondary">Used Margin</div><div className="mt-1 text-lg font-bold tnum text-bnText-primary">${margin.toFixed(2)}</div></div>
            <div className="rounded-bn border border-bn-border bg-bn-card p-3 transition-all duration-200 hover:shadow-card"><div className="text-xs text-bnText-secondary">Free Margin</div><div className="mt-1 text-lg font-bold tnum text-bnText-primary">${freeMargin.toFixed(2)}</div></div>
            <div className="rounded-bn border border-bn-border bg-bn-card p-3 transition-all duration-200 hover:shadow-card"><div className="text-xs text-bnText-secondary">Total P&L</div><div className={`mt-1 text-lg font-bold tnum ${totalPnl >= 0 ? 'text-bnGreen' : 'text-bnRed'}`}>{totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}</div></div>
            <div className="rounded-bn border border-bn-border bg-bn-card p-3 transition-all duration-200 hover:shadow-card"><div className="text-xs text-bnText-secondary">Margin Level</div><div className={`mt-1 text-lg font-bold tnum ${marginLevel < 60 ? 'text-bnRed' : marginLevel < 100 ? 'text-yellow' : 'text-bnGreen'}`}>{marginLevel > 0 ? `${marginLevel.toFixed(1)}%` : '—'}</div></div>
            <div className="rounded-bn border border-bn-border bg-bn-card p-3 transition-all duration-200 hover:shadow-card"><div className="text-xs text-bnText-secondary">Leverage</div><div className="mt-1 text-lg font-bold tnum text-bnText-primary">1:{LEVERAGE}</div></div>
            <div className="rounded-bn border border-bn-border bg-bn-card p-3 transition-all duration-200 hover:shadow-card"><div className="text-xs text-bnText-secondary">Open Positions</div><div className="mt-1 text-lg font-bold tnum text-bnText-primary">{trades.length}</div></div>
          </div>
        </div>
      )}
    </div>
  );

  // ---- Desktop layout: Binance 3-column ----
  const desktopLayout = (
    <div className="hidden h-full flex-col overflow-hidden lg:flex">
      {symbolBar}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex w-48 flex-shrink-0 flex-col overflow-hidden border-r border-bn-border bg-bn-bg">{watchlistContent}</div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">{chartContent}</div>
          {hasMt5 && <div className="h-56 flex-shrink-0 border-t border-bn-border">{bottomPanel}</div>}
        </div>
        <div className="flex w-72 flex-shrink-0 flex-col overflow-hidden border-l border-bn-border bg-bn-bg">{orderPanel}</div>
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

  // ---- Mobile layout ----
  const mobileLayout = (
    <div className="flex h-full flex-col overflow-hidden lg:hidden">
      {symbolBar}
      <div className="flex-1 overflow-hidden">
        {mobileTab === 'chart' && (
          <div className="flex h-full flex-col overflow-hidden">
            <div className="h-[280px] flex-shrink-0 overflow-hidden sm:h-[340px]">{chartContent}</div>
            {hasMt5 && <div className="min-h-0 flex-1 overflow-hidden border-t border-bn-border">{bottomPanel}</div>}
          </div>
        )}
        {mobileTab === 'trade' && <div className="h-full overflow-y-auto bg-bn-bg">{orderPanel}</div>}
        {mobileTab === 'markets' && <div className="flex h-full flex-col bg-bn-bg">{watchlistContent}</div>}
      </div>
      <div className="flex h-12 flex-shrink-0 border-t border-bn-border bg-bn-bg">
        {[
          { key: 'markets', label: 'Markets' },
          { key: 'chart', label: 'Chart' },
          { key: 'trade', label: 'Trade' },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setMobileTab(tab.key as typeof mobileTab)} className={`flex-1 py-2 text-[10px] font-medium transition ${mobileTab === tab.key ? 'text-yellow' : 'text-bnText-muted'}`}>{tab.label}</button>
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
