'use client';

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AdvancedChart from '../../components/tradingview/AdvancedChart';
import MiniChart from '../../components/tradingview/MiniChart';
import LiveMarketStrip from '../../components/LiveMarketStrip';
import Link from 'next/link';

const categories: Record<string, { label: string; symbol: string }[]> = {
  'Popular Crypto': [
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
    { label: 'GOLD', symbol: 'FX:XAUUSD' },
  ],
  Stocks: [
    { label: 'Apple', symbol: 'NASDAQ:AAPL' },
    { label: 'Tesla', symbol: 'NASDAQ:TSLA' },
    { label: 'Nvidia', symbol: 'NASDAQ:NVDA' },
    { label: 'Amazon', symbol: 'NASDAQ:AMZN' },
    { label: 'Microsoft', symbol: 'NASDAQ:MSFT' },
    { label: 'Meta', symbol: 'NASDAQ:META' },
    { label: 'Alphabet', symbol: 'NASDAQ:GOOGL' },
  ],
  Indices: [
    { label: 'S&P 500', symbol: 'FOREXCOM:SPXUSD' },
    { label: 'Nasdaq 100', symbol: 'FOREXCOM:NSXUSD' },
    { label: 'Dow 30', symbol: 'FOREXCOM:DJI' },
    { label: 'DAX 40', symbol: 'INDEX:DEU40' },
    { label: 'FTSE 100', symbol: 'OANDA:UK100GBP' },
  ],
  'DeFi Tokens': [
    { label: 'UNI/USDT', symbol: 'BINANCE:UNIUSDT' },
    { label: 'AAVE/USDT', symbol: 'BINANCE:AAVEUSDT' },
    { label: 'MKR/USDT', symbol: 'BINANCE:MKRUSDT' },
    { label: 'DOT/USDT', symbol: 'BINANCE:DOTUSDT' },
    { label: 'LINK/USDT', symbol: 'BINANCE:LINKUSDT' },
    { label: 'GRT/USDT', symbol: 'BINANCE:GRTUSDT' },
    { label: 'SAND/USDT', symbol: 'BINANCE:SANDUSDT' },
    { label: 'AXS/USDT', symbol: 'BINANCE:AXSUSDT' },
  ],
  'Layer 1': [
    { label: 'SOL/USDT', symbol: 'BINANCE:SOLUSDT' },
    { label: 'AVAX/USDT', symbol: 'BINANCE:AVAXUSDT' },
    { label: 'ATOM/USDT', symbol: 'BINANCE:ATOMUSDT' },
    { label: 'NEAR/USDT', symbol: 'BINANCE:NEARUSDT' },
    { label: 'SUI/USDT', symbol: 'BINANCE:SUIUSDT' },
    { label: 'APT/USDT', symbol: 'BINANCE:APTUSDT' },
    { label: 'INJ/USDT', symbol: 'BINANCE:INJUSDT' },
    { label: 'ETC/USDT', symbol: 'BINANCE:ETCUSDT' },
  ],
  'Layer 2': [
    { label: 'ARB/USDT', symbol: 'BINANCE:ARBUSDT' },
    { label: 'OP/USDT', symbol: 'BINANCE:OPUSDT' },
    { label: 'MATIC/USDT', symbol: 'BINANCE:MATICUSDT' },
  ],
  'Other Coins': [
    { label: 'TRX/USDT', symbol: 'BINANCE:TRXUSDT' },
    { label: 'BCH/USDT', symbol: 'BINANCE:BCHUSDT' },
    { label: 'XLM/USDT', symbol: 'BINANCE:XLMUSDT' },
    { label: 'FIL/USDT', symbol: 'BINANCE:FILUSDT' },
    { label: 'LTC/USDT', symbol: 'BINANCE:LTCUSDT' },
  ],
};

export default function MarketsPage() {
  const [category, setCategory] = useState<keyof typeof categories>('Popular Crypto');
  const [active, setActive] = useState(categories['Popular Crypto'][0]);

  const onCategory = (cat: keyof typeof categories) => {
    setCategory(cat);
    setActive(categories[cat][0]);
  };

  return (
    <div className="min-h-screen bg-bn-bg">
      <Navbar />

      <section className="border-b border-bn-border bg-bn-secondary/30 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow/20 bg-yellow/5 px-3 py-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-bnGreen" />
            <span className="text-xs font-medium text-yellow">Real-time market data</span>
          </div>
          <h1 className="text-3xl font-bold text-bnText-primary md:text-4xl">Live Markets</h1>
          <p className="mt-3 max-w-2xl text-bnText-secondary">
            Track real-time prices across forex, crypto, stocks and indices. Open an account to trade 1,000+ instruments on MetaTrader 5.
          </p>
        </div>
      </section>

      <LiveMarketStrip />

      <section className="py-10">
        <div className="mx-auto max-w-7xl px-6">
          {/* Category tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {Object.keys(categories).map((cat) => (
              <button
                key={cat}
                onClick={() => onCategory(cat as keyof typeof categories)}
                className={`rounded-bn px-4 py-2 text-sm font-medium transition ${
                  category === cat ? 'bg-yellow text-bn-bg' : 'bg-bn-input/60 text-bnText-secondary hover:bg-bn-border/60 hover:text-bnText-primary'
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
                    className={`w-full rounded-bn border p-4 text-left transition ${
                      active.symbol === item.symbol
                        ? 'border-yellow bg-yellow/10'
                        : 'border-bn-border bg-bn-card hover:border-bn-border'
                    }`}
                  >
                    <p className="font-semibold text-bnText-primary">{item.label}</p>
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
                <h2 className="text-xl font-bold text-bnText-primary">{active.label}</h2>
                <Link href="/register" className="bn-btn-primary text-sm">Trade {active.label}</Link>
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
