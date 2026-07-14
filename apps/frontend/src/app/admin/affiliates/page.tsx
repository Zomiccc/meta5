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
      <h1 className="mb-6 text-2xl font-bold text-white">Affiliates</h1>
      <div className="overflow-x-auto rounded border border-navy-700 bg-navy-800">
        <table className="min-w-[560px] w-full text-left text-sm">
          <thead className="border-b border-navy-600 text-white/60">
            <tr>
              <th className="px-4 py-3">Referral Code</th>
              <th className="px-4 py-3">Total Referred</th>
              <th className="px-4 py-3">Total Commission</th>
            </tr>
          </thead>
          <tbody>
            {affiliates.map((a) => (
              <tr key={a.id} className="border-b border-navy-700">
                <td className="px-4 py-3 text-gold">{a.referralCode}</td>
                <td className="px-4 py-3 text-white">{a.totalReferred}</td>
                <td className="px-4 py-3 text-white">${Number(a.totalCommission).toFixed(2)}</td>
              </tr>
            ))}
            {affiliates.length === 0 && <tr><td colSpan={3} className="px-4 py-4 text-white/50">No affiliates</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
