'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import DashboardShell from '../../../components/DashboardShell';
import { ArrowDownCircle, Copy, Loader2, CheckCircle, Clock, RefreshCw, AlertCircle, Wifi } from 'lucide-react';

export default function DepositPage() {
  const [amount, setAmount] = useState('');
  const [crypto, setCrypto] = useState('USDT');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<{ status: string; message: string; txHash?: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPaymentStatus(null);
    try {
      const res = await api.post('/deposits', { amount: Number(amount), crypto });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create deposit');
    } finally {
      setLoading(false);
    }
  };

  const checkPayment = useCallback(async () => {
    if (!result?.deposit?.id) return;
    setChecking(true);
    try {
      const res = await api.post(`/deposits/${result.deposit.id}/check-payment`);
      setPaymentStatus(res.data);
      if (res.data.status === 'approved') {
        // Update the result to show approved status
        setResult((prev: any) => ({ ...prev, deposit: { ...prev.deposit, status: 'approved', txHash: res.data.txHash } }));
      }
    } catch (err: any) {
      setPaymentStatus({ status: 'error', message: err.response?.data?.message || 'Failed to check payment' });
    } finally {
      setChecking(false);
    }
  }, [result]);

  // Auto-poll for payment every 15 seconds
  useEffect(() => {
    if (!result?.deposit?.id || result.deposit.status === 'approved') return;
    const interval = setInterval(() => {
      checkPayment();
    }, 15000);
    return () => clearInterval(interval);
  }, [result, checkPayment]);

  const copyAddress = () => {
    if (result?.address) {
      navigator.clipboard.writeText(result.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Deposit Funds</h1>
        <p className="text-white/50">Fund your account with cryptocurrency — verified on-chain</p>
      </div>

      <div className="mx-auto max-w-lg">
        {!result ? (
          <div className="card animate-slide-up">
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-white/70">Amount (USD)</label>
                <input
                  type="number"
                  min="10"
                  required
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field"
                />
                <p className="mt-1 text-xs text-white/40">Minimum deposit: $10</p>
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
                        crypto === option.value
                          ? 'border-gold bg-gold/10'
                          : 'border-navy-600 bg-navy-900/50 hover:border-navy-500'
                      }`}
                    >
                      <p className="font-medium text-white">{option.label}</p>
                      <p className="text-xs text-white/40">{option.network}</p>
                    </button>
                  ))}
                </div>
              </div>
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-gold w-full">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                  </span>
                ) : (
                  'Generate Payment Address'
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="card animate-slide-up space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
                <ArrowDownCircle className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Payment Created</h3>
                <p className="text-xs text-white/50">Send exactly the amount below to the address</p>
              </div>
            </div>

            <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Payment ID</span>
                <span className="font-mono text-sm font-medium text-gold">{result.paymentId}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-white/50">Network</span>
                <span className="text-sm font-medium text-white">{result.network}</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-white/50">Send {crypto} to this address:</p>
              <div className="flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-900/50 p-3">
                <p className="flex-1 break-all font-mono text-sm text-gold">{result.address}</p>
                <button onClick={copyAddress} className="rounded-lg p-2 text-white/60 hover:bg-navy-700 hover:text-white">
                  {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-navy-900/50 p-4">
                <p className="text-xs text-white/50">Exact Amount to Send</p>
                <p className="mt-1 text-xl font-bold text-white">${Number(result.amount).toFixed(2)}</p>
                <p className="mt-0.5 text-xs text-gold/60">Unique amount identifies your deposit</p>
              </div>
              <div className="rounded-lg bg-navy-900/50 p-4">
                <p className="text-xs text-white/50">Status</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {result.deposit.status === 'approved' ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="font-medium text-green-400">Confirmed</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-yellow-400" />
                      <span className="font-medium capitalize text-yellow-400">{result.deposit.status}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Payment verification status */}
            {paymentStatus && (
              <div className={`rounded-lg border p-4 text-sm ${
                paymentStatus.status === 'approved'
                  ? 'border-green-500/20 bg-green-500/10 text-green-300'
                  : paymentStatus.status === 'error'
                  ? 'border-red-500/20 bg-red-500/10 text-red-300'
                  : 'border-blue-500/20 bg-blue-500/10 text-blue-300'
              }`}>
                <div className="flex items-start gap-2">
                  {paymentStatus.status === 'approved' ? (
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : paymentStatus.status === 'error' ? (
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Wifi className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p>{paymentStatus.message}</p>
                    {paymentStatus.txHash && (
                      <p className="mt-1 font-mono text-xs opacity-70">TX: {paymentStatus.txHash.slice(0, 30)}...</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-300/80">
              <p className="mb-1"><strong>Important:</strong> Send exactly <span className="font-mono font-bold">${Number(result.amount).toFixed(2)}</span> worth of {crypto} to the address above.</p>
              <p>The unique cents amount (e.g., .37) identifies your deposit on the blockchain. Your balance will be credited automatically once the transaction is confirmed.</p>
            </div>

            <div className="flex gap-3">
              {result.deposit.status !== 'approved' && (
                <button
                  onClick={checkPayment}
                  disabled={checking}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-navy-600 bg-navy-800 py-3 text-sm font-bold text-white transition hover:bg-navy-700 disabled:opacity-50"
                >
                  {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {checking ? 'Checking blockchain...' : 'Check Payment Status'}
                </button>
              )}
              <button onClick={() => { setResult(null); setPaymentStatus(null); }} className="btn-outline flex-1">
                {result.deposit.status === 'approved' ? 'New Deposit' : 'Cancel'}
              </button>
            </div>

            {result.deposit.status !== 'approved' && (
              <p className="text-center text-xs text-white/30">
                Auto-checking blockchain every 15 seconds
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
