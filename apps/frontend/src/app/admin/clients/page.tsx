'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import AdminShell from '../../../components/AdminShell';
import { Loader2, Trash2 } from 'lucide-react';

export default function AdminClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [deleting, setDeleting] = useState(false);

  const load = () => api.get('/admin/clients').then((res) => setClients(res.data));

  useEffect(() => {
    load();
  }, []);

  const deleteAll = async () => {
    if (!confirm('WARNING: This will permanently delete ALL client accounts, trades, KYC, deposits and withdrawals. Admins are kept. Are you sure?')) return;
    setDeleting(true);
    try {
      await api.delete('/admin/clients');
      await load();
      alert('All client accounts deleted. Admins preserved.');
    } catch {
      alert('Failed to delete clients');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Clients</h1>
        <button
          onClick={deleteAll}
          disabled={deleting}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete all clients
        </button>
      </div>
      <div className="overflow-x-auto rounded border border-navy-700 bg-navy-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy-600 text-white/60">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">KYC</th>
              <th className="px-4 py-3">Balance</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-navy-700">
                <td className="px-4 py-3 text-white">{client.name}</td>
                <td className="px-4 py-3 text-white">{client.email}</td>
                <td className="px-4 py-3 capitalize text-white">{client.status}</td>
                <td className="px-4 py-3 capitalize text-white">{client.kyc?.status || 'Not submitted'}</td>
                <td className="px-4 py-3 text-white">${client.mt5Account ? Number(client.mt5Account.balance).toFixed(2) : '0.00'}</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-4 text-white/50">No clients found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
