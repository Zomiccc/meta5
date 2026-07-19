'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../../lib/api';
import AdminShell from '../../../components/AdminShell';
import { Check, Copy, Loader2, Trash2 } from 'lucide-react';

export default function AdminClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = () => api.get('/admin/clients').then((res) => setClients(res.data));

  useEffect(() => {
    load();
  }, []);

  const copyValue = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const deleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/clients/${id}`);
      setClients((current) => current.filter((client) => client.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete client');
    } finally {
      setDeletingId(null);
    }
  }; 

  return (
    <AdminShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-bnText-primary">Clients</h1>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-x-auto rounded-bn-lg border border-bn-border bg-bn-card shadow-card"
      >
        <table className="min-w-[1050px] w-full text-left text-sm">
          <thead className="border-b border-bn-border text-bnText-secondary">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">KYC</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-bn-border">
                <td className="px-4 py-3 text-bnText-primary">{client.name}</td>
                <td className="px-4 py-3 text-bnText-primary">
                  <button onClick={() => copyValue(`${client.id}:email`, client.email)} className="flex items-center gap-2 whitespace-nowrap hover:text-yellow" title="Copy email">
                    {client.email}
                    {copied === `${client.id}:email` ? <Check className="h-3.5 w-3.5 text-bnGreen" /> : <Copy className="h-3.5 w-3.5 text-bnText-muted" />}
                  </button>
                </td>
                <td className="px-4 py-3 text-bnText-primary">
                  {client.phone ? (
                    <button onClick={() => copyValue(`${client.id}:phone`, client.phone)} className="flex items-center gap-2 whitespace-nowrap hover:text-yellow" title="Copy phone number">
                      {client.phone}
                      {copied === `${client.id}:phone` ? <Check className="h-3.5 w-3.5 text-bnGreen" /> : <Copy className="h-3.5 w-3.5 text-bnText-muted" />}
                    </button>
                  ) : <span className="text-bnText-muted">—</span>}
                </td>
                <td className="px-4 py-3 capitalize text-bnText-primary">{client.status}</td>
                <td className="px-4 py-3 capitalize text-bnText-primary">{client.kyc?.status || 'Not submitted'}</td>
                <td className="px-4 py-3 tnum text-bnText-primary">${client.mt5Account ? Number(client.mt5Account.balance).toFixed(2) : '0.00'}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => deleteClient(client.id)}
                    disabled={deletingId === client.id}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-bn bg-bnRed/10 px-3 py-2 text-xs font-bold text-bnRed transition hover:bg-bnRed/20 disabled:opacity-50"
                  >
                    {deletingId === client.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-4 text-bnText-secondary">No clients found</td></tr>
            )}
          </tbody>
        </table>
      </motion.div>
    </AdminShell>
  );
}
