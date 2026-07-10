'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import AdminShell from '../../../components/AdminShell';

export default function AdminClientsPage() {
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    api.get('/admin/clients').then((res) => setClients(res.data));
  }, []);

  return (
    <AdminShell>
      <h1 className="mb-6 text-2xl font-bold text-white">Clients</h1>
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
