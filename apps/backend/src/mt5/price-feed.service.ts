import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Map internal symbols to Binance ticker symbols for crypto (free, no key)
const BINANCE_SYMBOL_MAP: Record<string, string> = {
  'BINANCE:SOLUSDT': 'SOLUSDT',
  'BINANCE:XRPUSDT': 'XRPUSDT',
  'BINANCE:BNBUSDT': 'BNBUSDT',
  'BINANCE:DOGEUSDT': 'DOGEUSDT',
  'BINANCE:ADAUSDT': 'ADAUSDT',
  'BINANCE:AVAXUSDT': 'AVAXUSDT',
  'BINANCE:DOTUSDT': 'DOTUSDT',
  'BINANCE:MATICUSDT': 'MATICUSDT',
  'BINANCE:LINKUSDT': 'LINKUSDT',
  'BINANCE:LTCUSDT': 'LTCUSDT',
  'BINANCE:TRXUSDT': 'TRXUSDT',
  'BINANCE:BCHUSDT': 'BCHUSDT',
  'BINANCE:ATOMUSDT': 'ATOMUSDT',
  'BINANCE:UNIUSDT': 'UNIUSDT',
  'BINANCE:XLMUSDT': 'XLMUSDT',
  'BINANCE:ETCUSDT': 'ETCUSDT',
  'BINANCE:FILUSDT': 'FILUSDT',
  'BINANCE:APTUSDT': 'APTUSDT',
  'BINANCE:ARBUSDT': 'ARBUSDT',
  'BINANCE:OPUSDT': 'OPUSDT',
  'BINANCE:NEARUSDT': 'NEARUSDT',
  'BINANCE:INJUSDT': 'INJUSDT',
  'BINANCE:SUIUSDT': 'SUIUSDT',
  'BINANCE:AAVEUSDT': 'AAVEUSDT',
  'BINANCE:MKRUSDT': 'MKRUSDT',
  'BINANCE:SANDUSDT': 'SANDUSDT',
  'BINANCE:AXSUSDT': 'AXSUSDT',
  'BINANCE:GRTUSDT': 'GRTUSDT',
  'BITSTAMP:BTCUSD': 'BTCUSDT',
  'BITSTAMP:ETHUSD': 'ETHUSDT',
};

// Coinbase spot fallback (free, no key) — format: BTC-USD
const COINBASE_SYMBOL_MAP: Record<string, string> = {
  'BITSTAMP:BTCUSD': 'BTC-USD',
  'BITSTAMP:ETHUSD': 'ETH-USD',
  'BINANCE:SOLUSDT': 'SOL-USD',
  'BINANCE:XRPUSDT': 'XRP-USD',
  'BINANCE:BNBUSDT': 'BNB-USD',
  'BINANCE:ADAUSDT': 'ADA-USD',
  'BINANCE:AVAXUSDT': 'AVAX-USD',
  'BINANCE:DOTUSDT': 'DOT-USD',
  'BINANCE:LINKUSDT': 'LINK-USD',
  'BINANCE:LTCUSDT': 'LTC-USD',
  'BINANCE:BCHUSDT': 'BCH-USD',
  'BINANCE:ATOMUSDT': 'ATOM-USD',
  'BINANCE:UNIUSDT': 'UNI-USD',
  'BINANCE:XLMUSDT': 'XLM-USD',
  'BINANCE:ETCUSDT': 'ETC-USD',
  'BINANCE:FILUSDT': 'FIL-USD',
  'BINANCE:APTUSDT': 'APT-USD',
  'BINANCE:ARBUSDT': 'ARB-USD',
  'BINANCE:OPUSDT': 'OP-USD',
  'BINANCE:NEARUSDT': 'NEAR-USD',
  'BINANCE:INJUSDT': 'INJ-USD',
  'BINANCE:SUIUSDT': 'SUI-USD',
  'BINANCE:AAVEUSDT': 'AAVE-USD',
  'BINANCE:MKRUSDT': 'MKR-USD',
};

