'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  User,
  Link2,
  Monitor,
  LogOut,
  CandlestickChart,
} from 'lucide-react';
import { api } from '../lib/api';

const clientLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/trade', label: 'Trade', icon: CandlestickChart },
  { href: '/dashboard/deposit', label: 'Deposit', icon: ArrowDownCircle },
  { href: '/dashboard/withdraw', label: 'Withdraw', icon: ArrowUpCircle },
  { href: '/dashboard/history', label: 'History', icon: Wallet },
  { href: '/dashboard/kyc', label: 'KYC', icon: FileText },
  { href: '/dashboard/mt5', label: 'MT5 Credentials', icon: Monitor },
  { href: '/dashboard/affiliate', label: 'Affiliate', icon: Link2 },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
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
        <Link href="/" className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-dark">
            <CandlestickChart className="h-5 w-5 text-navy-950" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Aure<span className="text-gold">x</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {clientLinks.map((link) => {
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
