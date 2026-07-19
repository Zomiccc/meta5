import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import LiveMarketStrip from '../components/LiveMarketStrip';
import MarketOverview from '../components/tradingview/MarketOverview';
import { TrendingUp, Shield, Zap, Globe, ArrowRight, Award, Headphones, Wallet, BarChart3, Users, CheckCircle2, Smartphone, Lock } from 'lucide-react';
import Link from 'next/link';

const features = [
  { icon: <Zap className="h-5 w-5 text-yellow" />, title: 'Lightning Execution', desc: '99.9% of orders filled in under 40ms with deep institutional liquidity.' },
  { icon: <TrendingUp className="h-5 w-5 text-yellow" />, title: 'Raw Spreads', desc: 'Trade EUR/USD from 0.0 pips with transparent, commission-based pricing.' },
  { icon: <Shield className="h-5 w-5 text-yellow" />, title: 'Funds Protected', desc: 'Segregated client accounts, encryption, and negative balance protection.' },
  { icon: <Globe className="h-5 w-5 text-yellow" />, title: '1,000+ Instruments', desc: 'Trade forex, crypto, stocks and indices on MetaTrader 5 with high leverage.' },
];

const accountTypes = [
  { name: 'Standard', spread: 'from 1.0 pip', commission: 'Zero commission', min: '$10', leverage: '1:1000', popular: false },
  { name: 'Raw', spread: 'from 0.0 pips', commission: '$3.5 per lot', min: '$100', leverage: '1:1000', popular: true },
  { name: 'Pro', spread: 'from 0.2 pips', commission: 'Zero commission', min: '$1,000', leverage: '1:500', popular: false },
];

