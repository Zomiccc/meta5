'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import AdminShell from '../../../components/AdminShell';

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<any[]>([]);

  useEffect(() => {
    api.get('/admin/clients').then((res) => {
      setAffiliates(res.data.filter((c: any) => c.affiliate).map((c: any) => c.affiliate));
    });
  }, []);

  return (
    <AdminShell>
      <h1 className="mb-6 text-2xl font-bold text-bnText-primary">Affiliates</h1>
      <div className="overflow-x-auto rounded border border-bn-border bg-bn-input">
        <table className="min-w-[560px] w-full text-left text-sm">
          <thead className="border-b border-bn-border text-bnText-secondary">
            <tr>
              <th className="px-4 py-3">Referral Code</th>
              <th className="px-4 py-3">Total Referred</th>
              <th className="px-4 py-3">Total Commission</th>
            </tr>
          </thead>
          <tbody>
            {affiliates.map((a) => (
              <tr key={a.id} className="border-b border-bn-border">
                <td className="px-4 py-3 text-yellow">{a.referralCode}</td>
                <td className="px-4 py-3 text-bnText-primary">{a.totalReferred}</td>
                <td className="px-4 py-3 text-bnText-primary">${Number(a.totalCommission).toFixed(2)}</td>
              </tr>
            ))}
            {affiliates.length === 0 && <tr><td colSpan={3} className="px-4 py-4 text-bnText-secondary">No affiliates</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
