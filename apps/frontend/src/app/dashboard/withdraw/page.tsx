'use client';

import { useState } from 'react';
import { api } from '../../../lib/api';
import DashboardShell from '../../../components/DashboardShell';
import { ArrowUpCircle, Loader2, CheckCircle } from 'lucide-react';

export default function WithdrawPage() {
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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
    </DashboardShell>
  );
}
