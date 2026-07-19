'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-bnText-primary">Admin Dashboard</h1>
        <p className="text-bnText-secondary">Platform overview and statistics</p>
      </motion.div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-bn-lg border border-bn-border bg-bn-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-bn bg-yellow/10">
                <Icon className="h-5 w-5 text-yellow" />
              </div>
              <p className="text-sm text-bnText-secondary">{card.label}</p>
              <p className="mt-1 text-2xl font-bold tnum text-bnText-primary">{card.value}</p>
            </motion.div>
          );
        })}
      </div>
    </AdminShell>
  );
}
