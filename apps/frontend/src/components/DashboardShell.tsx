'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
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
  Menu,
  X,
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`flex-col border-r border-navy-700/50 bg-navy-900/50 backdrop-blur-sm ${mobile ? 'flex h-full w-64' : 'hidden w-64 md:flex'}`}>
      <Link href="/" className="flex items-center gap-2 px-6 py-5" onClick={() => mobile && setMobileOpen(false)}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-dark">
          <CandlestickChart className="h-5 w-5 text-navy-950" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          FX<span className="text-gold">ONS</span>
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
              onClick={() => mobile && setMobileOpen(false)}
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
  );

  return (
    <div className="flex min-h-screen bg-navy-950">
      <Sidebar />

      {/* Mobile header */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-navy-700/50 bg-navy-900/90 px-4 py-3 backdrop-blur-md md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-gold to-gold-dark">
            <CandlestickChart className="h-4 w-4 text-navy-950" />
          </div>
          <span className="text-base font-bold text-white">FX<span className="text-gold">ONS</span></span>
        </Link>
        <button onClick={() => setMobileOpen(true)} className="text-white">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full animate-slide-in">
            <Sidebar mobile />
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-navy-800 p-1 text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-20 md:px-8 md:pb-8 md:pt-8">{children}</main>
    </div>
  );
}
