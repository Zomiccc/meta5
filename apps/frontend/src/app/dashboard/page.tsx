'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';
import DashboardShell from '../../components/DashboardShell';
import { api } from '../../lib/api';
import {
  Wallet, BarChart3, Shield, DollarSign, ArrowDownCircle, ArrowUpCircle,
  CandlestickChart, TrendingUp, FileText, Link2, Loader2, CheckCircle2,
  AlertCircle, Clock, ChevronRight, Eye, EyeOff,
} from 'lucide-react';

export default function DashboardPage() {
  const { user: profile, loading } = useAuth();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [hideBalance, setHideBalance] = useState(false);

  useEffect(() => {
    if (!loading && profile) {
      api.get('/deposits').then((r) => setDeposits(r.data)).catch(() => {});
      api.get('/withdrawals').then((r) => setWithdrawals(r.data)).catch(() => {});
    }
  }, [loading, profile]);

  if (loading) {
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

  const maskValue = (v: string) => hideBalance ? '****' : v;

  const recentTx = [
    ...deposits.slice(0, 3).map((d) => ({ ...d, type: 'deposit' })),
    ...withdrawals.slice(0, 3).map((w) => ({ ...w, type: 'withdraw' })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const quickActions = [
    { href: '/dashboard/trade', label: 'Trade', icon: CandlestickChart, color: 'bg-yellow/10 text-yellow' },
    { href: '/dashboard/deposit', label: 'Deposit', icon: ArrowDownCircle, color: 'bg-bnGreen/10 text-bnGreen' },
    { href: '/dashboard/withdraw', label: 'Withdraw', icon: ArrowUpCircle, color: 'bg-bnRed/10 text-bnRed' },
    { href: '/dashboard/kyc', label: 'Verify KYC', icon: FileText, color: 'bg-blue-500/10 text-blue-400' },
    { href: '/dashboard/affiliate', label: 'Affiliate', icon: Link2, color: 'bg-purple-500/10 text-purple-400' },
    { href: '/dashboard/history', label: 'History', icon: TrendingUp, color: 'bg-orange-500/10 text-orange-400' },
  ];

  const stats = [
    { label: 'Equity', value: `$${maskValue(equity.toFixed(2))}`, icon: BarChart3 },
    { label: 'Used Margin', value: `$${maskValue(margin.toFixed(2))}`, icon: DollarSign },
    { label: 'Free Margin', value: `$${maskValue(freeMargin.toFixed(2))}`, icon: Wallet },
  ];

  return (
    <DashboardShell>
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Welcome header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-bnText-primary">
              Welcome, {profile?.name || 'Trader'} 👋
            </h1>
            <p className="mt-0.5 text-xs text-bnText-secondary">Here's your account overview</p>
          </div>
        </div>

        {/* Balance card — Binance style */}
        <div className="rounded-bn border border-bn-border bg-gradient-to-br from-bn-card to-bn-secondary p-5 md:p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-bnText-muted">Estimated Balance (USDT)</p>
                <button onClick={() => setHideBalance(!hideBalance)} className="text-bnText-muted transition hover:text-bnText-primary">
                  {hideBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="mt-1.5 text-3xl font-bold text-bnText-primary md:text-4xl">
                ${maskValue(balance.toFixed(2))}
              </p>
              <p className="mt-1 text-xs text-bnText-muted">
                ≈ {maskValue(balance.toFixed(2))} USDT
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/dashboard/deposit"
                className="flex items-center justify-center gap-1.5 rounded-bn bg-yellow px-4 py-2.5 text-xs font-bold text-bn-bg transition hover:bg-yellow-hover"
              >
                <ArrowDownCircle className="h-4 w-4" /> Deposit
              </Link>
              <Link
                href="/dashboard/withdraw"
                className="flex items-center justify-center gap-1.5 rounded-bn border border-bn-border bg-bn-input px-4 py-2.5 text-xs font-bold text-bnText-primary transition hover:bg-bn-hover"
              >
                <ArrowUpCircle className="h-4 w-4" /> Withdraw
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-bn-border pt-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label}>
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-bnText-muted" />
                    <p className="text-[10px] text-bnText-muted md:text-xs">{s.label}</p>
                  </div>
                  <p className="mt-1 text-sm font-bold text-bnText-primary md:text-base">{s.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* KYC status banner */}
        {kyc?.status !== 'approved' && (
          <Link
            href="/dashboard/kyc"
            className="flex items-center justify-between rounded-bn border border-yellow/30 bg-yellow/5 p-4 transition hover:bg-yellow/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow/10">
                {kyc?.status === 'pending' ? (
                  <Clock className="h-5 w-5 text-yellow" />
                ) : kyc?.status === 'rejected' ? (
                  <AlertCircle className="h-5 w-5 text-bnRed" />
                ) : (
                  <Shield className="h-5 w-5 text-yellow" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-bnText-primary">
                  {kyc?.status === 'pending' ? 'KYC Verification in Progress' :
                   kyc?.status === 'rejected' ? 'KYC Verification Rejected' :
                   'Complete KYC Verification'}
                </p>
                <p className="text-xs text-bnText-secondary">
                  {kyc?.status === 'pending' ? 'We are reviewing your documents' :
                   kyc?.status === 'rejected' ? 'Please resubmit your documents' :
                   'Verify your identity to unlock all features'}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-bnText-muted" />
          </Link>
        )}

        {/* Quick actions grid — Binance style */}
        <div>
          <h2 className="mb-3 text-sm font-bold text-bnText-primary">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 rounded-bn border border-bn-border bg-bn-card p-3 transition hover:border-yellow/30 hover:bg-bn-hover md:p-4"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${action.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-medium text-bnText-secondary md:text-xs">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Two column: Account info + Recent transactions */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Account info */}
          <div className="rounded-bn border border-bn-border bg-bn-card p-5">
            <h3 className="mb-4 text-sm font-bold text-bnText-primary">Account Information</h3>
            <div className="space-y-3">
              {[
                { label: 'Name', value: profile?.name || '-' },
                { label: 'Email', value: profile?.email || '-' },
                { label: 'Phone', value: profile?.phone || '-' },
                { label: 'Referral Code', value: profile?.affiliate?.referralCode || '-' },
                { label: 'Account Status', value: profile?.status || '-', badge: true },
                { label: 'KYC Status', value: kyc?.status || 'Not submitted', badge: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between border-b border-bn-border/50 pb-2.5 last:border-0">
                  <span className="text-xs text-bnText-muted">{item.label}</span>
                  {item.badge ? (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
                      item.value === 'approved' || item.value === 'active' ? 'bg-bnGreen/10 text-bnGreen' :
                      item.value === 'rejected' || item.value === 'suspended' ? 'bg-bnRed/10 text-bnRed' :
                      'bg-yellow/10 text-yellow'
                    }`}>
                      {item.value}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-bnText-primary">{item.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent transactions */}
          <div className="rounded-bn border border-bn-border bg-bn-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-bnText-primary">Recent Transactions</h3>
              <Link href="/dashboard/history" className="text-xs text-bnText-secondary transition hover:text-yellow">
                View all →
              </Link>
            </div>
            {recentTx.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-bn-input">
                  <Wallet className="h-6 w-6 text-bnText-muted" />
                </div>
                <p className="text-xs text-bnText-muted">No transactions yet</p>
                <Link href="/dashboard/deposit" className="mt-3 text-xs font-medium text-yellow transition hover:text-yellow-hover">
                  Make your first deposit →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentTx.map((tx) => {
                  const isDeposit = tx.type === 'deposit';
                  return (
                    <div key={tx.id} className="flex items-center justify-between rounded-bn bg-bn-input/50 p-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          isDeposit ? 'bg-bnGreen/10' : 'bg-bnRed/10'
                        }`}>
                          {isDeposit ? (
                            <ArrowDownCircle className="h-4 w-4 text-bnGreen" />
                          ) : (
                            <ArrowUpCircle className="h-4 w-4 text-bnRed" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-bnText-primary">
                            {isDeposit ? 'Deposit' : 'Withdrawal'}
                          </p>
                          <p className="text-[10px] text-bnText-muted">
                            {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-bold ${isDeposit ? 'text-bnGreen' : 'text-bnRed'}`}>
                          {isDeposit ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                        </p>
                        <p className={`text-[10px] font-medium capitalize ${
                          tx.status === 'approved' ? 'text-bnGreen' :
                          tx.status === 'pending' ? 'text-yellow' :
                          tx.status === 'expired' ? 'text-bnText-muted' :
                          'text-bnRed'
                        }`}>
                          {tx.status}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Trade CTA */}
        <Link
          href="/dashboard/trade"
          className="flex items-center justify-between rounded-bn border border-bn-border bg-gradient-to-r from-bn-card to-bn-secondary p-5 transition hover:border-yellow/30"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow/10">
              <CandlestickChart className="h-6 w-6 text-yellow" />
            </div>
            <div>
              <p className="text-sm font-bold text-bnText-primary">Start Trading</p>
              <p className="text-xs text-bnText-secondary">Access 30+ crypto pairs on MetaTrader 5</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-bnText-muted" />
        </Link>
      </div>
    </DashboardShell>
  );
}
