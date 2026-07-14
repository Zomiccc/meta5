'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, CandlestickChart } from 'lucide-react';
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
    <header className="sticky top-0 z-50 w-full">
      <div className="border-b border-navy-800/60 bg-navy-950">
        <TickerTape />
      </div>
      <div className="border-b border-navy-700/50 bg-navy-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-dark">
              <CandlestickChart className="h-5 w-5 text-navy-950" />
            </div>
            <div className="leading-none">
              <span className="text-xl font-extrabold tracking-tight text-white">
                FX<span className="text-gold">ONS</span>
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                    active ? 'bg-navy-700/50 text-gold' : 'text-white/70 hover:bg-navy-800/50 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/login" className="btn-outline text-sm">
              Log In
            </Link>
            <Link href="/register" className="btn-gold text-sm">
              Open Account
            </Link>
          </div>

          <button
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-white lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="max-h-[calc(100vh-7rem)] overflow-y-auto border-b border-navy-700/50 bg-navy-950 px-4 py-4 sm:px-6 lg:hidden animate-fade-in">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-11 items-center rounded-lg px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-navy-800 hover:text-white"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Link href="/login" className="btn-outline flex-1 text-center text-sm" onClick={() => setMobileOpen(false)}>
                Log In
              </Link>
              <Link href="/register" className="btn-gold flex-1 text-center text-sm" onClick={() => setMobileOpen(false)}>
                Open Account
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
