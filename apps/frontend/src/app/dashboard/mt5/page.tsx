'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../../lib/api';
import DashboardShell from '../../../components/DashboardShell';
import { Copy, Monitor, CheckCircle, Loader2, Server, Key, User } from 'lucide-react';

export default function Mt5Page() {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    api.get('/mt5/account').then((res) => setAccount(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-yellow" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-bnText-primary">MT5 Credentials</h1>
        <p className="text-bnText-secondary">Your MetaTrader 5 login details</p>
      </motion.div>

      <div className="max-w-2xl">
        {account ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-bn-lg border border-bn-border bg-bn-card p-6 shadow-card space-y-4"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-bn bg-yellow/10">
                <Monitor className="h-5 w-5 text-yellow" />
              </div>
              <div>
                <h3 className="font-semibold text-bnText-primary">MT5 Account Active</h3>
                <p className="text-xs text-bnText-secondary">Use these credentials to log in to MetaTrader 5</p>
              </div>
            </div>
            {[
              { label: 'Login', value: account.mt5Login, icon: User },
              { label: 'Password', value: account.mt5Password, icon: Key },
              { label: 'Server', value: account.server, icon: Server },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center justify-between rounded-bn bg-bn-card p-4">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-bnText-muted" />
                    <div>
                      <p className="text-xs text-bnText-secondary">{item.label}</p>
                      <p className="font-mono text-bnText-primary">{item.value}</p>
                    </div>
                  </div>
                  <button onClick={() => copy(item.value, item.label)} className="rounded-bn p-2 text-bnText-secondary hover:bg-bn-border hover:text-bnText-primary">
                    {copied === item.label ? <CheckCircle className="h-4 w-4 text-bnGreen" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-bn-lg border border-bn-border bg-bn-card p-6 text-center shadow-card"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-bn bg-bn-input">
              <Monitor className="h-8 w-8 text-bnText-muted" />
            </div>
            <h3 className="text-lg font-semibold text-bnText-primary">No MT5 Account</h3>
            <p className="mt-2 text-sm text-bnText-secondary">Complete KYC verification to receive your MT5 account credentials.</p>
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
