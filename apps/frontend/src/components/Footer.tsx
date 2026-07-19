import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, TrendingUp } from 'lucide-react';

const footerSections = [
  {
    title: 'Trading',
    links: [
      { href: '/markets', label: 'Markets' },
      { href: '/trading', label: 'Trading Accounts' },
      { href: '/promotions', label: 'Promotions' },
    ],
  },
  {
    title: 'About',
    links: [
      { href: '/about', label: 'About Us' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/about', label: 'Terms of Service' },
      { href: '/about', label: 'Privacy Policy' },
      { href: '/about', label: 'Risk Disclosure' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-bn-border bg-bn-secondary py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-bn bg-yellow text-black">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-bnText-primary">
                FX<span className="text-yellow">ONS</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-bnText-secondary">
              A global multi-asset broker. Trade forex, crypto, stocks and indices with confidence on MT5.
            </p>
            <div className="mt-5 flex gap-2">
              {[Facebook, Twitter, Instagram, Linkedin, Youtube].map((Icon, idx) => (
                <div
                  key={idx}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-bn border border-bn-border text-bnText-secondary transition-all duration-200 hover:border-yellow/50 hover:text-yellow active:scale-90"
                >
                  <Icon className="h-4 w-4" />
                </div>
              ))}
            </div>
          </div>
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-bnText-primary">{section.title}</h4>
              <ul className="space-y-2.5 text-sm">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-bnText-secondary transition-colors duration-200 hover:text-yellow">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-bn-border pt-6">
          <p className="text-center text-2xs leading-relaxed text-bnText-muted md:text-xs">
            © {new Date().getFullYear()} FXONS. All rights reserved. Risk warning: CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. Ensure you understand the risks involved.
          </p>
        </div>
      </div>
    </footer>
  );
}