const trustStats = [
  { value: '200K+', label: 'Active traders' },
  { value: '150+', label: 'Countries' },
  { value: '$10', label: 'Min deposit' },
  { value: '24/7', label: 'Support' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-bn-bg">
      <Navbar />
      <Hero />
      <LiveMarketStrip />

      {/* Stats bar — Binance style */}
      <section className="border-y border-bn-border bg-bn-secondary">
        <div className="mx-auto grid max-w-7xl grid-cols-4 divide-x divide-bn-border">
          {trustStats.map((s) => (
            <div key={s.label} className="px-2 py-4 text-center md:py-6 md:px-6">
              <p className="text-sm font-bold text-bnText-primary md:text-2xl">{s.value}</p>
              <p className="mt-0.5 text-[9px] text-bnText-muted md:text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Markets section */}
      <section className="bg-bn-bg py-8 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-end justify-between md:mb-6">
            <div>
              <h2 className="text-lg font-bold text-bnText-primary md:text-3xl">Markets</h2>
              <p className="mt-1 text-xs text-bnText-secondary md:text-sm">Real-time prices from global liquidity providers</p>
            </div>
            <Link
              href="/markets"
              className="flex items-center gap-1 rounded-bn border border-bn-border bg-bn-secondary px-3 py-1.5 text-xs font-medium text-bnText-primary transition hover:border-yellow hover:text-yellow"
            >
              More <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="hidden rounded-bn border border-bn-border bg-bn-secondary p-3 md:block">
            <MarketOverview height={420} />
          </div>
        </div>
      </section>

      {/* Why choose — Binance style grid */}
      <section className="bg-bn-secondary py-8 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-center text-lg font-bold text-bnText-primary md:mb-8 md:text-3xl">
            Why traders choose FXONS
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group rounded-bn border border-bn-border bg-bn-card p-4 transition hover:border-yellow/30 md:p-6"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-bn bg-yellow/10 transition group-hover:bg-yellow/20">
                  {feature.icon}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-bnText-primary md:text-base">{feature.title}</h3>
                <p className="text-xs text-bnText-secondary md:text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Account types — Binance style cards */}
      <section className="bg-bn-bg py-8 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 text-center md:mb-8">
            <h2 className="text-lg font-bold text-bnText-primary md:text-3xl">Choose your account</h2>
            <p className="mt-1 text-xs text-bnText-secondary md:text-sm">Flexible accounts for every type of trader</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3 md:gap-5">
            {accountTypes.map((acc) => (
              <div
                key={acc.name}
                className={`relative rounded-bn border bg-bn-card p-5 transition hover:-translate-y-1 md:p-7 ${
                  acc.popular ? 'border-yellow shadow-[0_0_0_1px_rgba(240,185,11,0.2)]' : 'border-bn-border'
                }`}
              >
                {acc.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-bn bg-yellow px-3 py-0.5 text-[10px] font-bold text-bn-bg">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-base font-bold text-bnText-primary md:text-xl">{acc.name}</h3>
                <p className="mt-2 text-xl font-bold text-yellow md:text-2xl">{acc.spread}</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li className="flex items-center gap-2 text-bnText-secondary"><CheckCircle2 className="h-4 w-4 text-yellow" /> {acc.commission}</li>
                  <li className="flex items-center gap-2 text-bnText-secondary"><CheckCircle2 className="h-4 w-4 text-yellow" /> Min deposit {acc.min}</li>
                  <li className="flex items-center gap-2 text-bnText-secondary"><CheckCircle2 className="h-4 w-4 text-yellow" /> Leverage up to {acc.leverage}</li>
                  <li className="flex items-center gap-2 text-bnText-secondary"><CheckCircle2 className="h-4 w-4 text-yellow" /> MetaTrader 5 access</li>
                </ul>
                <Link
                  href="/register"
                  className={`mt-5 block w-full rounded-bn py-2.5 text-center text-sm font-bold transition ${
                    acc.popular
                      ? 'bg-yellow text-bn-bg hover:bg-yellow-hover'
                      : 'border border-bn-border bg-bn-secondary text-bnText-primary hover:border-yellow hover:text-yellow'
                  }`}
                >
                  Open {acc.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MT5 platform — Binance style split */}
      <section className="bg-bn-secondary py-8 md:py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-bn border border-yellow/20 bg-yellow/10 px-3 py-1 text-xs font-medium text-yellow">
              <BarChart3 className="h-3.5 w-3.5" /> Powered by MetaTrader 5
            </div>
            <h2 className="text-lg font-bold text-bnText-primary md:text-3xl">Trade on MetaTrader 5</h2>
            <p className="mt-2 text-sm leading-relaxed text-bnText-secondary md:mt-4">
              Complete KYC and we instantly issue your MT5 login, password and server. Trade on desktop, web and mobile with advanced charting and one-click execution.
            </p>
            <ul className="mt-4 space-y-2.5">
              {['Instant MT5 credentials after verification', 'Advanced charting & 80+ indicators', 'One-click trading & EAs supported', 'Desktop, Web & Mobile apps'].map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm text-bnText-secondary">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-yellow" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link href="/register" className="rounded-bn bg-yellow px-5 py-2.5 text-center text-sm font-bold text-bn-bg transition hover:bg-yellow-hover">
                Get MT5 Credentials
              </Link>
              <Link href="/markets" className="rounded-bn border border-bn-border bg-bn-card px-5 py-2.5 text-center text-sm font-medium text-bnText-primary transition hover:border-yellow hover:text-yellow">
                Try Live Charts
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {[
              { icon: <Zap className="h-5 w-5 text-yellow" />, t: '40ms', s: 'Avg execution' },
              { icon: <Globe className="h-5 w-5 text-yellow" />, t: '1,000+', s: 'Instruments' },
              { icon: <Shield className="h-5 w-5 text-yellow" />, t: '1:1000', s: 'Max leverage' },
              { icon: <Smartphone className="h-5 w-5 text-yellow" />, t: 'All devices', s: 'Web & mobile' },
            ].map((b) => (
              <div key={b.s} className="rounded-bn border border-bn-border bg-bn-card p-3 md:p-5">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-bn bg-yellow/10">{b.icon}</div>
                <p className="text-base font-bold text-bnText-primary md:text-xl">{b.t}</p>
                <p className="text-[10px] text-bnText-secondary md:text-xs">{b.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps — Binance style */}
      <section className="bg-bn-bg py-8 md:py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-bnText-primary md:text-3xl">
            Start in <span className="text-yellow">3 steps</span>
          </h2>
          <div className="mt-6 grid gap-3 md:mt-8 md:grid-cols-3 md:gap-5">
            {[
              { step: '1', title: 'Register', desc: 'Open your account in under 2 minutes with basic details.' },
              { step: '2', title: 'Verify KYC', desc: 'AI-powered document verification in real time.' },
              { step: '3', title: 'Fund & Trade', desc: 'Deposit with crypto and receive your MT5 credentials instantly.' },
            ].map((item) => (
              <div key={item.step} className="rounded-bn border border-bn-border bg-bn-card p-5 md:p-7">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow/10 text-xl font-bold text-yellow">
                  {item.step}
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-bnText-primary md:text-lg">{item.title}</h3>
                <p className="text-xs text-bnText-secondary md:text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-bn bg-yellow px-6 py-3 text-sm font-bold text-bn-bg transition hover:bg-yellow-hover md:mt-8"
          >
            Get Started Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Security banner */}
      <section className="border-t border-bn-border bg-bn-secondary py-6 md:py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-4 px-4 text-center sm:px-6 md:flex-row md:gap-8 lg:px-8">
          {[
            { icon: <Lock className="h-5 w-5 text-bnGreen" />, text: '256-bit SSL Encryption' },
            { icon: <Shield className="h-5 w-5 text-bnGreen" />, text: 'Segregated Client Funds' },
            { icon: <CheckCircle2 className="h-5 w-5 text-bnGreen" />, text: 'Negative Balance Protection' },
            { icon: <Headphones className="h-5 w-5 text-bnGreen" />, text: '24/7 Live Support' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-bnText-secondary md:text-sm">
              {item.icon}
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
