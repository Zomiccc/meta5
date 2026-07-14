'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-bn-border bg-bn-bg">
      <div className="border-b border-bn-border bg-bn-secondary">
        <TickerTape />
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
          className="flex h-10 w-10 items-center justify-center rounded-bn text-bnText-primary lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-bn-border bg-bn-secondary px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-bn px-4 py-3 text-sm font-medium transition ${
                  pathname === link.href
                    ? 'bg-bn-hover text-bnText-primary'
                    : 'text-bnText-secondary hover:bg-bn-hover hover:text-bnText-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex gap-2">
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
          </nav>
        </div>
      )}
    </header>
  );
}
