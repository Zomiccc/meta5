'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import AdminShell from '../../../components/AdminShell';
import { RotateCcw, Check, X, Loader2, Eye, AlertTriangle, Trash2 } from 'lucide-react';

export default function AdminKycPage() {
  const [kycs, setKycs] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

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

  const deleteAll = async () => {
    if (!confirm('WARNING: This will permanently delete ALL KYC records. Are you sure?')) return;
    setDeletingAll(true);
    try {
      await api.delete('/admin/kyc');
      load();
    } catch {
      alert('Failed to delete all KYC');
    } finally {
      setDeletingAll(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://localhost:3001';
    return `${base}${url}`;
  };

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">KYC Management</h1>
        <div className="flex flex-wrap items-center gap-2">
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
          <button
            onClick={deleteAll}
            disabled={deletingAll}
            className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {deletingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            Delete all
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      ) : (
        <div className="space-y-4">
          {kycs.map((kyc) => (
            <div key={kyc.id} className="rounded border border-navy-700 bg-navy-800 p-4 sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
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
                <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                  {kyc.status === 'pending' && (
                    <>
                      <button onClick={() => approve(kyc.id)} className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700 sm:flex-none">
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button onClick={() => reject(kyc.id)} className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 sm:flex-none">
                        <X className="h-3 w-3" /> Reject
                      </button>
                    </>
                  )}
                  {kyc.status !== 'pending' && (
                    <button
                      onClick={() => reset(kyc.id)}
                      disabled={resettingId === kyc.id}
                      className="flex min-h-11 w-full items-center justify-center gap-1 rounded bg-navy-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-navy-600 disabled:opacity-50 sm:w-auto"
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

              {kyc.aiResponse && (
                <div className={`mb-4 rounded-lg border p-4 ${kyc.aiResponse.approved ? 'border-green-500/20 bg-green-500/10' : 'border-red-500/20 bg-red-500/10'}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-bold text-white">
                      {kyc.aiResponse.approved ? (
                        <><Check className="h-4 w-4 text-green-400" /> AI recommends APPROVE</>
                      ) : (
                        <><X className="h-4 w-4 text-red-400" /> AI recommends REJECT</>
                      )}
                    </p>
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${kyc.aiResponse.confidence >= 0.8 ? 'bg-green-500/20 text-green-400' : kyc.aiResponse.confidence >= 0.5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                      Confidence {(kyc.aiResponse.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="grid gap-2 text-xs sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-white/80">
                      {kyc.aiResponse.faceMatch ? <Check className="h-3 w-3 text-green-400" /> : <X className="h-3 w-3 text-red-400" />}
                      Face match: {kyc.aiResponse.faceMatch ? 'Yes' : 'No'}
                    </div>
                    {kyc.aiResponse.name && (
                      <div className="text-white/80"><span className="font-semibold">Name:</span> {kyc.aiResponse.name}</div>
                    )}
                    {kyc.aiResponse.idNumber && (
                      <div className="text-white/80"><span className="font-semibold">ID Number:</span> {kyc.aiResponse.idNumber}</div>
                    )}
                    {kyc.aiResponse.expiryDate && (
                      <div className="text-white/80"><span className="font-semibold">Expiry:</span> {kyc.aiResponse.expiryDate}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                {[
                  { key: 'cnicFrontUrl', label: 'ID Front' },
                  { key: 'cnicBackUrl', label: 'ID Back' },
                  { key: 'selfieUrl', label: 'Selfie' },
                ].map(({ key, label }) => {
                  const imgUrl = getImageUrl(kyc[key]);
                  return (
                    <div key={key} className="rounded-lg border border-navy-700 bg-navy-900 p-2">
                      <p className="mb-2 text-xs font-medium text-white/70">{label}</p>
                      {imgUrl ? (
                        <a href={imgUrl} target="_blank" rel="noreferrer" className="group block">
                          <img
                            src={imgUrl}
                            alt={label}
                            className="h-32 w-full rounded-md object-cover transition group-hover:opacity-80"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                          <span className="mt-1 flex items-center gap-1 text-xs text-gold">
                            <Eye className="h-3 w-3" /> View full image
                          </span>
                        </a>
                      ) : (
                        <p className="text-xs text-white/40">Not uploaded</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {kyc.aiResponse?.flags?.length > 0 && (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
                  <p className="mb-1 flex items-center gap-1 text-xs font-bold text-yellow-400">
                    <AlertTriangle className="h-3 w-3" /> AI Review Flags
                  </p>
                  <ul className="list-inside list-disc text-xs text-yellow-300/90">
                    {kyc.aiResponse.flags.map((flag: string, i: number) => (
                      <li key={i}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {kycs.length === 0 && <p className="text-white/50">No KYC records found.</p>}
        </div>
      )}
    </AdminShell>
  );
}
