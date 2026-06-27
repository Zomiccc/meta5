'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DashboardShell from '../../../components/DashboardShell';
import AdvancedChart from '../../../components/tradingview/AdvancedChart';
import { useAuth } from '../../../lib/useAuth';
import { api } from '../../../lib/api';
import { Loader2, TrendingUp, TrendingDown, Info, Wallet, Zap, X, AlertTriangle } from 'lucide-react';

const watchlist = [
  { label: 'EUR/USD', symbol: 'FX:EURUSD', price: 1.0856, contractSize: 100000 },
  { label: 'GBP/USD', symbol: 'FX:GBPUSD', price: 1.2734, contractSize: 100000 },
  { label: 'USD/JPY', symbol: 'FX:USDJPY', price: 148.32, contractSize: 100000 },
  { label: 'Gold', symbol: 'OANDA:XAUUSD', price: 2034.5, contractSize: 100 },
  { label: 'BTC/USD', symbol: 'BITSTAMP:BTCUSD', price: 43210, contractSize: 1 },
  { label: 'ETH/USD', symbol: 'BITSTAMP:ETHUSD', price: 2280, contractSize: 1 },
  { label: 'Crude Oil', symbol: 'TVC:USOIL', price: 78.4, contractSize: 1000 },
  { label: 'S&P 500', symbol: 'FOREXCOM:SPXUSD', price: 5123, contractSize: 1 },
];

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

