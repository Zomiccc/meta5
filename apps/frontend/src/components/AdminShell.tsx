'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  ArrowDownCircle,
  ArrowUpCircle,
  Link2,
  Activity,
  LogOut,
  Shield,
} from 'lucide-react';
import { api } from '../lib/api';

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/kyc', label: 'KYC', icon: FileText },
  { href: '/admin/deposits', label: 'Deposits', icon: ArrowDownCircle },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpCircle },
  { href: '/admin/affiliates', label: 'Affiliates', icon: Link2 },
  { href: '/admin/risk', label: 'Risk Monitoring', icon: Activity },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen bg-navy-950">
      <aside className="hidden w-64 flex-col border-r border-navy-700/50 bg-navy-900/50 backdrop-blur-sm md:flex">
        <Link href="/admin" className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
            <Shield className="h-5 w-5 text-gold" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">Aure<span className="text-gold">x</span></span>
            <p className="text-[10px] uppercase tracking-wider text-white/40">Admin Panel</p>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-gold/10 text-gold'
                    : 'text-white/60 hover:bg-navy-800/50 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-navy-700/50 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400/80 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
    </div>
  );
}
