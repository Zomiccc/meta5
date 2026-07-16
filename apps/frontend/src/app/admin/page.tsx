'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getAccessToken, clearAuthTokens } from '../../lib/api';
import AdminShell from '../../components/AdminShell';
import { Users, DollarSign, ArrowUpCircle, Activity, Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { router.push('/login'); return; }
    api.get('/admin/dashboard')
      .then((res) => setStats(res.data))
      .catch(() => {
        clearAuthTokens();
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <AdminShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-yellow" />
        </div>
      </AdminShell>
    );
  }

  const cards = [
    { label: 'Total Clients', value: stats?.totalClients || 0, icon: Users },
    { label: 'Total Deposits', value: `$${stats?.totalDeposits || 0}`, icon: DollarSign },
    { label: 'Total Withdrawals', value: `$${stats?.totalWithdrawals || 0}`, icon: ArrowUpCircle },
    { label: 'Open Trades', value: stats?.openTrades || 0, icon: Activity },
  ];

  return (
    <AdminShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-bnText-primary">Admin Dashboard</h1>
        <p className="text-bnText-secondary">Platform overview and statistics</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bn-card animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-bn bg-yellow/10">
                <Icon className="h-5 w-5 text-yellow" />
              </div>
              <p className="text-sm text-bnText-secondary">{card.label}</p>
              <p className="mt-1 text-2xl font-bold text-bnText-primary">{card.value}</p>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