export default function TradePage() {
  const { user, loading } = useAuth();
  const [active, setActive] = useState(watchlist[0]);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [volume, setVolume] = useState('0.10');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [account, setAccount] = useState<any>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);
  const [funding, setFunding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasMt5 = !!user?.mt5Account;
  const balance = Number(account?.balance ?? user?.mt5Account?.balance ?? 0);
  const equity = Number(account?.equity ?? user?.mt5Account?.equity ?? 0);
  const margin = Number(account?.margin ?? user?.mt5Account?.margin ?? 0);
  const freeMargin = equity - margin;
  const marginLevel = margin > 0 ? (equity / margin) * 100 : 0;

  const showToast = (type: 'success' | 'error' | 'info', msg: string) => {
    setToast({ type, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

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
    const interval = setInterval(() => {
      refreshTrades();
    }, 3000);
    return () => clearInterval(interval);
  }, [loading, hasMt5, refreshAccount, refreshTrades]);

  const estMargin = useMemo(() => {
    const vol = parseFloat(volume) || 0;
    const notional = vol * active.contractSize * active.price;
    return (notional / LEVERAGE).toFixed(2);
  }, [volume, active]);

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
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </DashboardShell>
    );
  }

  const criticalMargin = marginLevel > 0 && marginLevel < 60;

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Trade</h1>
          <p className="text-white/50">Live charts and order execution on your MT5 account</p>
        </div>
        {hasMt5 && (
          <button
            onClick={addTestFunds}
            disabled={funding}
            className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm font-bold text-gold transition hover:bg-gold/20 disabled:opacity-50"
          >
            <Zap className="h-4 w-4" />
            {funding ? 'Adding...' : 'Add $10,000 Test Funds'}
          </button>
        )}
      </div>

      {!hasMt5 && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
          <Info className="h-4 w-4" /> Complete KYC verification to receive your MT5 account and start trading.
        </div>
      )}

      {criticalMargin && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertTriangle className="h-4 w-4 animate-pulse" /> Margin call! Your margin level is {marginLevel.toFixed(1)}%. Positions may be liquidated soon. Consider closing positions or adding funds.
        </div>
      )}

      {toast && (
        <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
          toast.type === 'success' ? 'border-green-500/20 bg-green-500/10 text-green-300' :
          toast.type === 'error' ? 'border-red-500/20 bg-red-500/10 text-red-300' :
          'border-blue-500/20 bg-blue-500/10 text-blue-300'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Account stats bar */}
      {hasMt5 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-navy-700/50 bg-navy-900/50 p-4">
            <div className="flex items-center gap-1.5 text-xs text-white/50"><Wallet className="h-3 w-3" /> Balance</div>
            <div className="mt-1 text-lg font-bold text-white">${balance.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-navy-700/50 bg-navy-900/50 p-4">
            <div className="text-xs text-white/50">Equity</div>
            <div className={`mt-1 text-lg font-bold ${equity >= balance ? 'text-green-400' : 'text-red-400'}`}>${equity.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-navy-700/50 bg-navy-900/50 p-4">
            <div className="text-xs text-white/50">Used Margin</div>
            <div className="mt-1 text-lg font-bold text-white">${margin.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-navy-700/50 bg-navy-900/50 p-4">
            <div className="text-xs text-white/50">Free Margin</div>
            <div className={`mt-1 text-lg font-bold ${freeMargin > 0 ? 'text-white' : 'text-red-400'}`}>${freeMargin.toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Watchlist */}
        <div className="lg:col-span-1">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/40">Watchlist</h3>
          <div className="space-y-2">
            {watchlist.map((item) => (
              <button
                key={item.symbol}
                onClick={() => setActive(item)}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                  active.symbol === item.symbol ? 'border-gold/50 bg-gold/10' : 'border-navy-700/50 bg-navy-900/40 hover:border-navy-600'
                }`}
              >
                <span className="font-medium text-white">{item.label}</span>
                <span className="font-mono text-sm text-white/60">{item.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-2">
          <AdvancedChart symbol={active.symbol} height={520} />
        </div>

        {/* Order ticket */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="mb-4 text-lg font-semibold text-white">{active.label}</h3>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => setSide('SELL')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-bold transition ${
                  side === 'SELL' ? 'bg-red-500 text-white' : 'bg-navy-800 text-white/60 hover:bg-navy-700'
                }`}
              >
                <TrendingDown className="h-4 w-4" /> Sell
              </button>
              <button
                onClick={() => setSide('BUY')}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-bold transition ${
                  side === 'BUY' ? 'bg-green-500 text-white' : 'bg-navy-800 text-white/60 hover:bg-navy-700'
                }`}
              >
                <TrendingUp className="h-4 w-4" /> Buy
              </button>
            </div>

            <label className="mb-1.5 block text-sm font-medium text-white/70">Volume (lots)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="input-field mb-2"
            />
            <div className="mb-4 flex flex-wrap gap-1.5">
              {['0.01', '0.10', '0.50', '1.00'].map((v) => (
                <button
                  key={v}
                  onClick={() => setVolume(v)}
                  className="rounded-md bg-navy-800 px-2.5 py-1 text-xs text-white/60 hover:bg-navy-700 hover:text-white"
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="mb-4 space-y-2 rounded-lg bg-navy-900/50 p-3 text-sm">
              <div className="flex justify-between"><span className="text-white/50">Est. margin</span><span className="text-white">${estMargin}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Leverage</span><span className="text-white">1:{LEVERAGE}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Ref. price</span><span className="font-mono text-white">{active.price}</span></div>
              {margin > 0 && (
                <div className="flex justify-between border-t border-navy-700/50 pt-2">
                  <span className="text-white/50">Margin level</span>
                  <span className={`font-bold ${marginLevel < 60 ? 'text-red-400' : marginLevel < 100 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {marginLevel.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={placeOrder}
              disabled={!hasMt5 || submitting}
              className={`w-full rounded-lg py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                side === 'BUY' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {submitting ? 'Submitting...' : `${side} ${active.label}`}
            </button>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-white/40">
              <Info className="h-3 w-3" /> Orders execute instantly on your MT5 account.
            </p>
          </div>
        </div>
      </div>

      {/* Open positions */}
      {hasMt5 && (
        <div className="mt-8 card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Open Positions</h3>
            {trades.length > 0 && (
              <span className="text-sm text-white/40">{trades.length} active</span>
            )}
          </div>
          {trades.length === 0 ? (
            <p className="py-6 text-center text-white/40">No open positions. Place an order to start trading.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-navy-700 text-white/50">
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
                    <tr key={t.id} className="border-b border-navy-700/50">
                      <td className="py-2.5 font-medium text-white">{t.symbol}</td>
                      <td className={`py-2.5 font-bold ${t.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{t.type}</td>
                      <td className="py-2.5 text-white/70">{t.volume.toFixed(2)}</td>
                      <td className="py-2.5 font-mono text-white/70">{t.openPrice}</td>
                      <td className="py-2.5 font-mono text-white/70">{t.currentPrice}</td>
                      <td className={`py-2.5 font-bold ${t.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${t.profit.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => closeTrade(t.id)}
                          disabled={closingId === t.id}
                          className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
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
