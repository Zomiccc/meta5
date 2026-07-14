'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import DashboardShell from '../../../components/DashboardShell';
import { ArrowDownCircle, Copy, Loader2, CheckCircle, Clock, RefreshCw, AlertCircle, Wifi, ExternalLink, Zap, History } from 'lucide-react';

function Countdown({ expiresAt }: { expiresAt: string | number | Date }) {
  const [remaining, setRemaining] = useState(() => new Date(expiresAt).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(new Date(expiresAt).getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (remaining <= 0) return <span className="font-mono font-bold text-bnRed">Expired</span>;
  const totalSec = Math.floor(remaining / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return <span className="font-mono font-bold text-yellow">{pad(h)}:{pad(m)}:{pad(s)}</span>;
}

export default function DepositPage() {
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<{ status: string; message: string; txHash?: string } | null>(null);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const fetchDeposits = useCallback(async () => {
    try {
      const res = await api.get('/deposits');
      setDeposits(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchDeposits(); }, [fetchDeposits]);

  const testDeposit = async () => {
    setTesting(true);
    try {
      await api.post('/deposits/test', { amount: 1000 });
      await fetchDeposits();
      setError('');
      setPaymentStatus({ status: 'approved', message: 'Test deposit of $1,000 approved! Your balance has been updated.' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Test deposit failed');
    } finally {
      setTesting(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-bnText-primary">Deposit Funds</h1>
        <p className="text-bnText-secondary">Fund your account with USDT (TRC20) — credited automatically</p>
      </div>

      <div className="mx-auto w-full max-w-lg">
        {!result ? (
          <div className="bn-card animate-slide-up">
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-bnText-secondary">Amount (USD)</label>
                <input
                  type="number"
                  min="10"
                  required
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bn-input"
                />
                <p className="mt-1 text-xs text-bnText-muted">Minimum deposit: $10</p>
              </div>
              <div className="rounded-bn border border-yellow/20 bg-yellow/5 p-4">
                <p className="font-medium text-bnText-primary">USDT</p>
                <p className="text-xs text-bnText-secondary">Tron Network (TRC20) — the only supported deposit method</p>
              </div>
              {error && (
                <div className="rounded-bn border border-bnRed/20 bg-bnRed/10 px-4 py-3 text-sm text-bnRed">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="bn-btn-primary w-full">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                  </span>
                ) : (
                  'Generate Deposit Address'
                )}
              </button>
            </form>

            <div className="mt-4 border-t border-bn-border pt-4">
              <button
                onClick={testDeposit}
                disabled={testing}
                className="flex w-full items-center justify-center gap-2 rounded-bn border border-yellow/30 bg-yellow/10 px-4 py-2.5 text-sm font-bold text-yellow transition hover:bg-yellow/20 disabled:opacity-50"
              >
                <Zap className="h-4 w-4" />
                {testing ? 'Processing...' : 'Test Deposit $1,000 (Instant)'}
              </button>
              <p className="mt-1.5 text-center text-xs text-bnText-muted">For testing only — instantly credits your account</p>
            </div>
          </div>
        ) : (
          <div className="bn-card animate-slide-up space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-bn bg-yellow/10">
                <ArrowDownCircle className="h-5 w-5 text-yellow" />
              </div>
              <div>
                <h3 className="font-semibold text-bnText-primary">Deposit Created</h3>
                <p className="text-xs text-bnText-secondary">Send the exact amount below to the address</p>
              </div>
            </div>

            <div className="rounded-bn border border-yellow/20 bg-yellow/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-bnText-secondary">Payment ID</span>
                <span className="font-mono text-sm font-medium text-yellow">{result.paymentId}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-bnText-secondary">Network</span>
                <span className="text-sm font-medium text-bnText-primary">{result.network}</span>
              </div>
              {result.expiresAt && result.deposit.status === 'pending' && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-bnText-secondary">Expires in</span>
                  <Countdown expiresAt={result.expiresAt} />
                </div>
              )}
            </div>

            {/* QR code */}
            <div className="flex justify-center">
              <div className="w-fit max-w-full rounded-bn bg-white p-3">
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
              <p className="mb-2 text-sm text-bnText-secondary">Send USDT (TRC20) to this address:</p>
              <div className="flex items-center gap-2 rounded-bn border border-bn-border bg-bn-card p-3">
                <p className="min-w-0 flex-1 break-all font-mono text-sm text-yellow">{result.address}</p>
                <button onClick={copyAddress} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-bn text-bnText-secondary hover:bg-bn-border hover:text-bnText-primary" aria-label="Copy deposit address">
                  {copied ? <CheckCircle className="h-4 w-4 text-bnGreen" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-bn bg-bn-card p-4">
                <p className="text-xs text-bnText-secondary">Exact Amount to Send</p>
                <p className="mt-1 text-xl font-bold text-bnText-primary">{uniqueAmount.toFixed(2)} USDT</p>
                <p className="mt-0.5 text-xs text-yellow/60">Unique amount identifies your deposit</p>
              </div>
              <div className="rounded-bn bg-bn-card p-4">
                <p className="text-xs text-bnText-secondary">Status</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {result.deposit.status === 'approved' ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-bnGreen" />
                      <span className="font-medium text-bnGreen">Confirmed</span>
                    </>
                  ) : result.deposit.status === 'expired' ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-bnRed" />
                      <span className="font-medium text-bnRed">Expired</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-yellow" />
                      <span className="font-medium capitalize text-yellow">{result.deposit.status}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Payment verification status */}
            {paymentStatus && (
              <div className={`rounded-bn border p-4 text-sm ${
                paymentStatus.status === 'approved'
                  ? 'border-bnGreen/20 bg-bnGreen/10 text-bnGreen'
                  : paymentStatus.status === 'error' || paymentStatus.status === 'expired'
                  ? 'border-bnRed/20 bg-bnRed/10 text-bnRed'
                  : 'border-yellow/20 bg-yellow/10 text-yellow'
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

            <div className="rounded-bn border border-yellow/20 bg-yellow-500/5 p-3 text-xs text-yellow-300/80">
              <p className="mb-1"><strong>Important:</strong> Send exactly <span className="font-mono font-bold">{uniqueAmount.toFixed(2)} USDT</span> over the <strong>TRC20</strong> network.</p>
              <p>The unique amount identifies your deposit. Your balance is credited automatically once the transaction confirms. This request expires after 24 hours.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {result.deposit.status === 'pending' && (
                <button
                  onClick={checkPayment}
                  disabled={checking}
                  className="flex flex-1 items-center justify-center gap-2 rounded-bn border border-bn-border bg-bn-input py-3 text-sm font-bold text-bnText-primary transition hover:bg-bn-border disabled:opacity-50"
                >
                  {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {checking ? 'Checking...' : 'Check Payment Status'}
                </button>
              )}
              <button onClick={() => { setResult(null); setPaymentStatus(null); }} className="bn-btn-secondary flex-1">
                {result.deposit.status === 'pending' ? 'Cancel' : 'New Deposit'}
              </button>
            </div>

            {result.deposit.status === 'pending' && (
              <p className="text-center text-xs text-bnText-muted">
                Auto-checking for your payment every 30 seconds
              </p>
            )}
          </div>
        )}
      </div>

      {deposits.length > 0 && (
        <div className="mx-auto mt-8 w-full max-w-lg">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-bnText-muted" />
            <h3 className="text-sm font-semibold text-bnText-primary">Deposit History</h3>
          </div>
          <div className="space-y-2">
            {deposits.slice(0, 10).map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-bn border border-bn-border bg-bn-card p-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-bnText-primary">${Number(d.amount).toFixed(2)}</span>
                  <span className="text-xs text-bnText-muted">{new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  d.status === 'approved' ? 'bg-bnGreen/10 text-bnGreen' :
                  d.status === 'pending' ? 'bg-yellow/10 text-yellow' :
                  d.status === 'expired' ? 'bg-bnText-muted/10 text-bnText-muted' :
                  'bg-bnRed/10 text-bnRed'
                }`}>
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
