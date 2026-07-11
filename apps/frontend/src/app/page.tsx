import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import MarketOverview from '../components/tradingview/MarketOverview';
import { TrendingUp, Shield, Zap, Globe, ArrowRight, Award, Headphones, Wallet, BarChart3, Users, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const features = [
  { icon: <Zap className="h-6 w-6 text-gold" />, title: 'Lightning Execution', desc: '99.9% of orders filled in under 40ms with deep institutional liquidity.' },
  { icon: <TrendingUp className="h-6 w-6 text-gold" />, title: 'Raw Spreads', desc: 'Trade EUR/USD from 0.0 pips with transparent, commission-based pricing.' },
  { icon: <Shield className="h-6 w-6 text-gold" />, title: 'Funds Protected', desc: 'Segregated client accounts, encryption, and negative balance protection.' },
  { icon: <Globe className="h-6 w-6 text-gold" />, title: '1,000+ Instruments', desc: 'Forex, crypto, stocks, indices, metals & energies on one MT5 platform.' },
];

const accountTypes = [
  { name: 'Standard', spread: 'from 1.0 pip', commission: 'Zero commission', min: '$10', leverage: '1:1000', popular: false },
  { name: 'Raw', spread: 'from 0.0 pips', commission: '$3.5 per lot', min: '$100', leverage: '1:1000', popular: true },
  { name: 'Pro', spread: 'from 0.2 pips', commission: 'Zero commission', min: '$1,000', leverage: '1:500', popular: false },
];

const trustStats = [
  { icon: <Users className="h-5 w-5 text-gold" />, value: '200,000+', label: 'Active traders' },
  { icon: <Globe className="h-5 w-5 text-gold" />, value: '150+', label: 'Countries served' },
  { icon: <Wallet className="h-5 w-5 text-gold" />, value: '$10', label: 'Minimum deposit' },
  { icon: <Award className="h-5 w-5 text-gold" />, value: '24/7', label: 'Support & withdrawals' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-navy-950">
      <Navbar />
      <Hero />

      {/* Trust bar */}
      <section className="border-y border-navy-800/60 bg-navy-900/40 py-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 md:grid-cols-4">
          {trustStats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">{s.icon}</div>
              <div>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/50">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live markets */}
      <section className="bg-navy-950 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                <span className="text-xs font-medium text-gold-light">Real-time prices</span>
              </div>
              <h2 className="text-3xl font-bold text-white md:text-4xl">Live Global Markets</h2>
              <p className="mt-3 text-white/50">Forex, crypto, indices, commodities and stocks — updated in real time.</p>
            </div>
            <Link href="/markets" className="btn-outline flex items-center gap-2">
              Explore all markets <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-navy-700/50 bg-navy-900/40 p-3">
            <MarketOverview height={460} />
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="bg-navy-900/30 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Why traders choose FXONS</h2>
            <p className="mt-3 text-white/50">Everything you need for a professional trading experience</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => (
              <div key={idx} className="group rounded-2xl border border-navy-700/50 bg-navy-900/50 p-6 transition-all hover:border-gold/30 hover:bg-navy-800/50">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 transition group-hover:bg-gold/20">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-white/50">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Account types */}
      <section className="bg-navy-950 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Choose your account</h2>
            <p className="mt-3 text-white/50">Flexible accounts for every type of trader</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {accountTypes.map((acc) => (
              <div
                key={acc.name}
                className={`relative rounded-2xl border bg-navy-900/50 p-8 transition-all hover:-translate-y-1 ${
                  acc.popular ? 'border-gold/50 shadow-lg shadow-gold/5' : 'border-navy-700/50'
                }`}
              >
                {acc.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy-950">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-xl font-bold text-white">{acc.name}</h3>
                <p className="mt-4 text-3xl font-bold text-gold">{acc.spread}</p>
                <ul className="mt-6 space-y-3 text-sm">
                  <li className="flex items-center gap-2 text-white/70"><CheckCircle2 className="h-4 w-4 text-gold" /> {acc.commission}</li>
                  <li className="flex items-center gap-2 text-white/70"><CheckCircle2 className="h-4 w-4 text-gold" /> Min deposit {acc.min}</li>
                  <li className="flex items-center gap-2 text-white/70"><CheckCircle2 className="h-4 w-4 text-gold" /> Leverage up to {acc.leverage}</li>
                  <li className="flex items-center gap-2 text-white/70"><CheckCircle2 className="h-4 w-4 text-gold" /> MetaTrader 5 access</li>
                </ul>
                <Link href="/register" className={`mt-8 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition ${acc.popular ? 'btn-gold' : 'btn-outline'}`}>
                  Open {acc.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MT5 platform */}
      <section className="bg-navy-900/30 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-medium text-gold-light">
              <BarChart3 className="h-3.5 w-3.5" /> Powered by MetaTrader 5
            </div>
            <h2 className="text-3xl font-bold text-white md:text-4xl">The world's most powerful trading platform</h2>
            <p className="mt-4 text-white/60">
              Register and instantly receive your MT5 login, password and server — just like the world's top brokers.
              Trade on desktop, web and mobile with advanced charting and one-click execution.
            </p>
            <ul className="mt-6 space-y-3">
              {['Instant MT5 credentials after registration', 'Advanced charting & 80+ indicators', 'One-click trading & EAs supported', 'Desktop, Web & Mobile apps'].map((t) => (
                <li key={t} className="flex items-center gap-3 text-white/70">
                  <CheckCircle2 className="h-5 w-5 text-gold" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex gap-4">
              <Link href="/register" className="btn-gold">Get MT5 Credentials</Link>
              <Link href="/markets" className="btn-outline">Try Live Charts</Link>
            </div>
          </div>
          <div className="rounded-2xl border border-navy-700/50 bg-navy-900/40 p-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <Zap className="h-6 w-6 text-gold" />, t: '40ms', s: 'Avg execution' },
                { icon: <Globe className="h-6 w-6 text-gold" />, t: '1,000+', s: 'Instruments' },
                { icon: <Shield className="h-6 w-6 text-gold" />, t: '1:1000', s: 'Max leverage' },
                { icon: <Headphones className="h-6 w-6 text-gold" />, t: '24/7', s: 'Live support' },
              ].map((b) => (
                <div key={b.s} className="rounded-xl bg-navy-800/50 p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">{b.icon}</div>
                  <p className="text-2xl font-bold text-white">{b.t}</p>
                  <p className="text-xs text-white/50">{b.s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-navy-950 py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Start trading in <span className="text-gold">3 simple steps</span>
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              { step: '1', title: 'Register', desc: 'Open your account in under 2 minutes with basic details.' },
              { step: '2', title: 'Fund', desc: 'Deposit with crypto to your wallet instantly.' },
              { step: '3', title: 'Trade', desc: 'Receive your MT5 credentials and start trading global markets.' },
            ].map((item) => (
              <div key={item.step} className="relative rounded-2xl border border-navy-700/50 bg-navy-900/50 p-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-2xl font-bold text-gold">
                  {item.step}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">{item.title}</h3>
                <p className="text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/register" className="btn-gold mt-12 inline-flex items-center gap-2">
            Get Started Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
