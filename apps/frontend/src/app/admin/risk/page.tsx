'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import AdminShell from '../../../components/AdminShell';

export default function AdminRiskPage() {
  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    api.get('/risk/open-trades').then((res) => setTrades(res.data));
  }, []);

  return (
    <AdminShell>
      <h1 className="mb-6 text-2xl font-bold text-white">Risk Monitoring</h1>
      <div className="overflow-x-auto rounded border border-navy-700 bg-navy-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-navy-600 text-white/60">
            <tr>
              <th className="px-4 py-3">MT5 Login</th>
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Volume</th>
              <th className="px-4 py-3">Open Price</th>
              <th className="px-4 py-3">Current Price</th>
              <th className="px-4 py-3">Profit</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-b border-navy-700">
                <td className="px-4 py-3 text-white">{t.mt5Login}</td>
                <td className="px-4 py-3 text-white">{t.symbol}</td>
                <td className="px-4 py-3 text-white">{t.type}</td>
                <td className="px-4 py-3 text-white">{t.volume}</td>
                <td className="px-4 py-3 text-white">{t.openPrice}</td>
                <td className="px-4 py-3 text-white">{t.currentPrice}</td>
                <td className={`px-4 py-3 ${Number(t.profit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{Number(t.profit).toFixed(2)}</td>
              </tr>
            ))}
            {trades.length === 0 && <tr><td colSpan={7} className="px-4 py-4 text-white/50">No open trades</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
