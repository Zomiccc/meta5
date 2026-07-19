'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../../lib/api';
import DashboardShell from '../../../components/DashboardShell';
import { ArrowUpCircle, Loader2, CheckCircle, History, ChevronDown, Shield, AlertCircle, Wallet, Clipboard } from 'lucide-react';

export default function WithdrawPage() {
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  const [account, setAccount] = useState<any>(null);

  const fetchWithdrawals = useCallback(async () => {
    try {
      const res = await api.get('/withdrawals');
      setWithdrawals(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchWithdrawals();
    api.get('/mt5/account').then((res) => setAccount(res.data)).catch(() => {});
  }, [fetchWithdrawals]);

  const balance = Number(account?.balance ?? 0);

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

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setWalletAddress(text.trim());
    } catch {}
  };

  const statusColor = (s: string) =>
    s === 'approved' ? 'text-bnGreen' : s === 'pending' ? 'text-yellow' : 'text-bnRed';
  const statusBg = (s: string) =>
    s === 'approved' ? 'bg-bnGreen/10' : s === 'pending' ? 'bg-yellow/10' : 'bg-bnRed/10';

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-5 flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bnRed/10">
            <ArrowUpCircle className="h-5 w-5 text-bnRed" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-bnText-primary">Withdraw</h1>
            <p className="text-xs text-bnText-secondary">Withdraw USDT to your personal TRC20 wallet</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4">
          {/* Balance card */}
          <div className="flex items-center justify-between rounded-bn-lg border border-bn-border bg-bn-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bnGreen/20 text-sm font-bold text-bnGreen">₸</div>
              <div>
                <div className="text-xs text-bnText-muted">Available Balance</div>
                <div className="text-lg font-bold tnum text-bnText-primary">${balance.toFixed(2)} <span className="text-xs font-normal text-bnText-secondary">USDT</span></div>
              </div>
            </div>
            <button
              onClick={() => setAmount(String(balance.toFixed(2)))}
              className="rounded-bn bg-bn-input px-3 py-1.5 text-xs font-bold text-yellow transition hover:bg-bn-border"
            >
              Max
            </button>
          </div>

          {/* Asset selector */}
          <div className="rounded-bn-lg border border-bn-border bg-bn-card p-4 shadow-card">
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
          <div className="rounded-bn-lg border border-bn-border bg-bn-card p-4 shadow-card">
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
          </div>

          {/* Withdraw form */}
          <form onSubmit={submit} className="space-y-4">
            {/* Address input */}
            <div className="rounded-bn-lg border border-bn-border bg-bn-card p-4 shadow-card">
              <label className="mb-2 block text-xs font-medium text-bnText-secondary">USDT Wallet Address (TRC20)</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Enter your USDT TRC20 wallet address (starts with T)"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full rounded-bn border border-bn-border bg-bn-input px-4 py-3 pr-12 text-sm font-mono text-bnText-primary placeholder:text-bnText-muted placeholder:font-sans focus:border-yellow focus:outline-none"
                />
                <button
                  type="button"
                  onClick={pasteFromClipboard}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-bnText-secondary transition hover:bg-bn-border hover:text-bnText-primary"
                  aria-label="Paste"
                >
                  <Clipboard className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 flex items-start gap-1.5 text-xs text-bnText-muted">
                <Shield className="mt-0.5 h-3 w-3 shrink-0" />
                <span>Double-check the address. Transfers on wrong network are irreversible.</span>
              </div>
            </div>

            {/* Amount input */}
            <div className="rounded-bn-lg border border-bn-border bg-bn-card p-4 shadow-card">
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

            {/* Fee info */}
            <div className="flex items-center justify-between rounded-bn bg-bn-input/50 px-4 py-3 text-xs">
              <span className="text-bnText-muted">Network Fee</span>
              <span className="font-medium tnum text-bnText-secondary">~1.00 USDT</span>
            </div>

            {/* Message */}
            {message && (
              <div className={`flex items-center gap-2 rounded-bn border px-4 py-3 text-sm ${
                success ? 'border-bnGreen/20 bg-bnGreen/10 text-bnGreen' : 'border-bnRed/20 bg-bnRed/10 text-bnRed'
              }`}>
                {success ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !amount || !walletAddress}
              className="flex w-full items-center justify-center gap-2 rounded-bn bg-yellow py-3.5 text-sm font-bold text-black transition-all duration-200 hover:bg-yellow-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 shadow-glow-yellow"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className="h-4 w-4" />}
              {loading ? 'Submitting...' : 'Submit Withdrawal'}
            </button>
          </form>
        </motion.div>

        {/* Withdrawal history */}
        {withdrawals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6"
          >
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-bnText-muted" />
                <h3 className="text-sm font-semibold text-bnText-primary">Recent Withdrawals</h3>
              </div>
              <span className="text-xs text-bnText-muted">{withdrawals.length} total</span>
            </div>
            <div className="overflow-x-auto rounded-bn-lg border border-bn-border shadow-card">
              <table className="w-full min-w-[400px] text-left text-sm">
                <thead className="bg-bn-secondary text-xs text-bnText-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Address</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.slice(0, 8).map((w) => (
                    <tr key={w.id} className="border-t border-bn-border">
                      <td className="px-3 py-2.5 font-bold tnum text-bnText-primary">${Number(w.amount).toFixed(2)}</td>
                      <td className="max-w-[120px] truncate px-3 py-2.5 font-mono text-xs text-bnText-secondary">{w.walletAddress || '—'}</td>
                      <td className="px-3 py-2.5 text-xs text-bnText-secondary">{new Date(w.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBg(w.status)} ${statusColor(w.status)}`}>{w.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
