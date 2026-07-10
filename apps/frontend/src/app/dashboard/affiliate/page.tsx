'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import DashboardShell from '../../../components/DashboardShell';
import { Copy, CheckCircle, Link2, Users, DollarSign, Loader2 } from 'lucide-react';

export default function AffiliatePage() {
  const [affiliate, setAffiliate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    api.get('/affiliate').then((res) => setAffiliate(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const referralLink = affiliate ? `${baseUrl}/register?ref=${affiliate.referralCode}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <h1 className="text-2xl font-bold text-white">Affiliate Program</h1>
        <p className="text-white/50">Earn commissions by referring traders</p>
      </div>

      <div className="max-w-3xl">
        {affiliate ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent p-6">
              <p className="text-sm font-medium text-gold-light">Lifetime commission</p>
              <p className="mt-1 text-4xl font-extrabold text-white">3%</p>
              <p className="mt-2 text-sm text-white/60">
                Earn <span className="font-semibold text-white">3% of every deposit</span> your referrals make — automatically credited to your commission balance, for life.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card animate-slide-up">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
                  <Users className="h-5 w-5 text-gold" />
                </div>
                <p className="text-sm text-white/50">Total Referred</p>
                <p className="mt-1 text-3xl font-bold text-white">{affiliate.totalReferred}</p>
              </div>
              <div className="card animate-slide-up" style={{ animationDelay: '50ms' }}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
                  <DollarSign className="h-5 w-5 text-gold" />
                </div>
                <p className="text-sm text-white/50">Total Commission</p>
                <p className="mt-1 text-3xl font-bold text-white">${Number(affiliate.totalCommission || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="card animate-slide-up">
              <div className="mb-3 flex items-center gap-2">
                <Link2 className="h-4 w-4 text-gold" />
                <p className="text-sm font-medium text-white/70">Your referral link</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-navy-600 bg-navy-900/50 p-3">
                <p className="flex-1 truncate text-sm text-gold">{referralLink}</p>
                <button onClick={copyLink} className="rounded-lg p-2 text-white/60 hover:bg-navy-700 hover:text-white">
                  {copied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-3 text-xs text-white/40">Share this link with friends. You earn commission on their trading activity.</p>
            </div>
          </div>
        ) : (
          <div className="card animate-slide-up text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-800">
              <Link2 className="h-8 w-8 text-white/30" />
            </div>
            <h3 className="text-lg font-semibold text-white">Affiliate Not Available</h3>
            <p className="mt-2 text-sm text-white/50">Affiliate data not found. Please contact support.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
