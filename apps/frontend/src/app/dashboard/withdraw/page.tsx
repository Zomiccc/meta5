'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import DashboardShell from '../../../components/DashboardShell';
import { ArrowUpCircle, Loader2, CheckCircle, History } from 'lucide-react';

export default function WithdrawPage() {
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await api.get('/withdrawals');
      setWithdrawals(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setSuccess(false);
    try {
      await api.post('/withdrawals', { amount: Number(amount), walletAddress, crypto: 'USDT' });
      setSuccess(true);
      setMessage('Withdrawal request submitted. It will be processed after admin approval.');
      setAmount('');
      setWalletAddress('');
      await fetchWithdrawals();
    } catch (err: any) {
      setSuccess(false);
      setMessage(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-bnText-primary">Withdraw Funds</h1>
        <p className="text-bnText-secondary">Withdraw USDT to your personal TRC20 wallet</p>
      </div>

      <div className="mx-auto w-full max-w-lg bn-card animate-slide-up">
        {message && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-bn border px-4 py-3 text-sm ${
              success
                ? 'border-bnGreen/20 bg-bnGreen/10 text-bnGreen'
                : 'border-bnRed/20 bg-bnRed/10 text-bnRed'
            }`}
          >
            {success ? <CheckCircle className="h-4 w-4" /> : null}
            {message}
          </div>
        )}
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-bnText-secondary">Amount (USD)</label>
            <input type="number" min="10" required placeholder="100" value={amount} onChange={(e) => setAmount(e.target.value)} className="bn-input" />
            <p className="mt-1 text-xs text-bnText-muted">Minimum withdrawal: $10</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-bnText-secondary">Your USDT Wallet Address (TRC20)</label>
            <input required placeholder="Enter your USDT TRC20 wallet address (starts with T)" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} className="bn-input" />
            <p className="mt-1 text-xs text-bnText-muted">Funds are sent to this address on the Tron (TRC20) network only. Double-check it — transfers are irreversible.</p>
          </div>
          <div className="rounded-bn border border-yellow/20 bg-yellow/5 p-4">
            <p className="font-medium text-bnText-primary">USDT</p>
            <p className="text-xs text-bnText-secondary">Tron Network (TRC20) — the only supported withdrawal method</p>
          </div>
          <button type="submit" disabled={loading} className="bn-btn-primary w-full">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <ArrowUpCircle className="h-4 w-4" /> Request Withdrawal
              </span>
            )}
          </button>
        </form>
      </div>

      {withdrawals.length > 0 && (
        <div className="mx-auto mt-8 w-full max-w-lg">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-bnText-muted" />
            <h3 className="text-sm font-semibold text-bnText-primary">Withdrawal History</h3>
          </div>
          <div className="space-y-2">
            {withdrawals.slice(0, 10).map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-bn border border-bn-border bg-bn-card p-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-bnText-primary">${Number(w.amount).toFixed(2)}</span>
                  <span className="max-w-[180px] truncate text-xs text-bnText-muted">{w.walletAddress || '—'}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-bnText-muted">{new Date(w.createdAt).toLocaleDateString()}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    w.status === 'approved' ? 'bg-bnGreen/10 text-bnGreen' :
                    w.status === 'pending' ? 'bg-yellow/10 text-yellow' :
                    'bg-bnRed/10 text-bnRed'
                  }`}>
                    {w.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
