'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, Search } from 'lucide-react';
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
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="hidden border-b border-bn-border bg-bn-secondary md:block">
        <TickerTape />
      </div>
      <div className={`border-b border-bn-border transition-all duration-300 ${scrolled ? 'glass shadow-bn' : 'bg-bn-bg'}`}>
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 md:h-16">
          <Link href="/" className="flex items-center gap-2 transition-transform active:scale-95">
            <div className="flex h-8 w-8 items-center justify-center rounded-bn bg-yellow text-black">
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

          <nav className="hidden items-center gap-0.5 lg:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative rounded-bn px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    active
                      ? 'text-bnText-primary'
                      : 'text-bnText-secondary hover:text-bnText-primary'
                  }`}
                >
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-yellow"
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-bn text-bnText-secondary transition hover:bg-bn-hover hover:text-bnText-primary"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <Link
              href="/login"
              className="rounded-bn border border-bn-border-light bg-transparent px-4 py-2 text-sm font-medium text-bnText-primary transition-all duration-200 hover:border-yellow/50 hover:text-yellow"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="rounded-bn bg-yellow px-4 py-2 text-sm font-semibold text-black transition-all duration-200 hover:bg-yellow-hover active:scale-[0.97] shadow-glow-yellow"
            >
              Register
            </Link>
          </div>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-bn text-bnText-primary transition hover:bg-bn-hover lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

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
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-0 flex h-full w-[80%] max-w-sm flex-col bg-bn-secondary shadow-bn-xl"
            >
              <div className="flex h-14 items-center justify-between border-b border-bn-border px-4">
                <span className="text-lg font-bold text-bnText-primary">Menu</span>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-bn text-bnText-secondary transition hover:bg-bn-hover hover:text-bnText-primary"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-2">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-4 py-3 text-sm font-medium transition ${
                        pathname === link.href
                          ? 'bg-yellow/10 text-yellow'
                          : 'text-bnText-secondary hover:bg-bn-hover hover:text-bnText-primary'
                      }`}
                    >
                      {link.label}
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <div className="border-t border-bn-border p-4 safe-bottom">
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-bn border border-bn-border py-2.5 text-center text-sm font-medium text-bnText-primary transition hover:border-yellow/50 hover:text-yellow"
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
