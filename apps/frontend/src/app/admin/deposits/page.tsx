'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import AdminShell from '../../../components/AdminShell';

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const load = () => api.get('/admin/deposits').then((res) => setDeposits(res.data));

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    setLoadingId(id);
    try {
      await api.post(`/admin/deposits/${id}/approve`);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve deposit');
    } finally {
      setLoadingId(null);
    }
  };

  const reject = async (id: string) => {
    setLoadingId(id);
    try {
      await api.post(`/admin/deposits/${id}/reject`);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject deposit');
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

  const statusColor = (s: string) =>
    s === 'approved' ? 'text-bnGreen' : s === 'rejected' ? 'text-bnRed' : s === 'expired' ? 'text-bnText-secondary' : 'text-yellow';

  return (
    <AdminShell>
      <h1 className="mb-6 text-2xl font-bold text-bnText-primary">Deposits</h1>
      <div className="overflow-x-auto rounded border border-bn-border bg-bn-input">
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="border-b border-bn-border text-bnText-secondary">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Expected (unique)</th>
              <th className="px-4 py-3">Crypto</th>
              <th className="px-4 py-3">Transaction</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deposits.map((d) => (
              <tr key={d.id} className="border-b border-bn-border">
                <td className="px-4 py-3 text-bnText-primary">{d.user.name}</td>
                <td className="px-4 py-3 text-bnText-primary">${Number(d.amount).toFixed(2)}</td>
                <td className="px-4 py-3 text-bnText-secondary">{Number(d.uniqueAmount || 0).toFixed(2)} USDT</td>
                <td className="px-4 py-3 text-bnText-primary">{d.cryptoCurrency}</td>
                <td className="px-4 py-3">{txCell(d.txHash)}</td>
                <td className={`px-4 py-3 capitalize ${statusColor(d.status)}`}>{d.status}</td>
                <td className="px-4 py-3">
                  {d.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approve(d.id)}
                        disabled={loadingId === d.id}
                        className="rounded bg-green-600 px-3 py-1 text-xs font-bold text-bnText-primary hover:bg-green-700 disabled:opacity-50"
                      >
                        {loadingId === d.id ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => reject(d.id)}
                        disabled={loadingId === d.id}
                        className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-bnText-primary hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {deposits.length === 0 && <tr><td colSpan={7} className="px-4 py-4 text-bnText-secondary">No deposits</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
