'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-bnText-primary">Affiliates</h1>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-x-auto rounded-bn-lg border border-bn-border bg-bn-card shadow-card"
      >
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
                <td className="px-4 py-3 tnum text-bnText-primary">{a.totalReferred}</td>
                <td className="px-4 py-3 tnum text-bnText-primary">${Number(a.totalCommission).toFixed(2)}</td>
              </tr>
            ))}
            {affiliates.length === 0 && <tr><td colSpan={3} className="px-4 py-4 text-bnText-secondary">No affiliates</td></tr>}
          </tbody>
        </table>
      </motion.div>
    </AdminShell>
  );
}
