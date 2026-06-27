'use client';

import { useEffect, useState } from 'react';
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
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">MT5 Credentials</h1>
        <p className="text-white/50">Your MetaTrader 5 login details</p>
      </div>

      <div className="max-w-2xl">
        {account ? (
          <div className="card animate-slide-up space-y-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
                <Monitor className="h-5 w-5 text-gold" />
              </div>
              <div>
                <h3 className="font-semibold text-white">MT5 Account Active</h3>
                <p className="text-xs text-white/50">Use these credentials to log in to MetaTrader 5</p>
              </div>
            </div>
            {[
              { label: 'Login', value: account.mt5Login, icon: User },
              { label: 'Password', value: account.mt5Password, icon: Key },
              { label: 'Server', value: account.server, icon: Server },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center justify-between rounded-lg bg-navy-900/50 p-4">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-white/40" />
                    <div>
                      <p className="text-xs text-white/50">{item.label}</p>
                      <p className="font-mono text-white">{item.value}</p>
                    </div>
                  </div>
                  <button onClick={() => copy(item.value, item.label)} className="rounded-lg p-2 text-white/60 hover:bg-navy-700 hover:text-white">
                    {copied === item.label ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card animate-slide-up text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-800">
              <Monitor className="h-8 w-8 text-white/30" />
            </div>
            <h3 className="text-lg font-semibold text-white">No MT5 Account</h3>
            <p className="mt-2 text-sm text-white/50">Complete KYC verification to receive your MT5 account credentials.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
