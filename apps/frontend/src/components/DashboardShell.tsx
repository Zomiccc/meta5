'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  TrendingUp,
  Home,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import { Button } from './ui/Button';

const navGroups = [
  {
    title: 'Main',
    links: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/trade', label: 'Trade', icon: CandlestickChart },
      { href: '/dashboard/history', label: 'History', icon: History },
    ],
  },
  {
    title: 'Wallet',
    links: [
      { href: '/dashboard/deposit', label: 'Deposit', icon: ArrowDownCircle },
      { href: '/dashboard/withdraw', label: 'Withdraw', icon: ArrowUpCircle },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/dashboard/kyc', label: 'KYC Verification', icon: FileText },
      { href: '/dashboard/affiliate', label: 'Affiliate', icon: Link2 },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function DashboardShell({ children, fullHeight }: { children: React.ReactNode; fullHeight?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const balance = user?.mt5Account?.balance ? Number(user.mt5Account.balance) : 0;

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`flex h-full flex-col border-r border-bn-border bg-bn-secondary ${
        mobile ? 'w-[min(18rem,85vw)]' : 'hidden w-64 lg:flex'
      }`}
    >
      <Link href="/dashboard" className="flex h-16 items-center gap-2 px-6 transition-transform active:scale-95" onClick={() => mobile && setMobileOpen(false)}>
        <div className="flex h-8 w-8 items-center justify-center rounded-bn bg-yellow text-black">
          <CandlestickChart className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold text-bnText-primary">
          FX<span className="text-yellow">ONS</span>
        </span>
      </Link>

      <div className="mx-3 mb-2 rounded-bn border border-bn-border bg-bn-card p-4 shadow-card">
        <p className="text-xs text-bnText-muted">Estimated Balance</p>
        <p className="mt-1 text-xl font-bold tnum text-bnText-primary">
          ${balance.toFixed(2)}
        </p>
        <div className="mt-3 flex gap-2">
          <Link
            href="/dashboard/deposit"
            onClick={() => mobile && setMobileOpen(false)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-bn bg-yellow py-2 text-xs font-bold text-black transition-all duration-200 hover:bg-yellow-hover active:scale-95"
          >
            <ArrowDownCircle className="h-3.5 w-3.5" /> Deposit
          </Link>
          <Link
            href="/dashboard/withdraw"
            onClick={() => mobile && setMobileOpen(false)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-bn border border-bn-border bg-bn-input py-2 text-xs font-bold text-bnText-primary transition-all duration-200 hover:bg-bn-hover active:scale-95"
          >
            <ArrowUpCircle className="h-3.5 w-3.5" /> Withdraw
          </Link>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="mb-1.5 px-3 text-2xs font-bold uppercase tracking-wider text-bnText-muted">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.links.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => mobile && setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-bn px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      active ? 'bg-yellow/10 text-yellow' : 'text-bnText-secondary hover:bg-bn-hover hover:text-bnText-primary'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-bn-border p-3">
        <div className="mb-2 flex items-center gap-3 rounded-bn px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow/10 text-sm font-bold text-yellow">
            {(user?.name || 'T')[0].toUpperCase()}
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
        <header className="glass sticky top-0 z-40 flex h-16 items-center justify-between border-b border-bn-border px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-bn text-bnText-secondary transition hover:bg-bn-hover lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/" className="flex items-center gap-1 text-xs text-bnText-muted transition hover:text-bnText-primary">
                <Home className="h-3 w-3" /> Home
              </Link>
              <span className="text-bnText-muted">/</span>
              <span className="text-xs font-medium capitalize text-bnText-primary">
                {(pathname.split('/').pop() || 'Overview').replace(/-/g, ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/deposit"
              className="hidden items-center gap-2 rounded-bn border border-bn-border bg-bn-secondary px-3 py-2 transition-all duration-200 hover:border-yellow/30 sm:flex"
            >
              <Wallet className="h-4 w-4 text-yellow" />
              <span className="text-sm font-bold tnum text-bnText-primary">${balance.toFixed(2)}</span>
            </Link>

            <button className="relative flex h-10 w-10 items-center justify-center rounded-bn text-bnText-secondary transition hover:bg-bn-hover" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-bnRed" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((s) => !s)}
                className="flex items-center gap-2 rounded-bn px-2 py-1.5 text-bnText-primary transition hover:bg-bn-hover"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow/10 text-sm font-bold text-yellow">
                  {(user?.name || 'T')[0].toUpperCase()}
                </div>
                <span className="hidden max-w-[100px] truncate text-sm font-medium md:block">{user?.name || 'Trader'}</span>
                <ChevronDown className="h-4 w-4 text-bnText-muted" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-0" onClick={() => setUserMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 top-full z-10 mt-2 w-52 overflow-hidden rounded-bn border border-bn-border bg-bn-card shadow-bn-lg"
                    >
                      <div className="border-b border-bn-border px-4 py-3">
                        <p className="truncate text-sm font-medium text-bnText-primary">{user?.name || 'Trader'}</p>
                        <p className="truncate text-xs text-bnText-muted">{user?.email || ''}</p>
                      </div>
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-bnText-secondary transition hover:bg-bn-hover hover:text-bnText-primary"
                      >
                        <Settings className="h-4 w-4" /> Settings
                      </Link>
                      <button
                        onClick={logout}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-bnRed transition hover:bg-bnRed/10"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 top-0 h-full"
              >
                <Sidebar mobile />
              </motion.div>
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-bn bg-bn-card text-bnText-primary"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </AnimatePresence>

        <main className={fullHeight ? 'flex-1 overflow-hidden' : 'flex-1 overflow-x-hidden p-4 pb-24 lg:p-8 lg:pb-8'}>{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-5 border-t border-bn-border bg-bn-secondary lg:hidden safe-bottom">
          {[
            { href: '/dashboard', label: 'Home', icon: Home },
            { href: '/markets', label: 'Markets', icon: BarChart3 },
            { href: '/dashboard/trade', label: 'Trade', icon: TrendingUp, highlight: true },
            { href: '/dashboard/history', label: 'Orders', icon: FileText },
            { href: '/dashboard/deposit', label: 'Assets', icon: Wallet },
          ].map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            if (item.highlight) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center gap-0.5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow -mt-4 shadow-glow-yellow">
                    <Icon className="h-5 w-5 text-black" />
                  </div>
                  <span className="text-[10px] font-medium text-yellow">{item.label}</span>
                </Link>
              );
            }
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
