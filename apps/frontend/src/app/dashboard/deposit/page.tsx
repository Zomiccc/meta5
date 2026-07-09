'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import DashboardShell from '../../../components/DashboardShell';
import { ArrowDownCircle, Copy, Loader2, CheckCircle, Clock, RefreshCw, AlertCircle, Wifi, ExternalLink } from 'lucide-react';

function Countdown({ expiresAt }: { expiresAt: string | number | Date }) {
  const [remaining, setRemaining] = useState(() => new Date(expiresAt).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(new Date(expiresAt).getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (remaining <= 0) return <span className="font-mono font-bold text-red-400">Expired</span>;
  const totalSec = Math.floor(remaining / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return <span className="font-mono font-bold text-gold">{pad(h)}:{pad(m)}:{pad(s)}</span>;
}

export default function DepositPage() {
  const [amount, setAmount] = useState('');
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
      const res = await api.post('/deposits', { amount: Number(amount), crypto: 'USDT' });
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
      if (res.data.status === 'approved' || res.data.status === 'expired') {
        setResult((prev: any) => ({ ...prev, deposit: { ...prev.deposit, status: res.data.status, txHash: res.data.txHash } }));
      }
    } catch (err: any) {
      setPaymentStatus({ status: 'error', message: err.response?.data?.message || 'Failed to check payment' });
    } finally {
      setChecking(false);
    }
  }, [result]);

  // Auto-poll for payment every 30 seconds
  useEffect(() => {
    if (!result?.deposit?.id || result.deposit.status === 'approved' || result.deposit.status === 'expired') return;
    const interval = setInterval(() => {
      checkPayment();
    }, 30000);
    return () => clearInterval(interval);
  }, [result, checkPayment]);

  const copyAddress = () => {
    if (result?.address) {
      navigator.clipboard.writeText(result.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const uniqueAmount = result ? Number(result.uniqueAmount ?? result.amount) : 0;
  const qrData = result ? encodeURIComponent(result.address) : '';

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Deposit Funds</h1>
        <p className="text-white/50">Fund your account with USDT (TRC20) — credited automatically</p>
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
              <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
                <p className="font-medium text-white">USDT</p>
                <p className="text-xs text-white/50">Tron Network (TRC20) — the only supported deposit method</p>
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
                  'Generate Deposit Address'
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
                <h3 className="font-semibold text-white">Deposit Created</h3>
                <p className="text-xs text-white/50">Send the exact amount below to the address</p>
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
              {result.expiresAt && result.deposit.status === 'pending' && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-white/50">Expires in</span>
                  <Countdown expiresAt={result.expiresAt} />
                </div>
              )}
            </div>

            {/* QR code */}
            <div className="flex justify-center">
              <div className="rounded-xl bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`}
                  alt="USDT TRC20 deposit address QR code"
                  width={200}
                  height={200}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-white/50">Send USDT (TRC20) to this address:</p>
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
                <p className="mt-1 text-xl font-bold text-white">{uniqueAmount.toFixed(2)} USDT</p>
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
                  ) : result.deposit.status === 'expired' ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <span className="font-medium text-red-400">Expired</span>
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
                  : paymentStatus.status === 'error' || paymentStatus.status === 'expired'
                  ? 'border-red-500/20 bg-red-500/10 text-red-300'
                  : 'border-blue-500/20 bg-blue-500/10 text-blue-300'
              }`}>
                <div className="flex items-start gap-2">
                  {paymentStatus.status === 'approved' ? (
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : paymentStatus.status === 'error' || paymentStatus.status === 'expired' ? (
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Wifi className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p>{paymentStatus.message}</p>
                    {paymentStatus.txHash && (
                      <a
                        href={`https://tronscan.org/#/transaction/${paymentStatus.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 font-mono text-xs underline opacity-80 hover:opacity-100"
                      >
                        View on Tronscan <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-yellow-300/80">
              <p className="mb-1"><strong>Important:</strong> Send exactly <span className="font-mono font-bold">{uniqueAmount.toFixed(2)} USDT</span> over the <strong>TRC20</strong> network.</p>
              <p>The unique amount identifies your deposit. Your balance is credited automatically once the transaction confirms. This request expires after 24 hours.</p>
            </div>

            <div className="flex gap-3">
              {result.deposit.status === 'pending' && (
                <button
                  onClick={checkPayment}
                  disabled={checking}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-navy-600 bg-navy-800 py-3 text-sm font-bold text-white transition hover:bg-navy-700 disabled:opacity-50"
                >
                  {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {checking ? 'Checking...' : 'Check Payment Status'}
                </button>
              )}
              <button onClick={() => { setResult(null); setPaymentStatus(null); }} className="btn-outline flex-1">
                {result.deposit.status === 'pending' ? 'Cancel' : 'New Deposit'}
              </button>
            </div>

            {result.deposit.status === 'pending' && (
              <p className="text-center text-xs text-white/30">
                Auto-checking for your payment every 30 seconds
              </p>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
