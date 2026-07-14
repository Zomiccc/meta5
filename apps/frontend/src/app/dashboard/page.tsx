'use client';

import { useAuth } from '../../lib/useAuth';
import DashboardShell from '../../components/DashboardShell';
import { DollarSign, BarChart3, Shield, Wallet, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user: profile, loading } = useAuth();

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </DashboardShell>
    );
  }

  const mt5 = profile?.mt5Account;
  const kyc = profile?.kyc;

  const cards = [
    { label: 'Balance', value: `$${mt5?.balance ? Number(mt5.balance).toFixed(2) : '0.00'}`, icon: Wallet },
    { label: 'Equity', value: `$${mt5?.equity ? Number(mt5.equity).toFixed(2) : '0.00'}`, icon: BarChart3 },
    { label: 'Margin', value: `$${mt5?.margin ? Number(mt5.margin).toFixed(2) : '0.00'}`, icon: DollarSign },
    {
      label: 'KYC Status',
      value: kyc?.status || 'Not submitted',
      icon: Shield,
      color: kyc?.status === 'approved' ? 'text-green-400' : kyc?.status === 'rejected' ? 'text-red-400' : 'text-yellow-400',
    },
  ];

  return (
    <DashboardShell>
      <div className="mb-8 animate-slide-up">
        <h1 className="text-2xl font-bold text-white">Welcome, {profile?.name || 'Trader'}</h1>
        <p className="text-white/50">Here is your account overview</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="card animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
                <Icon className="h-5 w-5 text-gold" />
              </div>
              <p className="text-sm text-white/50">{card.label}</p>
              <p className={`mt-1 text-2xl font-bold capitalize ${card.color || 'text-white'}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 card animate-slide-up">
        <h3 className="mb-4 text-lg font-semibold text-white">Account Details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: 'Email', value: profile?.email },
            { label: 'Phone', value: profile?.phone || '-' },
            { label: 'Referral Code', value: profile?.affiliate?.referralCode || '-' },
            { label: 'Account Status', value: profile?.status, capitalize: true },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-navy-900/50 p-4">
              <p className="text-sm text-white/50">{item.label}</p>
              <p className={`mt-1 text-white ${item.capitalize ? 'capitalize' : ''}`}>{item.value || '-'}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
