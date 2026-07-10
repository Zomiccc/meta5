'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import DashboardShell from '../../../components/DashboardShell';
import { Loader2, ExternalLink } from 'lucide-react';

export default function HistoryPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/deposits').then((res) => setDeposits(res.data)).catch(() => []),
      api.get('/withdrawals').then((res) => setWithdrawals(res.data)).catch(() => []),
    ]).finally(() => setLoading(false));
  }, []);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved: 'bg-green-500/10 text-green-400 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
      expired: 'bg-white/10 text-white/50 border-white/20',
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    };
    return `status-badge border ${styles[status] || styles.pending}`;
  };

  // TRC20 tx hashes are 64 hex chars; link those to Tronscan.
  const isTxHash = (v?: string) => !!v && /^[0-9a-fA-F]{64}$/.test(v);
  const txCell = (hash?: string) => {
    if (!hash) return <span className="text-white/30">—</span>;
    if (isTxHash(hash)) {
      return (
        <a
          href={`https://tronscan.org/#/transaction/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-xs text-gold underline hover:text-gold/80"
        >
          {hash.slice(0, 10)}... <ExternalLink className="h-3 w-3" />
        </a>
      );
    }
    return <span className="font-mono text-xs text-white/50">{hash.slice(0, 14)}...</span>;
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

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Transaction History</h1>
        <p className="text-white/50">View your deposits and withdrawals</p>
      </div>

      <div className="mb-8 card animate-slide-up">
        <h3 className="mb-4 text-lg font-semibold text-white">Deposits</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-700 text-white/50">
              <tr>
                <th className="py-3 font-medium">Date</th>
                <th className="py-3 font-medium">Amount</th>
                <th className="py-3 font-medium">Crypto</th>
                <th className="py-3 font-medium">Transaction</th>
                <th className="py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d.id} className="border-b border-navy-700/50">
                  <td className="py-3 text-white/70">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 font-medium text-white">${Number(d.amount).toFixed(2)}</td>
                  <td className="py-3 text-white/70">{d.cryptoCurrency}</td>
                  <td className="py-3">{txCell(d.txHash)}</td>
                  <td className="py-3"><span className={statusBadge(d.status)}>{d.status}</span></td>
                </tr>
              ))}
              {deposits.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-white/40">No deposits found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card animate-slide-up">
        <h3 className="mb-4 text-lg font-semibold text-white">Withdrawals</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-700 text-white/50">
              <tr>
                <th className="py-3 font-medium">Date</th>
                <th className="py-3 font-medium">Amount</th>
                <th className="py-3 font-medium">Wallet</th>
                <th className="py-3 font-medium">Transaction</th>
                <th className="py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-navy-700/50">
                  <td className="py-3 text-white/70">{new Date(w.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 font-medium text-white">${Number(w.amount).toFixed(2)}</td>
                  <td className="py-3 font-mono text-xs text-white/50">{(w.clientWalletAddress || w.walletAddress)?.slice(0, 12)}...</td>
                  <td className="py-3">{txCell(w.txHash)}</td>
                  <td className="py-3"><span className={statusBadge(w.status)}>{w.status}</span></td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-white/40">No withdrawals found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
