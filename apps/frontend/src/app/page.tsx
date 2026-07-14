import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import LiveMarketStrip from '../components/LiveMarketStrip';
import MarketOverview from '../components/tradingview/MarketOverview';
import { TrendingUp, Shield, Zap, Globe, ArrowRight, Award, Headphones, Wallet, BarChart3, Users, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const features = [
  { icon: <Zap className="h-6 w-6 text-yellow" />, title: 'Lightning Execution', desc: '99.9% of orders filled in under 40ms with deep institutional liquidity.' },
  { icon: <TrendingUp className="h-6 w-6 text-yellow" />, title: 'Raw Spreads', desc: 'Trade EUR/USD from 0.0 pips with transparent, commission-based pricing.' },
  { icon: <Shield className="h-6 w-6 text-yellow" />, title: 'Funds Protected', desc: 'Segregated client accounts, encryption, and negative balance protection.' },
  { icon: <Globe className="h-6 w-6 text-yellow" />, title: '1,000+ Instruments', desc: 'Forex, crypto, stocks, indices, metals & energies on one MT5 platform.' },
];

const accountTypes = [
  { name: 'Standard', spread: 'from 1.0 pip', commission: 'Zero commission', min: '$10', leverage: '1:1000', popular: false },
  { name: 'Raw', spread: 'from 0.0 pips', commission: '$3.5 per lot', min: '$100', leverage: '1:1000', popular: true },
  { name: 'Pro', spread: 'from 0.2 pips', commission: 'Zero commission', min: '$1,000', leverage: '1:500', popular: false },
];

const trustStats = [
  { icon: <Users className="h-5 w-5 text-yellow" />, value: '200,000+', label: 'Active traders' },
  { icon: <Globe className="h-5 w-5 text-yellow" />, value: '150+', label: 'Countries served' },
  { icon: <Wallet className="h-5 w-5 text-yellow" />, value: '$10', label: 'Minimum deposit' },
  { icon: <Award className="h-5 w-5 text-yellow" />, value: '24/7', label: 'Support & withdrawals' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-bn-bg">
      <Navbar />
      <Hero />
      <LiveMarketStrip />

      {/* Trust bar */}
      <section className="border-y border-bn-border bg-bn-secondary py-4 md:py-6">
        <div className="mx-auto flex max-w-7xl gap-4 overflow-x-auto px-4 scrollbar-hide sm:px-6 lg:px-8 md:grid md:grid-cols-4 md:gap-6">
          {trustStats.map((s) => (
            <div key={s.label} className="flex min-w-[9.5rem] flex-shrink-0 items-center gap-2 md:min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-bn bg-yellow/10 text-yellow">{s.icon}</div>
              <div>
                <p className="text-base font-bold text-bnText-primary md:text-xl">{s.value}</p>
                <p className="text-[10px] text-bnText-secondary md:text-xs">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live markets */}
      <section className="bg-bn-bg py-10 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold text-bnText-primary md:text-2xl">Markets</h2>
              <p className="mt-1 text-xs text-bnText-secondary md:text-sm">Real-time prices from global liquidity providers.</p>
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

      {/* Why choose */}
      <section className="bg-bn-secondary py-10 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-5 text-center md:mb-8">
            <h2 className="text-lg font-bold text-bnText-primary md:text-2xl">Why traders choose FXONS</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group min-w-[11rem] flex-shrink-0 rounded-bn border border-bn-border bg-bn-card p-4 transition hover:border-bn-border-light hover:bg-bn-hover md:min-w-0"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-bn bg-yellow/10 transition group-hover:bg-yellow/20">
                  {feature.icon}
                </div>
                <h3 className="mb-1 text-sm font-semibold text-bnText-primary md:text-base">{feature.title}</h3>
                <p className="text-xs text-bnText-secondary md:text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Account types */}
      <section className="bg-bn-bg py-10 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-5 text-center md:mb-8">
            <h2 className="text-lg font-bold text-bnText-primary md:text-2xl">Choose your account</h2>
            <p className="mt-1 text-xs text-bnText-secondary md:text-sm">Flexible accounts for every type of trader</p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3">
            {accountTypes.map((acc) => (
              <div
                key={acc.name}
                className={`relative min-w-[16rem] flex-shrink-0 rounded-bn border bg-bn-card p-5 transition hover:-translate-y-0.5 md:min-w-0 ${
                  acc.popular ? 'border-yellow shadow-[0_0_0_1px_rgba(240,185,11,0.2)]' : 'border-bn-border'
                }`}
              >
                {acc.popular && (
                  <span className="absolute -top-2 left-4 rounded-bn bg-yellow px-2 py-0.5 text-[10px] font-bold text-black">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-base font-bold text-bnText-primary md:text-lg">{acc.name}</h3>
                <p className="mt-2 text-xl font-bold text-yellow">{acc.spread}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-bnText-secondary"><CheckCircle2 className="h-4 w-4 text-yellow" /> {acc.commission}</li>
                  <li className="flex items-center gap-2 text-bnText-secondary"><CheckCircle2 className="h-4 w-4 text-yellow" /> Min deposit {acc.min}</li>
                  <li className="flex items-center gap-2 text-bnText-secondary"><CheckCircle2 className="h-4 w-4 text-yellow" /> Leverage up to {acc.leverage}</li>
                  <li className="flex items-center gap-2 text-bnText-secondary"><CheckCircle2 className="h-4 w-4 text-yellow" /> MetaTrader 5 access</li>
                </ul>
                <Link
                  href="/register"
                  className={`mt-5 block w-full rounded-bn py-2 text-center text-sm font-semibold transition ${
                    acc.popular
                      ? 'bg-yellow text-black hover:bg-yellow-hover'
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

      {/* MT5 platform */}
      <section className="bg-bn-secondary py-10 md:py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8 lg:grid-cols-2 lg:gap-10">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-bn border border-yellow/20 bg-yellow/10 px-3 py-1 text-xs font-medium text-yellow">
              <BarChart3 className="h-3.5 w-3.5" /> Powered by MetaTrader 5
            </div>
            <h2 className="text-lg font-bold text-bnText-primary md:text-2xl">MetaTrader 5 platform</h2>
            <p className="mt-2 text-sm leading-relaxed text-bnText-secondary md:mt-4">
              Complete KYC and we instantly issue your MT5 login, password and server. Trade on desktop, web and mobile with advanced charting and one-click execution.
            </p>
            <ul className="mt-4 space-y-2">
              {['Instant MT5 credentials after verification', 'Advanced charting & 80+ indicators', 'One-click trading & EAs supported', 'Desktop, Web & Mobile apps'].map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm text-bnText-secondary">
                  <CheckCircle2 className="h-5 w-5 text-yellow" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link href="/register" className="rounded-bn bg-yellow px-4 py-2 text-center text-sm font-semibold text-black transition hover:bg-yellow-hover">
                Get MT5 Credentials
              </Link>
              <Link href="/markets" className="rounded-bn border border-bn-border bg-bn-card px-4 py-2 text-center text-sm font-medium text-bnText-primary transition hover:border-yellow hover:text-yellow">
                Try Live Charts
              </Link>
            </div>
          </div>
          <div className="rounded-bn border border-bn-border bg-bn-card p-4">
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {[
                { icon: <Zap className="h-5 w-5 text-yellow" />, t: '40ms', s: 'Avg execution' },
                { icon: <Globe className="h-5 w-5 text-yellow" />, t: '1,000+', s: 'Instruments' },
                { icon: <Shield className="h-5 w-5 text-yellow" />, t: '1:1000', s: 'Max leverage' },
                { icon: <Headphones className="h-5 w-5 text-yellow" />, t: '24/7', s: 'Live support' },
              ].map((b) => (
                <div key={b.s} className="rounded-bn bg-bn-secondary p-3 md:p-4">
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-bn bg-yellow/10">{b.icon}</div>
                  <p className="text-lg font-bold text-bnText-primary md:text-xl">{b.t}</p>
                  <p className="text-[10px] text-bnText-secondary md:text-xs">{b.s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-bn-bg py-10 md:py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-bnText-primary md:text-2xl">
            Start in <span className="text-yellow">3 steps</span>
          </h2>
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2 text-left scrollbar-hide md:grid md:grid-cols-3">
            {[
              { step: '1', title: 'Register', desc: 'Open your account in under 2 minutes with basic details.' },
              { step: '2', title: 'Verify KYC', desc: 'AI-powered document verification in real time.' },
              { step: '3', title: 'Fund & Trade', desc: 'Deposit with crypto and receive your MT5 credentials instantly.' },
            ].map((item) => (
              <div key={item.step} className="min-w-[13rem] flex-shrink-0 rounded-bn border border-bn-border bg-bn-card p-4 md:min-w-0 md:p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-bn bg-yellow/10 text-base font-bold text-yellow md:mx-auto md:mb-4 md:h-12 md:w-12 md:text-xl">
                  {item.step}
                </div>
                <h3 className="mb-1 text-base font-semibold text-bnText-primary md:mb-2 md:text-center md:text-lg">{item.title}</h3>
                <p className="text-xs text-bnText-secondary md:text-center md:text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-bn bg-yellow px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-hover md:mt-8"
          >
            Get Started Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
