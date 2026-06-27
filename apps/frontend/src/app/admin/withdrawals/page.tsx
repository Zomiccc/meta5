'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import AdminShell from '../../../components/AdminShell';

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  const load = () => api.get('/admin/withdrawals').then((res) => setWithdrawals(res.data));

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    await api.post(`/admin/withdrawals/${id}/approve`);
    load();
  };

  const reject = async (id: string) => {
    const reason = prompt('Rejection reason');
    if (!reason) return;
    await api.post(`/admin/withdrawals/${id}/reject`, { reason });
    load();
  };

  return (
    <AdminShell>
      <h1 className="mb-6 text-2xl font-bold text-white">Withdrawals</h1>
      <div className="overflow-x-auto rounded border border-navy-700 bg-navy-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy-600 text-white/60">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Wallet</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w) => (
              <tr key={w.id} className="border-b border-navy-700">
                <td className="px-4 py-3 text-white">{w.user.name}</td>
                <td className="px-4 py-3 text-white">${Number(w.amount).toFixed(2)}</td>
                <td className="px-4 py-3 text-white">{w.walletAddress.slice(0, 12)}...</td>
                <td className={`px-4 py-3 capitalize ${w.status === 'approved' ? 'text-green-400' : w.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>{w.status}</td>
                <td className="px-4 py-3">
                  {w.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => approve(w.id)} className="rounded bg-green-600 px-3 py-1 text-xs font-bold text-white hover:bg-green-700">Approve</button>
                      <button onClick={() => reject(w.id)} className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {withdrawals.length === 0 && <tr><td colSpan={5} className="px-4 py-4 text-white/50">No withdrawals</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