// CryptoCompare fallback (free, no key) — fsym for USD
const CRYPTOCOMPARE_SYMBOL_MAP: Record<string, string> = {
  'BITSTAMP:BTCUSD': 'BTC',
  'BITSTAMP:ETHUSD': 'ETH',
  'BINANCE:SOLUSDT': 'SOL',
  'BINANCE:XRPUSDT': 'XRP',
  'BINANCE:BNBUSDT': 'BNB',
  'BINANCE:DOGEUSDT': 'DOGE',
  'BINANCE:ADAUSDT': 'ADA',
  'BINANCE:AVAXUSDT': 'AVAX',
  'BINANCE:DOTUSDT': 'DOT',
  'BINANCE:MATICUSDT': 'MATIC',
  'BINANCE:LINKUSDT': 'LINK',
  'BINANCE:LTCUSDT': 'LTC',
  'BINANCE:TRXUSDT': 'TRX',
  'BINANCE:BCHUSDT': 'BCH',
  'BINANCE:ATOMUSDT': 'ATOM',
  'BINANCE:UNIUSDT': 'UNI',
  'BINANCE:XLMUSDT': 'XLM',
  'BINANCE:ETCUSDT': 'ETC',
  'BINANCE:FILUSDT': 'FIL',
  'BINANCE:APTUSDT': 'APT',
  'BINANCE:ARBUSDT': 'ARB',
  'BINANCE:OPUSDT': 'OP',
  'BINANCE:NEARUSDT': 'NEAR',
  'BINANCE:INJUSDT': 'INJ',
  'BINANCE:SUIUSDT': 'SUI',
  'BINANCE:AAVEUSDT': 'AAVE',
  'BINANCE:MKRUSDT': 'MKR',
  'BINANCE:SANDUSDT': 'SAND',
  'BINANCE:AXSUSDT': 'AXS',
  'BINANCE:GRTUSDT': 'GRT',
};

// CoinGecko fallback (global, free, no key) — ids for USD price
const COINGECKO_SYMBOL_MAP: Record<string, string> = {
  'BITSTAMP:BTCUSD': 'bitcoin',
  'BITSTAMP:ETHUSD': 'ethereum',
  'BINANCE:SOLUSDT': 'solana',
  'BINANCE:XRPUSDT': 'ripple',
  'BINANCE:BNBUSDT': 'binancecoin',
  'BINANCE:DOGEUSDT': 'dogecoin',
  'BINANCE:ADAUSDT': 'cardano',
  'BINANCE:AVAXUSDT': 'avalanche-2',
  'BINANCE:DOTUSDT': 'polkadot',
  'BINANCE:MATICUSDT': 'matic-network',
  'BINANCE:LINKUSDT': 'chainlink',
  'BINANCE:LTCUSDT': 'litecoin',
  'BINANCE:TRXUSDT': 'tron',
  'BINANCE:BCHUSDT': 'bitcoin-cash',
  'BINANCE:ATOMUSDT': 'cosmos',
  'BINANCE:UNIUSDT': 'uniswap',
  'BINANCE:XLMUSDT': 'stellar',
  'BINANCE:ETCUSDT': 'ethereum-classic',
  'BINANCE:FILUSDT': 'filecoin',
  'BINANCE:APTUSDT': 'aptos',
  'BINANCE:ARBUSDT': 'arbitrum',
  'BINANCE:OPUSDT': 'optimism',
  'BINANCE:NEARUSDT': 'near',
  'BINANCE:INJUSDT': 'injective-protocol',
  'BINANCE:SUIUSDT': 'sui',
  'BINANCE:AAVEUSDT': 'aave',
  'BINANCE:MKRUSDT': 'maker',
  'BINANCE:SANDUSDT': 'the-sandbox',
  'BINANCE:AXSUSDT': 'axie-infinity',
  'BINANCE:GRTUSDT': 'the-graph',
};

// Map internal symbols to Twelve Data format (primary source for all instrument types)
const TWELVE_DATA_SYMBOL_MAP: Record<string, string> = {
  // Forex
  'FX:EURUSD': 'EUR/USD',
  'FX:GBPUSD': 'GBP/USD',
  'FX:USDJPY': 'USD/JPY',
  'FX:AUDUSD': 'AUD/USD',
  'FX:USDCAD': 'USD/CAD',
  'FX:USDCHF': 'USD/CHF',
  'FX:NZDUSD': 'NZD/USD',
  'FX:EURGBP': 'EUR/GBP',
  'FX:EURJPY': 'EUR/JPY',
  'FX:GBPJPY': 'GBP/JPY',
  'FX:XAUUSD': 'XAU/USD',
  // Crypto
  'BITSTAMP:BTCUSD': 'BTC/USD',
  'BITSTAMP:ETHUSD': 'ETH/USD',
  'BINANCE:BNBUSDT': 'BNB/USD',
  'BINANCE:XRPUSDT': 'XRP/USD',
  'BINANCE:SOLUSDT': 'SOL/USD',
  // Stocks
  'NASDAQ:AAPL': 'AAPL',
  'NASDAQ:TSLA': 'TSLA',
  'NASDAQ:NVDA': 'NVDA',
  'NASDAQ:AMZN': 'AMZN',
  'NASDAQ:MSFT': 'MSFT',
  'NASDAQ:META': 'META',
  'NASDAQ:GOOGL': 'GOOGL',
  // Indices
  'FOREXCOM:SPXUSD': 'SPX',
  'FOREXCOM:NSXUSD': 'NDX',
  'FOREXCOM:DJI': 'DJI',
  'INDEX:DEU40': 'DAX',
  'OANDA:UK100GBP': 'FTSE',
};

