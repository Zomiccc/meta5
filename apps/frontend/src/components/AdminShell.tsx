'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
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
  Menu,
  X,
} from 'lucide-react';
import { api, clearAuthTokens } from '../lib/api';

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
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuthTokens();
    router.push('/login');
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`flex-col border-r border-bn-border bg-bn-card backdrop-blur-sm ${mobile ? 'flex h-full w-[min(18rem,85vw)]' : 'hidden w-64 md:flex'}`}> 
      <Link href="/admin" className="flex items-center gap-2 px-6 py-5" onClick={() => mobile && setMobileOpen(false)}>
        <div className="flex h-8 w-8 items-center justify-center rounded-bn bg-yellow/10">
          <Shield className="h-5 w-5 text-yellow" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-bnText-primary">FX<span className="text-yellow">ONS</span></span>
          <p className="text-[10px] uppercase tracking-wider text-bnText-muted">Admin Panel</p>
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
              onClick={() => mobile && setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-bn px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-yellow/10 text-yellow'
                  : 'text-bnText-secondary hover:bg-bn-input hover:text-bnText-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-bn-border p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-bn px-3 py-2.5 text-sm font-medium text-bnRed/80 transition hover:bg-bnRed/10 hover:text-bnRed"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-bn-bg">
      <Sidebar />

      {/* Mobile header */}
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-bn-border bg-bn-secondary/90 px-4 py-3 backdrop-blur-md md:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-yellow/10">
            <Shield className="h-4 w-4 text-yellow" />
          </div>
          <div>
            <span className="text-base font-bold text-bnText-primary">FX<span className="text-yellow">ONS</span></span>
            <p className="text-[9px] uppercase tracking-wider text-bnText-muted">Admin</p>
          </div>
        </Link>
        <button onClick={() => setMobileOpen(true)} className="flex min-h-11 min-w-11 items-center justify-center rounded-bn text-bnText-primary" aria-label="Open admin navigation">
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
            className="absolute right-3 top-3 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-bn-input text-bnText-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pb-24 pt-20 sm:px-4 md:px-8 md:pb-8 md:pt-8">{children}</main>
    </div>
  );
}
