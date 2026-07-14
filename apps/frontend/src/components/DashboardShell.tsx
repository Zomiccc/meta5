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
  LogOut,
  CandlestickChart,
  Menu,
  X,
  Bell,
  ChevronDown,
  Settings,
  History,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/useAuth';
import { Button } from './ui/Button';

const clientLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/trade', label: 'Trade', icon: CandlestickChart },
  { href: '/dashboard/deposit', label: 'Deposit', icon: ArrowDownCircle },
  { href: '/dashboard/withdraw', label: 'Withdraw', icon: ArrowUpCircle },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/dashboard/kyc', label: 'KYC', icon: FileText },
  { href: '/dashboard/affiliate', label: 'Affiliate', icon: Link2 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`flex h-full flex-col border-r border-bn-border bg-bn-secondary ${
        mobile ? 'w-[min(18rem,85vw)]' : 'hidden w-60 lg:flex'
      }`}
    >
      <Link href="/dashboard" className="flex h-16 items-center gap-2 px-6" onClick={() => mobile && setMobileOpen(false)}>
        <div className="flex h-8 w-8 items-center justify-center rounded-bn bg-yellow text-bn-bg">
          <CandlestickChart className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold text-bnText-primary">
          FX<span className="text-yellow">ONS</span>
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
              className={`flex items-center gap-3 rounded-bn px-3 py-2.5 text-sm font-medium transition ${
                active ? 'bg-yellow/10 text-yellow' : 'text-bnText-secondary hover:bg-bn-hover hover:text-bnText-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-bn-border p-3">
        <div className="mb-3 flex items-center gap-3 rounded-bn px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-bn bg-bn-input text-bnText-secondary">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-bnText-primary">{user?.name || 'Trader'}</p>
            <p className="truncate text-xs text-bnText-muted">{user?.email || ''}</p>
          </div>
        </div>
        <Button variant="ghost" fullWidth onClick={logout} className="justify-start gap-2 text-bnRed hover:bg-bnRed/10">
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-bn-bg">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-bn-border bg-bn-bg px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-bn text-bnText-secondary transition hover:bg-bn-hover lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold capitalize text-bnText-primary">
              {(pathname.split('/').pop() || 'Overview').replace(/-/g, ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative flex h-10 w-10 items-center justify-center rounded-bn text-bnText-secondary transition hover:bg-bn-hover">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-bnRed" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((s) => !s)}
                className="flex items-center gap-2 rounded-bn px-2 py-1.5 text-bnText-primary transition hover:bg-bn-hover"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-bn bg-bn-input text-bnText-secondary">
                  <User className="h-4 w-4" />
                </div>
                <span className="hidden max-w-[120px] truncate text-sm font-medium sm:block">{user?.name || 'Trader'}</span>
                <ChevronDown className="h-4 w-4 text-bnText-muted" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-0" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-10 mt-2 w-48 rounded-bn border border-bn-border bg-bn-card shadow-bn-lg">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-bnText-secondary transition hover:bg-bn-hover hover:text-bnText-primary"
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-bnRed transition hover:bg-bnRed/10"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 h-full animate-slide-right">
              <Sidebar mobile />
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-bn bg-bn-card text-bnText-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <main className="flex-1 overflow-x-hidden p-4 pb-24 lg:p-8 lg:pb-8">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-4 border-t border-bn-border bg-bn-secondary lg:hidden">
          {[
            { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
            { href: '/dashboard/trade', label: 'Trade', icon: CandlestickChart },
            { href: '/dashboard/history', label: 'Assets', icon: Wallet },
            { href: '/dashboard/settings', label: 'Profile', icon: User },
          ].map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition ${
                  active ? 'text-yellow' : 'text-bnText-muted hover:text-bnText-primary'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
