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
    <footer className="border-t border-bn-border bg-bn-secondary py-8 text-bnText-secondary md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-bn bg-yellow text-bn-bg">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-bnText-primary">
                FX<span className="text-yellow">ONS</span>
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed md:mt-4 md:text-sm">
              A global multi-asset broker. Trade forex, crypto, stocks, indices and commodities with confidence on MT5.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-bnText-primary md:mb-4 md:text-sm">Quick Links</h4>
            <ul className="space-y-1.5 text-sm md:space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-yellow">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-bnText-primary md:mb-4 md:text-sm">Follow Us</h4>
            <div className="flex gap-2 md:gap-3">
              {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon, idx) => (
                <div
                  key={idx}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-bn border border-bn-border text-bnText-secondary transition hover:border-yellow hover:text-yellow md:h-9 md:w-9"
                >
                  <Icon className="h-4 w-4" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-bn-border pt-4 text-center text-[10px] text-bnText-muted md:mt-10 md:pt-6 md:text-xs">
          © {new Date().getFullYear()} FXONS. All rights reserved. Risk warning: CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. Ensure you understand the risks involved.
        </div>
      </div>
    </footer>
  );
}
