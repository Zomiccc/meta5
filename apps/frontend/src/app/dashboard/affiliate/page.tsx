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
          <Loader2 className="h-8 w-8 animate-spin text-yellow" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-bnText-primary">Affiliate Program</h1>
        <p className="text-bnText-secondary">Earn commissions by referring traders</p>
      </div>

      <div className="max-w-3xl">
        {affiliate ? (
          <div className="space-y-6">
            <div className="rounded-bn border border-yellow/30 bg-gradient-to-br from-yellow/10 to-transparent p-6">
              <p className="text-sm font-medium text-yellow">Lifetime commission</p>
              <p className="mt-1 text-4xl font-extrabold text-bnText-primary">3%</p>
              <p className="mt-2 text-sm text-bnText-secondary">
                Earn <span className="font-semibold text-bnText-primary">3% of every deposit</span> your referrals make — automatically credited to your commission balance, for life.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bn-card animate-slide-up">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-bn bg-yellow/10">
                  <Users className="h-5 w-5 text-yellow" />
                </div>
                <p className="text-sm text-bnText-secondary">Total Referred</p>
                <p className="mt-1 text-3xl font-bold text-bnText-primary">{affiliate.totalReferred}</p>
              </div>
              <div className="bn-card animate-slide-up" style={{ animationDelay: '50ms' }}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-bn bg-yellow/10">
                  <DollarSign className="h-5 w-5 text-yellow" />
                </div>
                <p className="text-sm text-bnText-secondary">Total Commission</p>
                <p className="mt-1 text-3xl font-bold text-bnText-primary">${Number(affiliate.totalCommission || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="bn-card animate-slide-up">
              <div className="mb-3 flex items-center gap-2">
                <Link2 className="h-4 w-4 text-yellow" />
                <p className="text-sm font-medium text-bnText-secondary">Your referral link</p>
              </div>
              <div className="flex items-center gap-2 rounded-bn border border-bn-border bg-bn-card p-3">
                <p className="flex-1 truncate text-sm text-yellow">{referralLink}</p>
                <button onClick={copyLink} className="rounded-bn p-2 text-bnText-secondary hover:bg-bn-border hover:text-bnText-primary">
                  {copied ? <CheckCircle className="h-4 w-4 text-bnGreen" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-3 text-xs text-bnText-muted">Share this link with friends. You earn commission on their trading activity.</p>
            </div>
          </div>
        ) : (
          <div className="bn-card animate-slide-up text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-bn bg-bn-input">
              <Link2 className="h-8 w-8 text-bnText-muted" />
            </div>
            <h3 className="text-lg font-semibold text-bnText-primary">Affiliate Not Available</h3>
            <p className="mt-2 text-sm text-bnText-secondary">Affiliate data not found. Please contact support.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