interface PriceCacheEntry {
  price: number;
  timestamp: number;
}

@Injectable()
export class PriceFeedService {
  private readonly logger = new Logger(PriceFeedService.name);
  private readonly twelveDataApiKey?: string;
  private readonly priceProxyUrl?: string;
  private readonly simulatePrices: boolean;
  private readonly priceCache = new Map<string, PriceCacheEntry>();
  private static readonly CACHE_TTL_MS = 300; // 300ms max cache for faster tick updates
  // Tracks symbols whose current price comes from simulation (global or fallback)
  private readonly simulatedSymbols = new Set<string>();
  // Seed per symbol so simulated prices are consistent but jitter over time
  private readonly simulatedSeeds = new Map<string, number>();
  private readonly simulateOnFailure: boolean;
  // Cache OHLC history for a few minutes to avoid hitting CoinGecko rate limits
  private readonly historyCache = new Map<string, { data: { time: number; open: number; high: number; low: number; close: number }[]; timestamp: number }>();
  private static readonly HISTORY_CACHE_TTL_MS = 5 * 60 * 1000;
  // Keep the last known real price so we can return it when live APIs fail instead of going blank
  private readonly lastKnownPrice = new Map<string, { price: number; timestamp: number }>();
  private static readonly LAST_KNOWN_TTL_MS = 30 * 60 * 1000;

  constructor(private readonly configService: ConfigService) {
    this.twelveDataApiKey = (this.configService.get<string>('TWELVE_DATA_API_KEY') || '').trim() || undefined;
    this.priceProxyUrl = (this.configService.get<string>('PRICE_PROXY_URL') || '').trim() || undefined;
    this.simulatePrices = this.configService.get<string>('SIMULATE_PRICES') === 'true';
    this.simulateOnFailure = this.configService.get<string>('SIMULATE_ON_FAILURE') === 'true';

    if (this.twelveDataApiKey) this.logger.log('Twelve Data API configured');
    if (this.simulatePrices) this.logger.warn('SIMULATE_PRICES=true — prices are simulated.');
    if (this.simulateOnFailure) this.logger.warn('SIMULATE_ON_FAILURE=true — prices will be simulated when real APIs fail.');
  }

  isConfigured(): boolean {
    return !!this.twelveDataApiKey || this.simulatePrices;
  }

  private isBinanceSymbol(symbol: string): boolean {
    return !!BINANCE_SYMBOL_MAP[symbol];
  }

  private isCoinbaseSymbol(symbol: string): boolean {
    return !!COINBASE_SYMBOL_MAP[symbol];
  }

  private isCryptoCompareSymbol(symbol: string): boolean {
    return !!CRYPTOCOMPARE_SYMBOL_MAP[symbol];
  }

  private isCoinGeckoSymbol(symbol: string): boolean {
    return !!COINGECKO_SYMBOL_MAP[symbol];
  }

  private isForexSymbol(symbol: string): boolean {
    return symbol.startsWith('FX:');
  }

  private isStockSymbol(symbol: string): boolean {
    return symbol.startsWith('NASDAQ:') || symbol.startsWith('NYSE:');
  }

  private isIndexSymbol(symbol: string): boolean {
    return symbol.startsWith('FOREXCOM:') || symbol.startsWith('INDEX:') || symbol.startsWith('OANDA:UK');
  }

  async getPrice(symbol: string, basePrice = 0): Promise<number | null> {
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < PriceFeedService.CACHE_TTL_MS) {
      return cached.price;
    }

    let price: number | null = null;
    let source = 'none';

    if (this.twelveDataApiKey && TWELVE_DATA_SYMBOL_MAP[symbol]) {
      price = await this.fetchTwelveDataPrice(symbol);
      if (price !== null) source = 'twelvedata';
    }

