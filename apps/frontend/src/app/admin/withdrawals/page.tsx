'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../../lib/api';
import AdminShell from '../../../components/AdminShell';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const load = () => api.get('/admin/withdrawals').then((res) => setWithdrawals(res.data));

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    setLoadingId(id);
    try {
      await api.post(`/admin/withdrawals/${id}/approve`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve withdrawal');
    } finally {
      setLoadingId(null);
    }
  };

  const reject = async (id: string) => {
    const reason = prompt('Rejection reason');
    if (!reason) return;
    setLoadingId(id);
    try {
      await api.post(`/admin/withdrawals/${id}/reject`, { reason });
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject withdrawal');
    } finally {
      setLoadingId(null);
    }
  };

  const isTxHash = (v?: string) => !!v && /^[0-9a-fA-F]{64}$/.test(v);
  const txCell = (hash?: string) => {
    if (!hash) return <span className="text-bnText-muted">—</span>;
    if (isTxHash(hash)) {
      return <a href={`https://tronscan.org/#/transaction/${hash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-yellow underline hover:text-yellow/80">{hash.slice(0, 10)}...</a>;
    }
    return <span className="font-mono text-xs text-bnText-secondary">{hash.slice(0, 14)}...</span>;
  };

  return (
    <AdminShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-bnText-primary">Withdrawals</h1>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-x-auto rounded-bn-lg border border-bn-border bg-bn-card shadow-card"
      >
        <table className="min-w-[820px] w-full text-left text-sm">
          <thead className="border-b border-bn-border text-bnText-secondary">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Destination Wallet</th>
              <th className="px-4 py-3">Transaction</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w) => (
              <tr key={w.id} className="border-b border-bn-border">
                <td className="px-4 py-3 text-bnText-primary">{w.user.name}</td>
                <td className="px-4 py-3 tnum text-bnText-primary">${Number(w.amount).toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-xs text-bnText-secondary" title={w.clientWalletAddress || w.walletAddress}>{(w.clientWalletAddress || w.walletAddress).slice(0, 16)}...</td>
                <td className="px-4 py-3">{txCell(w.txHash)}</td>
                <td className={`px-4 py-3 capitalize ${w.status === 'approved' ? 'text-bnGreen' : w.status === 'rejected' ? 'text-bnRed' : 'text-yellow'}`}>{w.status}</td>
                <td className="px-4 py-3">
                  {w.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approve(w.id)}
                        disabled={loadingId === w.id}
                        className="rounded-bn bg-bnGreen px-3 py-1.5 text-xs font-bold text-black transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                      >
                        {loadingId === w.id ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => reject(w.id)}
                        disabled={loadingId === w.id}
                        className="rounded-bn bg-bnRed px-3 py-1.5 text-xs font-bold text-white transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {withdrawals.length === 0 && <tr><td colSpan={6} className="px-4 py-4 text-bnText-secondary">No withdrawals</td></tr>}
          </tbody>
        </table>
      </motion.div>
    </AdminShell>
  );
}
