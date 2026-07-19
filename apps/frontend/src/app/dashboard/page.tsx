'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/useAuth';
import DashboardShell from '../../components/DashboardShell';
import { api } from '../../lib/api';
import {
  Wallet, BarChart3, Shield, DollarSign, ArrowDownCircle, ArrowUpCircle,
  CandlestickChart, TrendingUp, FileText, Link2, Loader2, CheckCircle2,
  AlertCircle, Clock, ChevronRight, Eye, EyeOff, Home, User,
} from 'lucide-react';

export default function DashboardPage() {
  const { user: profile, loading } = useAuth();
  const router = useRouter();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [hideBalance, setHideBalance] = useState(false);
  const [marketTab, setMarketTab] = useState('Hot');
  const [instruments, setInstruments] = useState<any[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!loading && profile) {
      api.get('/deposits').then((r) => setDeposits(r.data)).catch(() => {});
      api.get('/withdrawals').then((r) => setWithdrawals(r.data)).catch(() => {});
      api.get('/mt5/instruments').then((r) => setInstruments(r.data)).catch(() => {});
    }
  }, [loading, profile]);

  useEffect(() => {
    if (instruments.length === 0) return;
    const symbols = encodeURIComponent(instruments.map((i) => i.symbol).join(','));
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/mt5/prices?symbols=${symbols}`);
        setLivePrices(res.data);
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [instruments]);

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-yellow" />
        </div>
      </DashboardShell>
    );
  }

  if (!profile) {
    router.push('/login');
    return (
      <DashboardShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-yellow" />
        </div>
      </DashboardShell>
    );
  }

  const mt5 = profile?.mt5Account;
  const kyc = profile?.kyc;
  const balance = mt5?.balance ? Number(mt5.balance) : 0;
  const equity = mt5?.equity ? Number(mt5.equity) : 0;
  const margin = mt5?.margin ? Number(mt5.margin) : 0;
  const freeMargin = mt5?.freeMargin ? Number(mt5.freeMargin) : 0;
  const pnl = equity - balance;
  const pnlPct = balance > 0 ? (pnl / balance) * 100 : 0;

  const maskValue = (v: string) => hideBalance ? '****' : v;

  const recentTx = [
    ...deposits.slice(0, 3).map((d) => ({ ...d, type: 'deposit' })),
    ...withdrawals.slice(0, 3).map((w) => ({ ...w, type: 'withdraw' })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const quickActions = [
    { href: '/dashboard/deposit', label: 'Deposit', icon: ArrowDownCircle, color: 'bg-bnGreen/10 text-bnGreen' },
    { href: '/dashboard/withdraw', label: 'Withdraw', icon: ArrowUpCircle, color: 'bg-bnRed/10 text-bnRed' },
    { href: '/dashboard/trade', label: 'Trade', icon: CandlestickChart, color: 'bg-yellow/10 text-yellow' },
    { href: '/dashboard/kyc', label: 'KYC', icon: FileText, color: 'bg-blue-500/10 text-blue-400' },
  ];

  const hotInstruments = instruments.filter((i) => {
    if (marketTab === 'Hot') return true;
    if (marketTab === 'Forex') return i.category === 'Forex';
    if (marketTab === 'Crypto') return i.category === 'Crypto';
    if (marketTab === 'Stocks') return i.category === 'Stocks';
    if (marketTab === 'Indices') return i.category === 'Indices';
    return true;
  }).slice(0, 10);

  return (
    <DashboardShell>
      <div className="mx-auto max-w-6xl space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-bn-lg border border-bn-border bg-gradient-to-br from-bn-card to-bn-secondary p-5 shadow-card md:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs text-bnText-muted">Total Balance (USDT)</p>
                <button onClick={() => setHideBalance(!hideBalance)} className="text-bnText-muted transition hover:text-bnText-primary">
                  {hideBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="mt-1.5 text-2xl font-bold tnum text-bnText-primary sm:text-3xl md:text-4xl">
                ${maskValue(balance.toFixed(2))}
              </p>
              <p className={`mt-1 text-sm tnum ${pnl >= 0 ? 'text-bnGreen' : 'text-bnRed'}`}>
                {pnl >= 0 ? '▲' : '▼'} {Math.abs(pnlPct).toFixed(2)}% &nbsp;·&nbsp; {pnl >= 0 ? '+' : ''}{maskValue(pnl.toFixed(2))}
              </p>
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <Link href="/dashboard/deposit" className="flex flex-1 items-center justify-center gap-1.5 rounded-bn bg-yellow px-4 py-2.5 text-xs font-bold text-black transition-all duration-200 hover:bg-yellow-hover active:scale-95 shadow-glow-yellow sm:flex-none">
                <ArrowDownCircle className="h-4 w-4" /> Deposit
              </Link>
              <Link href="/dashboard/withdraw" className="flex flex-1 items-center justify-center gap-1.5 rounded-bn border border-bn-border bg-bn-input px-4 py-2.5 text-xs font-bold text-bnText-primary transition-all duration-200 hover:bg-bn-hover active:scale-95 sm:flex-none">
                <ArrowUpCircle className="h-4 w-4" /> Withdraw
              </Link>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-bn-border pt-4 sm:gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 flex-shrink-0 text-bnText-muted" /><p className="truncate text-2xs text-bnText-muted md:text-xs">Equity</p></div>
              <p className="mt-1 text-sm font-bold tnum text-bnText-primary md:text-base">${maskValue(equity.toFixed(2))}</p>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 flex-shrink-0 text-bnText-muted" /><p className="truncate text-2xs text-bnText-muted md:text-xs">Margin</p></div>
              <p className="mt-1 text-sm font-bold tnum text-bnText-primary md:text-base">${maskValue(margin.toFixed(2))}</p>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 flex-shrink-0 text-bnText-muted" /><p className="truncate text-2xs text-bnText-muted md:text-xs">Free Margin</p></div>
              <p className="mt-1 text-sm font-bold tnum text-bnText-primary md:text-base">${maskValue(freeMargin.toFixed(2))}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-4 gap-2"
        >
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="flex flex-col items-center gap-2 rounded-bn border border-bn-border bg-bn-card p-3 transition-all duration-200 hover:border-yellow/30 hover:bg-bn-hover active:scale-95">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${action.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-2xs font-medium text-bnText-secondary md:text-xs">{action.label}</span>
              </Link>
            );
          })}
        </motion.div>

        {kyc?.status !== 'approved' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href="/dashboard/kyc" className="flex items-center justify-between gap-3 rounded-bn border border-yellow/30 bg-yellow/5 p-4 transition-all duration-200 hover:bg-yellow/10">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow/10">
                  {kyc?.status === 'pending' ? <Clock className="h-5 w-5 text-yellow" /> : kyc?.status === 'rejected' ? <AlertCircle className="h-5 w-5 text-bnRed" /> : <Shield className="h-5 w-5 text-yellow" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-bnText-primary">{kyc?.status === 'pending' ? 'KYC Verification in Progress' : kyc?.status === 'rejected' ? 'KYC Verification Rejected' : 'Complete KYC Verification'}</p>
                  <p className="truncate text-xs text-bnText-secondary">{kyc?.status === 'pending' ? 'We are reviewing your documents' : kyc?.status === 'rejected' ? 'Please resubmit your documents' : 'Verify your identity to unlock all features'}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-bnText-muted" />
            </Link>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-3 flex overflow-x-auto gap-2 scrollbar-hide">
            {['Hot', 'Forex', 'Crypto', 'Stocks', 'Indices'].map((tab) => (
              <button key={tab} onClick={() => setMarketTab(tab)} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs transition-all duration-200 ${marketTab === tab ? 'bg-yellow font-semibold text-black' : 'bg-bn-card text-bnText-secondary hover:text-bnText-primary'}`}>{tab}</button>
            ))}
          </div>
          <div className="mb-2 flex items-center justify-between px-1 text-xs text-bnText-secondary">
            <span>Name</span>
            <div className="flex gap-4 sm:gap-8"><span>Last Price</span><span className="hidden sm:inline">24h Change</span></div>
          </div>
          {hotInstruments.map((inst) => {
            const live = livePrices[inst.symbol];
            const basePrice = inst.basePrice || 0;
            const change = live && basePrice ? ((live - basePrice) / basePrice) * 100 : 0;
            const displaySym = inst.label || inst.symbol;
            return (
              <Link key={inst.symbol} href={`/dashboard/trade?symbol=${inst.symbol}`} className="flex items-center justify-between gap-2 border-b border-bn-secondary py-3 transition-colors duration-200 hover:bg-bn-hover/50">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-bn-input text-xs font-bold text-yellow">{displaySym.slice(0, 2)}</div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-bnText-primary">{displaySym}</div>
                    <div className="truncate text-xs text-bnText-secondary">{inst.category}</div>
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                  <div className="tnum text-sm text-bnText-primary">{live ? live.toFixed(5) : '—'}</div>
                  <div className={`rounded px-2 py-0.5 text-xs tnum ${change >= 0 ? 'bg-bnGreen/20 text-bnGreen' : 'bg-bnRed/20 text-bnRed'}`}>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</div>
                </div>
              </Link>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-bn border border-bn-border bg-bn-card p-5 shadow-card"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-bnText-primary">Recent Transactions</h3>
            <Link href="/dashboard/history" className="text-xs text-bnText-secondary transition hover:text-yellow">View all →</Link>
          </div>
          {recentTx.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-bn-input"><Wallet className="h-6 w-6 text-bnText-muted" /></div>
              <p className="text-xs text-bnText-muted">No transactions yet</p>
              <Link href="/dashboard/deposit" className="mt-3 text-xs font-medium text-yellow transition hover:text-yellow-hover">Make your first deposit →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTx.map((tx) => {
                const isDeposit = tx.type === 'deposit';
                return (
                  <div key={tx.id} className="flex items-center justify-between gap-2 rounded-bn bg-bn-input/50 p-3 transition-colors duration-200 hover:bg-bn-input">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${isDeposit ? 'bg-bnGreen/10' : 'bg-bnRed/10'}`}>
                        {isDeposit ? <ArrowDownCircle className="h-4 w-4 text-bnGreen" /> : <ArrowUpCircle className="h-4 w-4 text-bnRed" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-bnText-primary">{isDeposit ? 'Deposit' : 'Withdrawal'}</p>
                        <p className="text-2xs text-bnText-muted">{new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end">
                      <p className={`text-xs font-bold tnum ${isDeposit ? 'text-bnGreen' : 'text-bnRed'}`}>{isDeposit ? '+' : '-'}${Number(tx.amount).toFixed(2)}</p>
                      <p className={`text-2xs font-medium capitalize ${tx.status === 'approved' ? 'text-bnGreen' : tx.status === 'pending' ? 'text-yellow' : tx.status === 'expired' ? 'text-bnText-muted' : 'text-bnRed'}`}>{tx.status}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardShell>
  );
}
