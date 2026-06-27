'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import AdminShell from '../../../components/AdminShell';
import { RotateCcw, Check, X, Loader2 } from 'lucide-react';

export default function AdminKycPage() {
  const [kycs, setKycs] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    const url = filter === 'all' ? '/admin/kyc' : `/admin/kyc?status=${filter}`;
    api.get(url).then((res) => {
      setKycs(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [filter]);

  const approve = async (id: string) => {
    await api.post(`/admin/kyc/${id}/approve`);
    load();
  };

  const reject = async (id: string) => {
    const reason = prompt('Rejection reason');
    if (!reason) return;
    await api.post(`/admin/kyc/${id}/reject`, { reason });
    load();
  };

  const reset = async (id: string) => {
    if (!confirm('Reset this KYC to pending? This will clear rejection reasons and allow the user to resubmit.')) return;
    setResettingId(id);
    try {
      await api.post(`/admin/kyc/${id}/reset`);
      load();
    } catch {
      alert('Failed to reset KYC');
    } finally {
      setResettingId(null);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">KYC Management</h1>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
                filter === s ? 'bg-gold text-navy-900' : 'bg-navy-800 text-white/60 hover:bg-navy-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      ) : (
        <div className="space-y-4">
          {kycs.map((kyc) => (
            <div key={kyc.id} className="rounded border border-navy-700 bg-navy-800 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-white">{kyc.user.name}</p>
                    <p className="text-sm text-white/60">{kyc.user.email}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize ${statusColors[kyc.status]}`}>
                    {kyc.status}
                  </span>
                  {kyc.adminOverride && (
                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400 border border-blue-500/20">
                      Admin reviewed
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {kyc.status === 'pending' && (
                    <>
                      <button onClick={() => approve(kyc.id)} className="flex items-center gap-1 rounded bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700">
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button onClick={() => reject(kyc.id)} className="flex items-center gap-1 rounded bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700">
                        <X className="h-3 w-3" /> Reject
                      </button>
                    </>
                  )}
                  {kyc.status !== 'pending' && (
                    <button
                      onClick={() => reset(kyc.id)}
                      disabled={resettingId === kyc.id}
                      className="flex items-center gap-1 rounded bg-navy-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-navy-600 disabled:opacity-50"
                    >
                      {resettingId === kyc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                      Reset KYC
                    </button>
                  )}
                </div>
              </div>

              {kyc.rejectionReason && (
                <div className="mb-3 rounded bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  <span className="font-semibold">Rejection reason:</span> {kyc.rejectionReason}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                {['cnicFrontUrl', 'cnicBackUrl', 'selfieUrl'].map((key) => (
                  <div key={key} className="rounded bg-navy-900 p-2">
                    <p className="mb-1 text-xs text-white/60">{key.replace('Url', '').replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="truncate text-xs text-gold">{kyc[key] || 'Not uploaded'}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {kycs.length === 0 && <p className="text-white/50">No KYC records found.</p>}
        </div>
      )}
    </AdminShell>
  );
}
