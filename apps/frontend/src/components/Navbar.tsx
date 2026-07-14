'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import TickerTape from './tradingview/TickerTape';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/markets', label: 'Markets' },
  { href: '/trading', label: 'Accounts' },
  { href: '/promotions', label: 'Promotions' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-bn-border bg-bn-bg">
      <div className="hidden border-b border-bn-border bg-bn-secondary md:block">
        <TickerTape />
      </div>
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 md:h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-bn bg-yellow text-bn-bg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="M7 16l4-7 4 7" />
              <path d="M15 9l4 7" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-bnText-primary">
            FX<span className="text-yellow">ONS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-bn px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-bn-hover text-bnText-primary'
                    : 'text-bnText-secondary hover:bg-bn-hover hover:text-bnText-primary'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-bn border border-bn-border bg-transparent px-4 py-2 text-sm font-medium text-bnText-primary transition hover:border-yellow hover:text-yellow"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="rounded-bn bg-yellow px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-hover"
          >
            Register
          </Link>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-bn text-bnText-primary lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[80%] max-w-sm flex-col bg-bn-secondary shadow-2xl animate-slide-in-right">
            <div className="flex h-14 items-center justify-between border-b border-bn-border px-4">
              <span className="text-lg font-bold text-bnText-primary">Menu</span>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-bn text-bnText-secondary hover:text-bnText-primary"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition ${
                    pathname === link.href
                      ? 'bg-bn-hover text-yellow'
                      : 'text-bnText-secondary hover:bg-bn-hover hover:text-bnText-primary'
                  }`}
                >
                  {link.label}
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Link>
              ))}
            </nav>
            <div className="border-t border-bn-border p-4 safe-bottom">
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-bn border border-bn-border py-2.5 text-center text-sm font-medium text-bnText-primary transition hover:border-yellow hover:text-yellow"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-bn bg-yellow py-2.5 text-center text-sm font-semibold text-black transition hover:bg-yellow-hover"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
