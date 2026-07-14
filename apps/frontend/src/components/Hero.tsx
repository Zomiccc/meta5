import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import AdvancedChart from './tradingview/AdvancedChart';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-bn-bg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(240,185,11,0.08),transparent_40%)]" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] bg-[radial-gradient(circle_at_bottom_left,rgba(14,203,129,0.06),transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="animate-slide-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-bn border border-yellow/20 bg-yellow/10 px-3 py-1.5 sm:px-4">
              <span className="h-2 w-2 animate-pulse rounded-full bg-bnGreen" />
              <span className="text-[11px] font-medium text-yellow sm:text-xs">Trusted by 200,000+ traders worldwide</span>
            </div>
            <h1 className="text-3xl font-bold leading-tight text-bnText-primary sm:text-4xl md:text-5xl lg:text-6xl">
              Trade Forex, Crypto, Stocks & More with{' '}
              <span className="text-yellow">FXONS</span>
            </h1>
            <p className="mt-5 text-base text-bnText-secondary sm:text-lg md:mt-6">
              Access 1,000+ global instruments on MetaTrader 5. Ultra-low spreads, lightning-fast execution, and instant crypto deposits.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row md:mt-8">
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 rounded-bn bg-yellow px-5 py-3 text-sm font-semibold text-black transition hover:bg-yellow-hover"
              >
                Open Live Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/markets"
                className="rounded-bn border border-bn-border bg-bn-secondary px-5 py-3 text-center text-sm font-medium text-bnText-primary transition hover:border-yellow hover:text-yellow"
              >
                View Live Markets
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 md:mt-12 md:gap-6">
              {[
                { label: 'Spreads from', value: '0.0 pips' },
                { label: 'Min deposit', value: '$10' },
                { label: 'Max leverage', value: '1:1000' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-lg font-bold text-bnText-primary sm:text-2xl">{stat.value}</p>
                  <p className="text-[10px] text-bnText-muted sm:text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-bnText-muted sm:text-sm md:mt-8">
              <ShieldCheck className="h-4 w-4 text-yellow" />
              Segregated client funds · Negative balance protection
            </div>
          </div>

          <div className="animate-fade">
            <div className="h-[320px] overflow-hidden rounded-bn border border-bn-border bg-bn-card p-2 shadow-bn-lg sm:h-[380px] md:h-[460px]">
              <AdvancedChart symbol="OANDA:XAUUSD" height={320} />
            </div>
            <p className="mt-2 text-center text-xs text-bnText-muted">Live prices powered by global liquidity providers</p>
          </div>
        </div>
      </div>
    </section>
  );
}
