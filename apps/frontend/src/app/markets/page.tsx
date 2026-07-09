'use client';

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdvancedChart from '../../components/tradingview/AdvancedChart';
import MiniChart from '../../components/tradingview/MiniChart';
import Link from 'next/link';

const categories: Record<string, { label: string; symbol: string }[]> = {
  Forex: [
    { label: 'EUR/USD', symbol: 'FX:EURUSD' },
    { label: 'GBP/USD', symbol: 'FX:GBPUSD' },
    { label: 'USD/JPY', symbol: 'FX:USDJPY' },
    { label: 'AUD/USD', symbol: 'FX:AUDUSD' },
    { label: 'USD/CAD', symbol: 'FX:USDCAD' },
    { label: 'USD/CHF', symbol: 'FX:USDCHF' },
    { label: 'NZD/USD', symbol: 'FX:NZDUSD' },
    { label: 'EUR/GBP', symbol: 'FX:EURGBP' },
    { label: 'EUR/JPY', symbol: 'FX:EURJPY' },
    { label: 'GBP/JPY', symbol: 'FX:GBPJPY' },
    { label: 'AUD/JPY', symbol: 'FX:AUDJPY' },
    { label: 'EUR/CHF', symbol: 'FX:EURCHF' },
  ],
  Crypto: [
    { label: 'BTC/USD', symbol: 'BITSTAMP:BTCUSD' },
    { label: 'ETH/USD', symbol: 'BITSTAMP:ETHUSD' },
    { label: 'SOL/USDT', symbol: 'BINANCE:SOLUSDT' },
    { label: 'XRP/USDT', symbol: 'BINANCE:XRPUSDT' },
    { label: 'BNB/USDT', symbol: 'BINANCE:BNBUSDT' },
    { label: 'DOGE/USDT', symbol: 'BINANCE:DOGEUSDT' },
    { label: 'ADA/USDT', symbol: 'BINANCE:ADAUSDT' },
    { label: 'AVAX/USDT', symbol: 'BINANCE:AVAXUSDT' },
    { label: 'DOT/USDT', symbol: 'BINANCE:DOTUSDT' },
    { label: 'LINK/USDT', symbol: 'BINANCE:LINKUSDT' },
    { label: 'LTC/USDT', symbol: 'BINANCE:LTCUSDT' },
    { label: 'MATIC/USDT', symbol: 'BINANCE:MATICUSDT' },
  ],
  Indices: [
    { label: 'S&P 500', symbol: 'FOREXCOM:SPXUSD' },
    { label: 'Nasdaq 100', symbol: 'FOREXCOM:NSXUSD' },
    { label: 'Dow 30', symbol: 'FOREXCOM:DJI' },
    { label: 'DAX 40', symbol: 'INDEX:DEU40' },
    { label: 'FTSE 100', symbol: 'OANDA:UK100GBP' },
    { label: 'Nikkei 225', symbol: 'INDEX:NKY' },
    { label: 'CAC 40', symbol: 'OANDA:FR40EUR' },
    { label: 'ASX 200', symbol: 'OANDA:AU200AUD' },
    { label: 'Hang Seng', symbol: 'OANDA:HK33HKD' },
    { label: 'Euro Stoxx 50', symbol: 'OANDA:EU50EUR' },
    { label: 'Russell 2000', symbol: 'OANDA:US2000USD' },
    { label: 'VIX', symbol: 'TVC:VIX' },
  ],
  Commodities: [
    { label: 'Gold', symbol: 'OANDA:XAUUSD' },
    { label: 'Silver', symbol: 'OANDA:XAGUSD' },
    { label: 'Crude Oil', symbol: 'TVC:USOIL' },
    { label: 'Brent Oil', symbol: 'TVC:UKOIL' },
    { label: 'Natural Gas', symbol: 'NYMEX:NG1!' },
    { label: 'Copper', symbol: 'COMEX:HG1!' },
    { label: 'Platinum', symbol: 'TVC:PLATINUM' },
    { label: 'Palladium', symbol: 'TVC:PALLADIUM' },
    { label: 'Corn', symbol: 'CBOT:ZC1!' },
    { label: 'Wheat', symbol: 'CBOT:ZW1!' },
    { label: 'Coffee', symbol: 'ICEUS:KC1!' },
    { label: 'Sugar', symbol: 'ICEUS:SB1!' },
  ],
  Stocks: [
    { label: 'Apple', symbol: 'NASDAQ:AAPL' },
    { label: 'Tesla', symbol: 'NASDAQ:TSLA' },
    { label: 'Nvidia', symbol: 'NASDAQ:NVDA' },
    { label: 'Amazon', symbol: 'NASDAQ:AMZN' },
    { label: 'Microsoft', symbol: 'NASDAQ:MSFT' },
    { label: 'Meta', symbol: 'NASDAQ:META' },
    { label: 'Alphabet', symbol: 'NASDAQ:GOOGL' },
    { label: 'Netflix', symbol: 'NASDAQ:NFLX' },
    { label: 'AMD', symbol: 'NASDAQ:AMD' },
    { label: 'JPMorgan', symbol: 'NYSE:JPM' },
    { label: 'Visa', symbol: 'NYSE:V' },
    { label: 'Disney', symbol: 'NYSE:DIS' },
  ],
};

export default function MarketsPage() {
  const [category, setCategory] = useState<keyof typeof categories>('Forex');
  const [active, setActive] = useState(categories.Forex[0]);

  const onCategory = (cat: keyof typeof categories) => {
    setCategory(cat);
    setActive(categories[cat][0]);
  };

  return (
    <div className="min-h-screen bg-navy-950">
      <Navbar />

      <section className="border-b border-navy-800/60 bg-navy-900/30 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <span className="text-xs font-medium text-gold-light">Real-time market data</span>
          </div>
          <h1 className="text-3xl font-bold text-white md:text-4xl">Live Markets</h1>
          <p className="mt-3 max-w-2xl text-white/50">
            Track real-time prices across forex, crypto, indices, commodities and global stocks. Open an account to trade any of these on MetaTrader 5.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-6">
          {/* Category tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {Object.keys(categories).map((cat) => (
              <button
                key={cat}
                onClick={() => onCategory(cat as keyof typeof categories)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  category === cat ? 'bg-gold text-navy-950' : 'bg-navy-800/60 text-white/70 hover:bg-navy-700/60 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Symbol list */}
            <div className="lg:col-span-1">
              <div className="space-y-2">
                {categories[category].map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => setActive(item)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      active.symbol === item.symbol
                        ? 'border-gold/50 bg-gold/10'
                        : 'border-navy-700/50 bg-navy-900/40 hover:border-navy-600'
                    }`}
                  >
                    <p className="font-semibold text-white">{item.label}</p>
                    <div className="mt-2">
                      <MiniChart symbol={item.symbol} height={80} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main chart */}
            <div className="lg:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{active.label}</h2>
                <Link href="/register" className="btn-gold text-sm">Trade {active.label}</Link>
              </div>
              <AdvancedChart symbol={active.symbol} height={560} />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
