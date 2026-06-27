'use client';

import { useState } from 'react';
import { api } from '../../../lib/api';
import DashboardShell from '../../../components/DashboardShell';
import { ArrowUpCircle, Loader2, CheckCircle } from 'lucide-react';

export default function WithdrawPage() {
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [crypto, setCrypto] = useState('USDT');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setSuccess(false);
    try {
      await api.post('/withdrawals', { amount: Number(amount), walletAddress, crypto });
      setSuccess(true);
      setMessage('Withdrawal request submitted successfully.');
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
        <h1 className="text-2xl font-bold text-white">Withdraw Funds</h1>
        <p className="text-white/50">Withdraw to your crypto wallet</p>
      </div>

      <div className="mx-auto max-w-lg card animate-slide-up">
        {message && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
              success
                ? 'border-green-500/20 bg-green-500/10 text-green-300'
                : 'border-red-500/20 bg-red-500/10 text-red-300'
            }`}
          >
            {success ? <CheckCircle className="h-4 w-4" /> : null}
            {message}
          </div>
        )}
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Amount (USD)</label>
            <input type="number" min="10" required placeholder="100" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" />
            <p className="mt-1 text-xs text-white/40">Minimum withdrawal: $10</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Wallet Address</label>
            <input required placeholder="Enter your wallet address" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/70">Cryptocurrency</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'USDT', label: 'USDT', network: 'TRC20' },
                { value: 'BTC', label: 'Bitcoin', network: 'BTC' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCrypto(option.value)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    crypto === option.value ? 'border-gold bg-gold/10' : 'border-navy-600 bg-navy-900/50 hover:border-navy-500'
                  }`}
                >
                  <p className="font-medium text-white">{option.label}</p>
                  <p className="text-xs text-white/40">{option.network}</p>
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-gold w-full">
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