    if (price === null && this.isBinanceSymbol(symbol)) {
      price = await this.fetchBinancePrice(symbol);
      if (price !== null) source = 'binance';
    }

    if (price === null && this.isCoinbaseSymbol(symbol)) {
      price = await this.fetchCoinbasePrice(symbol);
      if (price !== null) source = 'coinbase';
    }

    if (price === null && this.isCryptoCompareSymbol(symbol)) {
      price = await this.fetchCryptoComparePrice(symbol);
      if (price !== null) source = 'cryptocompare';
    }

    if (price === null && this.isForexSymbol(symbol)) {
      price = await this.fetchForexFallback(symbol);
      if (price !== null) source = 'exchangerate';
    }

    if (price === null && (this.isStockSymbol(symbol) || this.isIndexSymbol(symbol))) {
      price = await this.fetchYahooFallback(symbol);
      if (price !== null) source = 'yahoo';
    }

    if (price === null && this.isCoinGeckoSymbol(symbol)) {
      price = await this.fetchCoinGeckoPrice(symbol);
      if (price !== null) source = 'coingecko';
    }

    // Twelve Data fallback for any mapped symbol
    if (price === null && this.twelveDataApiKey && TWELVE_DATA_SYMBOL_MAP[symbol]) {
      price = await this.fetchTwelveDataPrice(symbol);
      if (price !== null) source = 'twelvedata';
    }

    if (price !== null) {
      this.logger.log(`Price ${symbol} = ${price} (source: ${source})`);
    }

    if (price === null) {
      const lastKnown = this.lastKnownPrice.get(symbol);
      if (lastKnown && Date.now() - lastKnown.timestamp < PriceFeedService.LAST_KNOWN_TTL_MS) {
        price = lastKnown.price;
        this.logger.debug(`Using last known price for ${symbol}: ${price}`);
      }
    }

    if (price === null && (this.simulatePrices || this.simulateOnFailure)) {
      price = this.simulatePrice(symbol, basePrice || this.getBasePrice(symbol));
      this.simulatedSymbols.add(symbol);
      this.logger.debug(`Using simulated fallback for ${symbol}`);
    } else if (price !== null && this.simulatePrices) {
      this.simulatedSymbols.add(symbol);
    } else {
      this.simulatedSymbols.delete(symbol);
    }

    if (price !== null) {
      this.priceCache.set(symbol, { price, timestamp: Date.now() });
      this.lastKnownPrice.set(symbol, { price, timestamp: Date.now() });
    }

