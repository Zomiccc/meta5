'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import DashboardShell from '../../../components/DashboardShell';
import { ArrowDownCircle, Copy, Loader2, CheckCircle, Clock, RefreshCw, AlertCircle, Wifi, ExternalLink, History, ChevronDown, Wallet, Shield, Link2 } from 'lucide-react';

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
  const fetchDeposits = useCallback(async () => {
    try {
      const res = await api.get('/deposits');
      setDeposits(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchDeposits(); }, [fetchDeposits]);

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

  const statusColor = (s: string) =>
    s === 'approved' ? 'text-bnGreen' : s === 'pending' ? 'text-yellow' : s === 'expired' ? 'text-bnText-muted' : 'text-bnRed';
  const statusBg = (s: string) =>
    s === 'approved' ? 'bg-bnGreen/10' : s === 'pending' ? 'bg-yellow/10' : s === 'expired' ? 'bg-bnText-muted/10' : 'bg-bnRed/10';

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bnGreen/10">
            <ArrowDownCircle className="h-5 w-5 text-bnGreen" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-bnText-primary">Deposit</h1>
            <p className="text-xs text-bnText-secondary">Fund your account with USDT via TRC20</p>
          </div>
        </div>

        {!result ? (
          <div className="animate-slide-up space-y-4">
            {/* Asset selector card */}
            <div className="rounded-bn border border-bn-border bg-bn-card p-4">
              <label className="mb-2 block text-xs font-medium text-bnText-secondary">Asset</label>
              <div className="flex items-center justify-between rounded-bn border border-bn-border bg-bn-input px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bnGreen/20 text-sm font-bold text-bnGreen">₸</div>
                  <div>
                    <div className="text-sm font-bold text-bnText-primary">USDT</div>
                    <div className="text-xs text-bnText-muted">Tether USD</div>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-bnText-muted" />
              </div>
            </div>

            {/* Network selector */}
            <div className="rounded-bn border border-bn-border bg-bn-card p-4">
              <label className="mb-2 block text-xs font-medium text-bnText-secondary">Network</label>
              <div className="flex items-center justify-between rounded-bn border border-yellow/30 bg-yellow/5 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-sm font-bold text-red-400">T</div>
                  <div>
                    <div className="text-sm font-bold text-bnText-primary">TRC20</div>
                    <div className="text-xs text-bnText-muted">Tron Network · Fee: ~1 USDT</div>
                  </div>
                </div>
                <span className="rounded-full bg-bnGreen/10 px-2 py-0.5 text-[10px] font-bold text-bnGreen">RECOMMENDED</span>
              </div>
              <div className="mt-2 flex items-start gap-1.5 rounded-bn bg-bn-input/50 p-2.5 text-xs text-bnText-muted">
                <Shield className="mt-0.5 h-3 w-3 shrink-0" />
                <span>Only send USDT via TRC20 network. Sending via other networks may result in permanent loss.</span>
              </div>
            </div>

            {/* Amount input */}
            <div className="rounded-bn border border-bn-border bg-bn-card p-4">
              <label className="mb-2 block text-xs font-medium text-bnText-secondary">Amount (USD)</label>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  required
                  placeholder="Enter amount (min $10)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-bn border border-bn-border bg-bn-input px-4 py-3 text-lg font-bold text-bnText-primary placeholder:text-bnText-muted focus:border-yellow focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-bnText-muted">USD</span>
              </div>
              <div className="mt-2 flex gap-2">
                {['50', '100', '500', '1000'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    className="flex-1 rounded-md bg-bn-input py-1.5 text-xs font-medium text-bnText-secondary transition hover:bg-bn-border hover:text-bnText-primary"
                  >
                    ${v}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-bn border border-bnRed/20 bg-bnRed/10 px-4 py-3 text-sm text-bnRed">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {paymentStatus?.status === 'approved' && (
              <div className="flex items-center gap-2 rounded-bn border border-bnGreen/20 bg-bnGreen/10 px-4 py-3 text-sm text-bnGreen">
                <CheckCircle className="h-4 w-4 shrink-0" /> {paymentStatus.message}
              </div>
            )}

            {/* Submit button */}
            <button
              type="button"
              onClick={submit as any}
              disabled={loading || !amount}
              className="flex w-full items-center justify-center gap-2 rounded-bn bg-yellow py-3.5 text-sm font-bold text-bn-bg transition hover:bg-yellow-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              {loading ? 'Generating...' : 'Get Deposit Address'}
            </button>

          </div>
        ) : (
          <div className="animate-slide-up space-y-4">
            {/* Deposit confirmed card */}
            <div className="rounded-bn border border-bn-border bg-bn-card overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center justify-between border-b border-bn-border bg-bn-secondary px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-bnGreen/20 text-xs font-bold text-bnGreen">₸</div>
                  <span className="text-sm font-bold text-bnText-primary">USDT</span>
                  <span className="rounded bg-bn-input px-1.5 py-0.5 text-[10px] text-bnText-muted">TRC20</span>
                </div>
                <div className="flex items-center gap-2">
                  {result.deposit.status === 'approved' ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-bnGreen"><CheckCircle className="h-3.5 w-3.5" /> Confirmed</span>
                  ) : result.deposit.status === 'expired' ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-bnRed"><AlertCircle className="h-3.5 w-3.5" /> Expired</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-yellow"><Clock className="h-3.5 w-3.5" /> Pending</span>
                  )}
                </div>
              </div>

              {/* QR + Address section */}
              <div className="p-5">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
                  {/* QR */}
                  <div className="shrink-0 rounded-bn bg-white p-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}`}
                      alt="Deposit QR"
                      width={180}
                      height={180}
                      className="h-[140px] w-[140px] sm:h-[180px] sm:w-[180px]"
                    />
                  </div>

                  {/* Address + details */}
                  <div className="w-full min-w-0 flex-1 space-y-3">
                    <div>
                      <p className="mb-1 text-xs text-bnText-secondary">Deposit Address</p>
                      <div className="flex items-center gap-2 rounded-bn border border-bn-border bg-bn-input p-3">
                        <p className="min-w-0 flex-1 break-all font-mono text-xs text-yellow sm:text-sm">{result.address}</p>
                        <button onClick={copyAddress} className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-bnText-secondary transition hover:bg-bn-border hover:text-bnText-primary" aria-label="Copy">
                          {copied ? <CheckCircle className="h-4 w-4 text-bnGreen" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-bn bg-bn-input/50 p-2.5">
                        <p className="text-[10px] text-bnText-muted">Amount</p>
                        <p className="mt-0.5 text-sm font-bold text-bnText-primary">{uniqueAmount.toFixed(2)} <span className="text-xs text-bnText-secondary">USDT</span></p>
                      </div>
                      <div className="rounded-bn bg-bn-input/50 p-2.5">
                        <p className="text-[10px] text-bnText-muted">Network</p>
                        <p className="mt-0.5 text-sm font-bold text-bnText-primary">TRC20</p>
                      </div>
                      <div className="rounded-bn bg-bn-input/50 p-2.5">
                        <p className="text-[10px] text-bnText-muted">Payment ID</p>
                        <p className="mt-0.5 font-mono text-xs font-medium text-yellow">{result.paymentId}</p>
                      </div>
                      <div className="rounded-bn bg-bn-input/50 p-2.5">
                        <p className="text-[10px] text-bnText-muted">Expires In</p>
                        <p className="mt-0.5">
                          {result.expiresAt && result.deposit.status === 'pending' ? <Countdown expiresAt={result.expiresAt} /> : <span className="text-xs text-bnText-muted">—</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning box */}
                <div className="mt-4 flex items-start gap-2 rounded-bn border border-yellow/20 bg-yellow/5 p-3 text-xs text-bnText-secondary">
                  <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow" />
                  <div>
                    <p className="font-medium text-yellow">Important: Send exactly {uniqueAmount.toFixed(2)} USDT via TRC20</p>
                    <p className="mt-0.5">The unique amount identifies your deposit. Balance is credited automatically after confirmation. Expires in 24 hours.</p>
                  </div>
                </div>

                {/* Payment status */}
                {paymentStatus && (
                  <div className={`mt-3 flex items-start gap-2 rounded-bn border p-3 text-xs ${
                    paymentStatus.status === 'approved' ? 'border-bnGreen/20 bg-bnGreen/10 text-bnGreen' :
                    paymentStatus.status === 'error' || paymentStatus.status === 'expired' ? 'border-bnRed/20 bg-bnRed/10 text-bnRed' :
                    'border-yellow/20 bg-yellow/10 text-yellow'
                  }`}>
                    {paymentStatus.status === 'approved' ? <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> :
                     paymentStatus.status === 'error' || paymentStatus.status === 'expired' ? <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> :
                     <Wifi className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                    <div>
                      <p>{paymentStatus.message}</p>
                      {paymentStatus.txHash && (
                        <a href={`https://tronscan.org/#/transaction/${paymentStatus.txHash}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] underline opacity-80 hover:opacity-100">
                          View on Tronscan <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action bar */}
              <div className="flex gap-2 border-t border-bn-border bg-bn-secondary px-4 py-3">
                {result.deposit.status === 'pending' && (
                  <button
                    onClick={checkPayment}
                    disabled={checking}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-bn bg-bn-input py-2.5 text-xs font-bold text-bnText-primary transition hover:bg-bn-border disabled:opacity-50"
                  >
                    {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    {checking ? 'Checking...' : 'Check Status'}
                  </button>
                )}
                <button
                  onClick={() => { setResult(null); setPaymentStatus(null); }}
                  className="flex-1 rounded-bn bg-yellow py-2.5 text-xs font-bold text-bn-bg transition hover:bg-yellow-hover"
                >
                  {result.deposit.status === 'pending' ? 'New Deposit' : 'Done'}
                </button>
              </div>
            </div>

            {result.deposit.status === 'pending' && (
              <p className="text-center text-[10px] text-bnText-muted">Auto-checking payment every 30 seconds</p>
            )}
          </div>
        )}

        {/* Deposit history */}
        {deposits.length > 0 && (
          <div className="mt-6">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-bnText-muted" />
                <h3 className="text-sm font-semibold text-bnText-primary">Recent Deposits</h3>
              </div>
              <span className="text-xs text-bnText-muted">{deposits.length} total</span>
            </div>
            <div className="overflow-x-auto rounded-bn border border-bn-border">
              <table className="w-full min-w-[300px] text-left text-sm">
                <thead className="bg-bn-secondary text-xs text-bnText-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.slice(0, 8).map((d) => (
                    <tr key={d.id} className="border-t border-bn-border">
                      <td className="px-3 py-2.5 font-bold text-bnText-primary">${Number(d.amount).toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-xs text-bnText-secondary">{new Date(d.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBg(d.status)} ${statusColor(d.status)}`}>{d.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
