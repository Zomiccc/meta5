'use client';

import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import LiveMarketStrip from '../components/LiveMarketStrip';
import MarketOverview from '../components/tradingview/MarketOverview';
import { TrendingUp, Shield, Zap, Globe, ArrowRight, CheckCircle2, Smartphone, Lock, BarChart3, Headphones } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

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

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-bn-bg">
      <Navbar />
      <Hero />
      <LiveMarketStrip />

      <section className="border-y border-bn-border bg-bn-secondary">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-y divide-bn-border sm:grid-cols-4 sm:divide-y-0 sm:divide-x">
          {trustStats.map((s, i) => (
            <motion.div
              key={s.label}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="px-2 py-5 text-center md:py-7 md:px-6"
            >
              <p className="text-sm font-bold tnum text-bnText-primary md:text-2xl">{s.value}</p>
              <p className="mt-0.5 text-2xs text-bnText-muted md:text-xs">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-bn-bg py-10 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mb-6 flex items-end justify-between md:mb-8">
            <div>
              <h2 className="text-xl font-bold text-bnText-primary md:text-3xl">Markets</h2>
              <p className="mt-1.5 text-xs text-bnText-secondary md:text-sm">Real-time prices from global liquidity providers</p>
            </div>
            <Link
              href="/markets"
              className="flex items-center gap-1 rounded-bn border border-bn-border-light bg-bn-elevated px-3 py-1.5 text-xs font-medium text-bnText-primary transition-all duration-200 hover:border-yellow/50 hover:text-yellow"
            >
              More <ArrowRight className="h-3 w-3" />
            </Link>
          </motion.div>
          <motion.div {...fadeUp} className="hidden rounded-bn-lg border border-bn-border bg-bn-secondary p-3 md:block">
            <MarketOverview height={420} />
          </motion.div>
        </div>
      </section>

      <section className="bg-bn-secondary py-10 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h2 {...fadeUp} className="mb-6 text-center text-xl font-bold text-bnText-primary md:mb-10 md:text-3xl">
            Why traders choose FXONS
          </motion.h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: idx * 0.08 }}
                className="group rounded-bn border border-bn-border bg-bn-card p-4 transition-all duration-300 hover:border-yellow/30 hover:shadow-card-hover md:p-6"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-bn bg-yellow/10 transition-colors duration-300 group-hover:bg-yellow/20">
                  {feature.icon}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-bnText-primary md:text-base">{feature.title}</h3>
                <p className="text-xs leading-relaxed text-bnText-secondary md:text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-bn-bg py-10 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mb-6 text-center md:mb-10">
            <h2 className="text-xl font-bold text-bnText-primary md:text-3xl">Choose your account</h2>
            <p className="mt-1.5 text-xs text-bnText-secondary md:text-sm">Flexible accounts for every type of trader</p>
          </motion.div>
          <div className="grid gap-3 md:grid-cols-3 md:gap-5">
            {accountTypes.map((acc, idx) => (
              <motion.div
                key={acc.name}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: idx * 0.1 }}
                className={`relative rounded-bn-lg border bg-bn-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover md:p-7 ${
                  acc.popular ? 'border-yellow shadow-glow-yellow' : 'border-bn-border'
                }`}
              >
                {acc.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-bn bg-yellow px-3 py-0.5 text-2xs font-bold text-black">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-base font-bold text-bnText-primary md:text-xl">{acc.name}</h3>
                <p className="mt-2 text-xl font-bold text-yellow md:text-2xl tnum">{acc.spread}</p>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li className="flex items-center gap-2 text-bnText-secondary"><CheckCircle2 className="h-4 w-4 text-yellow" /> {acc.commission}</li>
                  <li className="flex items-center gap-2 text-bnText-secondary"><CheckCircle2 className="h-4 w-4 text-yellow" /> Min deposit {acc.min}</li>
                  <li className="flex items-center gap-2 text-bnText-secondary"><CheckCircle2 className="h-4 w-4 text-yellow" /> Leverage up to {acc.leverage}</li>
                  <li className="flex items-center gap-2 text-bnText-secondary"><CheckCircle2 className="h-4 w-4 text-yellow" /> MetaTrader 5 access</li>
                </ul>
                <Link
                  href="/register"
                  className={`mt-5 block w-full rounded-bn py-2.5 text-center text-sm font-bold transition-all duration-200 active:scale-[0.97] ${
                    acc.popular
                      ? 'bg-yellow text-black hover:bg-yellow-hover shadow-glow-yellow'
                      : 'border border-bn-border-light bg-bn-elevated text-bnText-primary hover:border-yellow/50 hover:text-yellow'
                  }`}
                >
                  Open {acc.name}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-bn-secondary py-10 md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
          <motion.div {...fadeUp}>
            <div className="mb-3 inline-flex items-center gap-2 rounded-bn border border-yellow/20 bg-yellow/10 px-3 py-1 text-xs font-medium text-yellow">
              <BarChart3 className="h-3.5 w-3.5" /> Powered by MetaTrader 5
            </div>
            <h2 className="text-xl font-bold text-bnText-primary md:text-3xl">Trade on MetaTrader 5</h2>
            <p className="mt-3 text-sm leading-relaxed text-bnText-secondary md:mt-4">
              Complete KYC and we instantly issue your MT5 login, password and server. Trade on desktop, web and mobile with advanced charting and one-click execution.
            </p>
            <ul className="mt-5 space-y-2.5">
              {['Instant MT5 credentials after verification', 'Advanced charting & 80+ indicators', 'One-click trading & EAs supported', 'Desktop, Web & Mobile apps'].map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm text-bnText-secondary">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-yellow" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link href="/register" className="rounded-bn bg-yellow px-5 py-2.5 text-center text-sm font-bold text-black transition-all duration-200 hover:bg-yellow-hover active:scale-[0.97] shadow-glow-yellow">
                Get MT5 Credentials
              </Link>
              <Link href="/markets" className="rounded-bn border border-bn-border-light bg-bn-elevated px-5 py-2.5 text-center text-sm font-medium text-bnText-primary transition-all duration-200 hover:border-yellow/50 hover:text-yellow">
                Try Live Charts
              </Link>
            </div>
          </motion.div>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {[
              { icon: <Zap className="h-5 w-5 text-yellow" />, t: '40ms', s: 'Avg execution' },
              { icon: <Globe className="h-5 w-5 text-yellow" />, t: '1,000+', s: 'Instruments' },
              { icon: <Shield className="h-5 w-5 text-yellow" />, t: '1:1000', s: 'Max leverage' },
              { icon: <Smartphone className="h-5 w-5 text-yellow" />, t: 'All devices', s: 'Web & mobile' },
            ].map((b, i) => (
              <motion.div
                key={b.s}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="rounded-bn border border-bn-border bg-bn-card p-3 transition-all duration-300 hover:shadow-card-hover md:p-5"
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-bn bg-yellow/10">{b.icon}</div>
                <p className="text-base font-bold tnum text-bnText-primary md:text-xl">{b.t}</p>
                <p className="text-2xs text-bnText-secondary md:text-xs">{b.s}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-bn-bg py-10 md:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.h2 {...fadeUp} className="text-xl font-bold text-bnText-primary md:text-3xl">
            Start in <span className="text-yellow">3 steps</span>
          </motion.h2>
          <div className="mt-8 grid gap-3 md:grid-cols-3 md:gap-5">
            {[
              { step: '1', title: 'Register', desc: 'Open your account in under 2 minutes with basic details.' },
              { step: '2', title: 'Verify KYC', desc: 'AI-powered document verification in real time.' },
              { step: '3', title: 'Fund & Trade', desc: 'Deposit with crypto and receive your MT5 credentials instantly.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
                className="rounded-bn border border-bn-border bg-bn-card p-5 transition-all duration-300 hover:shadow-card-hover md:p-7"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow/10 text-xl font-bold text-yellow">
                  {item.step}
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-bnText-primary md:text-lg">{item.title}</h3>
                <p className="text-xs leading-relaxed text-bnText-secondary md:text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <motion.div {...fadeUp}>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-bn bg-yellow px-6 py-3 text-sm font-bold text-black transition-all duration-200 hover:bg-yellow-hover active:scale-[0.97] shadow-glow-yellow md:mt-10"
            >
              Get Started Now <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

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