    return price;
  }

  private getBasePrice(symbol: string): number {
    // Fallback base prices so simulated mode has something to drift from
    const defaults: Record<string, number> = {
      // Forex
      'FX:EURUSD': 1.0856, 'FX:GBPUSD': 1.2734, 'FX:USDJPY': 148.32, 'FX:AUDUSD': 0.6580,
      'FX:USDCAD': 1.3620, 'FX:USDCHF': 0.8810, 'FX:NZDUSD': 0.6120, 'FX:EURGBP': 0.8530,
      'FX:EURJPY': 161.10, 'FX:GBPJPY': 188.90, 'FX:XAUUSD': 2350,
      // Crypto
      'BITSTAMP:BTCUSD': 43210, 'BITSTAMP:ETHUSD': 2280,
      'BINANCE:SOLUSDT': 102.5, 'BINANCE:XRPUSDT': 0.62, 'BINANCE:BNBUSDT': 312,
      'BINANCE:DOGEUSDT': 0.088, 'BINANCE:ADAUSDT': 0.52, 'BINANCE:AVAXUSDT': 36.5,
      'BINANCE:DOTUSDT': 7.4, 'BINANCE:MATICUSDT': 0.82, 'BINANCE:LINKUSDT': 15.2,
      'BINANCE:LTCUSDT': 72.5, 'BINANCE:TRXUSDT': 0.108, 'BINANCE:BCHUSDT': 245,
      'BINANCE:ATOMUSDT': 9.8, 'BINANCE:UNIUSDT': 6.4, 'BINANCE:XLMUSDT': 0.115,
      'BINANCE:ETCUSDT': 26.3, 'BINANCE:FILUSDT': 5.6, 'BINANCE:APTUSDT': 8.9,
      'BINANCE:ARBUSDT': 1.15, 'BINANCE:OPUSDT': 2.35, 'BINANCE:NEARUSDT': 3.1,
      'BINANCE:INJUSDT': 34.5, 'BINANCE:SUIUSDT': 1.45, 'BINANCE:AAVEUSDT': 92,
      'BINANCE:MKRUSDT': 1550, 'BINANCE:SANDUSDT': 0.48, 'BINANCE:AXSUSDT': 7.2,
      'BINANCE:GRTUSDT': 0.18,
      // Stocks
      'NASDAQ:AAPL': 195, 'NASDAQ:TSLA': 210, 'NASDAQ:NVDA': 720,
      'NASDAQ:AMZN': 178, 'NASDAQ:MSFT': 415, 'NASDAQ:META': 480, 'NASDAQ:GOOGL': 152,
      // Indices
      'FOREXCOM:SPXUSD': 5123, 'FOREXCOM:NSXUSD': 17950, 'FOREXCOM:DJI': 38650,
      'INDEX:DEU40': 16900, 'OANDA:UK100GBP': 7620,
    };
    return defaults[symbol] || 100;
  }

  private simulatePrice(symbol: string, basePrice: number): number | null {
    if (!basePrice) return null;
    let seed = this.simulatedSeeds.get(symbol);
    if (!seed) {
      // deterministic seed from symbol chars
      seed = symbol.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      this.simulatedSeeds.set(symbol, seed);
    }
    // pseudo-random drift using time + seed (small movement, ~0.02% per tick)
    const now = Date.now();
    const t = Math.floor(now / 300);
    const sin = Math.sin((t + seed) * 0.5);
    const cos = Math.cos((t + seed) * 0.7);
    const noise = (sin + cos) * 0.0005;
    return Number((basePrice * (1 + noise)).toFixed(symbol.startsWith('FX:') ? 5 : 2));
  }

  async getPrices(symbols: string[], basePrices: Record<string, number> = {}): Promise<Record<string, number>> {
    const results: Record<string, number> = {};

    if (this.priceProxyUrl && symbols.length > 0) {
      try {
        const proxyResults = await this.fetchFromProxy(symbols);
        Object.assign(results, proxyResults);
      } catch (err: any) {
        this.logger.warn(`Price proxy failed: ${err.message}`);
      }
    }

    if (this.twelveDataApiKey) {
      const mapped = symbols.filter((symbol) => results[symbol] === undefined && TWELVE_DATA_SYMBOL_MAP[symbol]);
      for (let index = 0; index < mapped.length; index += 50) {
        const batch = await this.fetchTwelveDataPrices(mapped.slice(index, index + 50));
        Object.assign(results, batch);
      }
    }

    // Batch forex fallback for any unresolved forex symbols
    const forexRemaining = symbols.filter((s) => results[s] === undefined && this.isForexSymbol(s));
    if (forexRemaining.length > 0) {
      const forexPromises = forexRemaining.map(async (symbol) => {
        const price = await this.fetchForexFallback(symbol);
        if (price !== null) results[symbol] = price;
      });
      await Promise.all(forexPromises);
    }

    // Batch Yahoo fallback for any unresolved stock/index symbols
    const stockRemaining = symbols.filter((s) => results[s] === undefined && (this.isStockSymbol(s) || this.isIndexSymbol(s)));
    if (stockRemaining.length > 0) {
      const stockPromises = stockRemaining.map(async (symbol) => {
        const price = await this.fetchYahooFallback(symbol);
        if (price !== null) results[symbol] = price;
      });
      await Promise.all(stockPromises);
    }

    const remaining = symbols.filter((s) => results[s] === undefined);
    const promises = remaining.map(async (symbol) => {
      const price = await this.getPrice(symbol, basePrices[symbol] || this.getBasePrice(symbol));
      if (price !== null) results[symbol] = price;
    });
    await Promise.all(promises);
    return results;
  }

  private async fetchFromProxy(symbols: string[]): Promise<Record<string, number>> {
    const url = `${this.priceProxyUrl}/prices`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
    const data = await res.json() as any;
    const map: Record<string, number> = {};
    for (const [symbol, info] of Object.entries(data?.prices || {})) {
      const p = (info as any)?.price;
      if (typeof p === 'number' && p > 0) {
        map[symbol] = p;
        this.priceCache.set(symbol, { price: p, timestamp: Date.now() });
        this.lastKnownPrice.set(symbol, { price: p, timestamp: Date.now() });
      }
    }
    this.logger.log(`Proxy returned ${Object.keys(map).length}/${symbols.length} prices`);
    return map;
  }

  async getHistory(symbol: string, days = 1, interval?: string): Promise<{ time: number; open: number; high: number; low: number; close: number }[]> {
    const cacheKey = `${symbol}:${days}:${interval || 'auto'}`;
    const cached = this.historyCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < PriceFeedService.HISTORY_CACHE_TTL_MS) {
      return cached.data;
    }

    let data: { time: number; open: number; high: number; low: number; close: number }[] | null = null;

    if (!data && this.twelveDataApiKey && TWELVE_DATA_SYMBOL_MAP[symbol]) {
      data = await this.fetchTwelveDataHistory(symbol, days, interval);
    }

    if (!data && this.isBinanceSymbol(symbol)) {
      data = await this.fetchBinanceHistory(symbol, days, interval);
    }

    if (!data && this.isCoinGeckoSymbol(symbol)) {
      data = await this.fetchCoinGeckoHistory(symbol, days);
    }

    // Final fallback: generate realistic synthetic candles so charts never stay blank
    if (!data || data.length === 0) {
      data = await this.simulateHistory(symbol, interval);
      this.logger.debug(`Using synthetic history for ${symbol} (${data.length} candles)`);
    }

    if (data && data.length > 0) {
      this.historyCache.set(cacheKey, { data, timestamp: Date.now() });
    }
    return data || [];
  }

  private async fetchCoinGeckoHistory(symbol: string, days = 1): Promise<{ time: number; open: number; high: number; low: number; close: number }[] | null> {
    const cgId = COINGECKO_SYMBOL_MAP[symbol];
    if (!cgId) return null;
    try {
      const url = `https://api.coingecko.com/api/v3/coins/${cgId}/ohlc?vs_currency=usd&days=${days}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return null;
      const data = await res.json() as any;
      if (!Array.isArray(data)) return null;
      return data
        .filter((c) => Array.isArray(c) && c.length >= 5)
        .map((c) => ({
          time: Math.floor(c[0] / 1000),
          open: Number(c[1]),
          high: Number(c[2]),
          low: Number(c[3]),
          close: Number(c[4]),
        }));
    } catch (err: any) {
      this.logger.debug(`CoinGecko history fetch failed for ${symbol}: ${err.message}`);
      return null;
    }
  }

  private async fetchTwelveDataHistory(symbol: string, days = 1, interval?: string): Promise<{ time: number; open: number; high: number; low: number; close: number }[] | null> {
    const tdSymbol = TWELVE_DATA_SYMBOL_MAP[symbol];
    if (!tdSymbol || !this.twelveDataApiKey) return null;
    const actualInterval = interval || (days <= 1 ? '5min' : '1h');
    const outputsize = actualInterval === '1min' ? 1440 : actualInterval === '5min' ? 288 : actualInterval === '15min' ? 96 : actualInterval === '30min' ? 48 : actualInterval === '1h' ? 24 * days : 288;
    try {
      const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(tdSymbol)}&interval=${actualInterval}&outputsize=${outputsize}&apikey=${this.twelveDataApiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return null;
      const data = await res.json() as any;
      if (data?.status === 'error' || !Array.isArray(data?.values)) return null;
      return data.values
        .map((v: any) => ({
          time: Math.floor(new Date(v.datetime).getTime() / 1000),
          open: Number(v.open),
          high: Number(v.high),
          low: Number(v.low),
          close: Number(v.close),
        }))
        .filter((c: any) => c.open > 0 && c.high > 0 && c.low > 0 && c.close > 0)
        .reverse();
    } catch (err: any) {
      this.logger.debug(`Twelve Data history fetch failed for ${symbol}: ${err.message}`);
      return null;
    }
  }

  getPriceSource(symbol: string): string {
    if (this.simulatedSymbols.has(symbol)) return 'simulated';
    if (this.twelveDataApiKey && TWELVE_DATA_SYMBOL_MAP[symbol]) return 'twelvedata';
    if (this.isBinanceSymbol(symbol)) return 'binance';
    if (this.isCoinbaseSymbol(symbol)) return 'coinbase';
    if (this.isCryptoCompareSymbol(symbol)) return 'cryptocompare';
    if (this.isCoinGeckoSymbol(symbol)) return 'coingecko';
    return 'simulated';
  }

  isSimulated(symbol: string): boolean {
    if (this.simulatedSymbols.has(symbol)) return true;
    if (
      (this.twelveDataApiKey && !!TWELVE_DATA_SYMBOL_MAP[symbol]) ||
      this.isBinanceSymbol(symbol) ||
      this.isCoinbaseSymbol(symbol) ||
      this.isCryptoCompareSymbol(symbol) ||
      this.isCoinGeckoSymbol(symbol)
    ) {
      return false;
    }
    return this.simulatePrices;
  }

  isAnySimulated(): boolean {
    return this.simulatedSymbols.size > 0 || this.simulatePrices;
  }

  private async fetchBinancePrice(symbol: string): Promise<number | null> {
    const binanceSymbol = BINANCE_SYMBOL_MAP[symbol];
    if (!binanceSymbol) return null;

    try {
      const url = `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return null;
      const data = await res.json() as any;
      const price = Number(data?.price);
      if (isNaN(price) || price <= 0) return null;
      return price;
    } catch (err: any) {
      this.logger.debug(`Binance price fetch failed for ${symbol}: ${err.message}`);
      return null;
    }
  }

  private async fetchCoinbasePrice(symbol: string): Promise<number | null> {
    const cbSymbol = COINBASE_SYMBOL_MAP[symbol];
    if (!cbSymbol) return null;

    try {
      const url = `https://api.coinbase.com/v2/prices/${cbSymbol}/spot`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const data = await res.json() as any;
      const price = Number(data?.data?.amount);
      if (isNaN(price) || price <= 0) return null;
      return price;
    } catch (err: any) {
      this.logger.debug(`Coinbase price fetch failed for ${symbol}: ${err.message}`);
      return null;
    }
  }

  private async fetchCryptoComparePrice(symbol: string): Promise<number | null> {
    const fsym = CRYPTOCOMPARE_SYMBOL_MAP[symbol];
    if (!fsym) return null;

    try {
      const url = `https://min-api.cryptocompare.com/data/price?fsym=${fsym}&tsyms=USD`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return null;
      const data = await res.json() as any;
      const price = Number(data?.USD);
      if (isNaN(price) || price <= 0) return null;
      return price;
    } catch (err: any) {
      this.logger.debug(`CryptoCompare price fetch failed for ${symbol}: ${err.message}`);
      return null;
    }
  }

  private async fetchCoinGeckoPrice(symbol: string): Promise<number | null> {
    const cgId = COINGECKO_SYMBOL_MAP[symbol];
    if (!cgId) return null;

    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return null;
      const data = await res.json() as any;
      const price = Number(data?.[cgId]?.usd);
      if (isNaN(price) || price <= 0) return null;
      return price;
    } catch (err: any) {
      this.logger.debug(`CoinGecko price fetch failed for ${symbol}: ${err.message}`);
      return null;
    }
  }

  private async fetchTwelveDataPrices(symbols: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    if (!this.twelveDataApiKey || symbols.length === 0) return prices;

    const mappedSymbols = symbols.map((symbol) => TWELVE_DATA_SYMBOL_MAP[symbol]);
    try {
      const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(mappedSymbols.join(','))}&apikey=${this.twelveDataApiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return prices;
      const data = await res.json() as any;
      if (data?.status === 'error') return prices;

      symbols.forEach((symbol, index) => {
        const mappedSymbol = mappedSymbols[index];
        const value = symbols.length === 1 ? data?.price : data?.[mappedSymbol]?.price;
        const price = Number(value);
        if (!isNaN(price) && price > 0) {
          prices[symbol] = price;
          this.priceCache.set(symbol, { price, timestamp: Date.now() });
          this.lastKnownPrice.set(symbol, { price, timestamp: Date.now() });
          this.simulatedSymbols.delete(symbol);
        }
      });
    } catch (err: any) {
      this.logger.debug(`Twelve Data batch price fetch failed: ${err.message}`);
    }

    return prices;
  }

  private async fetchTwelveDataPrice(symbol: string): Promise<number | null> {
    const tdSymbol = TWELVE_DATA_SYMBOL_MAP[symbol];
    if (!tdSymbol) return null;

    try {
      const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(tdSymbol)}&apikey=${this.twelveDataApiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return null;
      const data = await res.json() as any;
      if (data?.status === 'error') {
        this.logger.debug(`Twelve Data error for ${symbol}: ${data?.message || data?.error}`);
        return null;
      }
      const price = Number(data?.price);
      if (isNaN(price) || price <= 0) return null;
      return price;
    } catch (err: any) {
      this.logger.debug(`Twelve Data price fetch failed for ${symbol}: ${err.message}`);
      return null;
    }
  }

  private async fetchForexFallback(symbol: string): Promise<number | null> {
    const tdSymbol = TWELVE_DATA_SYMBOL_MAP[symbol];
    if (!tdSymbol) return null;
    const [base, quote] = tdSymbol.split('/');
    if (!base || !quote) return null;

    try {
      const url = `https://api.exchangerate.host/convert?from=${base}&to=${quote}&amount=1`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return null;
      const data = await res.json() as any;
      const price = Number(data?.result);
      if (isNaN(price) || price <= 0) return null;
      return price;
    } catch (err: any) {
      this.logger.debug(`Forex fallback failed for ${symbol}: ${err.message}`);
      return null;
    }
  }

  private async fetchYahooFallback(symbol: string): Promise<number | null> {
    const tdSymbol = TWELVE_DATA_SYMBOL_MAP[symbol];
    if (!tdSymbol) return null;

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(tdSymbol)}?interval=1d&range=1d`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return null;
      const data = await res.json() as any;
      const price = Number(data?.chart?.result?.[0]?.meta?.regularMarketPrice);
      if (isNaN(price) || price <= 0) return null;
      return price;
    } catch (err: any) {
      this.logger.debug(`Yahoo fallback failed for ${symbol}: ${err.message}`);
      return null;
    }
  }

  private async fetchBinanceHistory(symbol: string, days = 1, interval?: string): Promise<{ time: number; open: number; high: number; low: number; close: number }[] | null> {
    const binanceSymbol = BINANCE_SYMBOL_MAP[symbol];
    if (!binanceSymbol) return null;

    const intervalMap: Record<string, string> = {
      '1min': '1m',
      '5min': '5m',
      '15min': '15m',
      '30min': '30m',
      '1h': '1h',
      '4h': '4h',
      '1day': '1d',
    };
    const klineInterval = intervalMap[interval || '15min'] || '15m';
    const limit = days <= 1 ? 96 : days * 24;

    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${klineInterval}&limit=${limit}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return null;
      const data = await res.json() as any[];
      if (!Array.isArray(data) || data.length === 0) return null;
      return data
        .map((c) => ({
          time: Math.floor(c[0] / 1000),
          open: Number(c[1]),
          high: Number(c[2]),
          low: Number(c[3]),
          close: Number(c[4]),
        }))
        .filter((c) => c.open > 0 && c.high > 0 && c.low > 0 && c.close > 0);
    } catch (err: any) {
      this.logger.debug(`Binance history fetch failed for ${symbol}: ${err.message}`);
      return null;
    }
  }

  private async simulateHistory(symbol: string, interval?: string): Promise<{ time: number; open: number; high: number; low: number; close: number }[]> {
    // Anchor the synthetic walk to the most recent real price so the chart
    // doesn't open with a huge gap / skyrocket candle.
    const currentPrice = await this.getPrice(symbol, this.getBasePrice(symbol));
    const basePrice = currentPrice && currentPrice > 0 ? currentPrice : this.getBasePrice(symbol);
    const seed = symbol.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const secondsPerCandle: Record<string, number> = {
      '1min': 60,
      '5min': 300,
      '15min': 900,
      '30min': 1800,
      '1h': 3600,
      '4h': 14400,
      '1day': 86400,
    };
    const candleSeconds = secondsPerCandle[interval || '15min'] || 900;
    const nowSec = Math.floor(Date.now() / 1000);
    const count = Math.floor((24 * 60 * 60) / candleSeconds); // 1 day of candles
    const candles: { time: number; open: number; high: number; low: number; close: number }[] = [];

    // Generate a random walk that ends exactly near basePrice
    let prevClose = basePrice;
    const maxMove = basePrice * 0.003; // 0.3% max move per candle
    for (let i = 0; i < count; i++) {
      const time = nowSec - (count - 1 - i) * candleSeconds;
      const t = (i + seed) * 0.3;
      const drift = Math.sin(t) * 0.0008 + Math.cos(t * 1.7) * 0.0004;
      const noise = (Math.sin(t * 3.1) + Math.cos(t * 5.7)) * 0.0015;
      const change = drift + noise;
      const open = prevClose;
      let close = open * (1 + Math.max(-0.03, Math.min(0.03, change)));
      let high = Math.max(open, close) + Math.abs(Math.sin(t * 2.3)) * maxMove;
      let low = Math.min(open, close) - Math.abs(Math.cos(t * 2.9)) * maxMove;
      // Keep the series anchored to basePrice overall
      if (i === count - 1) close = basePrice;
      if (low > high) [low, high] = [high, low];
      candles.push({ time, open, high, low, close });
      prevClose = close;
    }
    return candles;
  }
}
