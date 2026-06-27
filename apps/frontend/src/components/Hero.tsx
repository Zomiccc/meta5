import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import AdvancedChart from './tradingview/AdvancedChart';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-950">
      <div className="absolute inset-0 bg-gradient-to-br from-navy-800/30 via-navy-950 to-navy-950" />
      <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-gold/5 blur-3xl" />
      <div className="absolute left-1/4 top-1/2 h-[400px] w-[400px] rounded-full bg-navy-600/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-slide-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-gold-light">Regulated · Trusted by 200,000+ traders worldwide</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white md:text-6xl">
              Trade Forex, Crypto & Stocks with{' '}
              <span className="bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent">FXONS</span>
            </h1>
            <p className="mt-6 text-lg text-white/60">
              Access 1,000+ global instruments on MetaTrader 5. Ultra-low spreads, lightning-fast execution,
              and instant crypto deposits — all in one powerful platform.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/register" className="btn-gold group flex items-center justify-center gap-2">
                Open Live Account
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link href="/markets" className="btn-outline text-center">
                View Live Markets
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6">
              {[
                { label: 'Spreads from', value: '0.0 pips' },
                { label: 'Min deposit', value: '$10' },
                { label: 'Max leverage', value: '1:1000' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/50">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm text-white/40">
              <ShieldCheck className="h-4 w-4 text-gold" />
              Segregated client funds · Negative balance protection
            </div>
          </div>

          <div className="animate-fade-in">
            <div className="rounded-2xl border border-navy-700/50 bg-navy-900/40 p-2 shadow-2xl backdrop-blur-sm">
              <AdvancedChart symbol="OANDA:XAUUSD" height={460} />
            </div>
            <p className="mt-2 text-center text-xs text-white/30">
              Live prices powered by global liquidity providers
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
