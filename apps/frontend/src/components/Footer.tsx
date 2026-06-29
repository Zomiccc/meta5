import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, TrendingUp } from 'lucide-react';

const footerLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/trading', label: 'Trading Accounts' },
  { href: '/promotions', label: 'Promotions' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer() {
  return (
    <footer className="border-t border-navy-700/50 bg-navy-950 py-12 text-white/60">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
                <TrendingUp className="h-5 w-5 text-gold" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                FX<span className="text-gold">ONS</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed">
              A global multi-asset broker. Trade forex, crypto, stocks, indices and commodities with confidence on MT5.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-gold">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-white">Follow Us</h4>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon, idx) => (
                <div key={idx} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-navy-700 transition hover:border-gold/30 hover:text-gold">
                  <Icon className="h-4 w-4" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-navy-700/50 pt-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} FXONS. All rights reserved. Risk warning: CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. Ensure you understand the risks involved.
        </div>
      </div>
    </footer>
  );
}
