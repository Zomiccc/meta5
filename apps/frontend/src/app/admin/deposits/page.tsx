'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import AdminShell from '../../../components/AdminShell';

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);

  const load = () => api.get('/admin/deposits').then((res) => setDeposits(res.data));

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    await api.post(`/admin/deposits/${id}/approve`);
    load();
  };

  const reject = async (id: string) => {
    await api.post(`/admin/deposits/${id}/reject`);
    load();
  };

  return (
    <AdminShell>
      <h1 className="mb-6 text-2xl font-bold text-white">Deposits</h1>
      <div className="overflow-x-auto rounded border border-navy-700 bg-navy-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy-600 text-white/60">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Crypto</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deposits.map((d) => (
              <tr key={d.id} className="border-b border-navy-700">
                <td className="px-4 py-3 text-white">{d.user.name}</td>
                <td className="px-4 py-3 text-white">${Number(d.amount).toFixed(2)}</td>
                <td className="px-4 py-3 text-white">{d.cryptoCurrency}</td>
                <td className={`px-4 py-3 capitalize ${d.status === 'approved' ? 'text-green-400' : d.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>{d.status}</td>
                <td className="px-4 py-3">
                  {d.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => approve(d.id)} className="rounded bg-green-600 px-3 py-1 text-xs font-bold text-white hover:bg-green-700">Approve</button>
                      <button onClick={() => reject(d.id)} className="rounded bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {deposits.length === 0 && <tr><td colSpan={5} className="px-4 py-4 text-white/50">No deposits</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
