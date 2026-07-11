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

// Map internal symbols to Twelve Data format
const TWELVE_DATA_SYMBOL_MAP: Record<string, string> = {
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
  'FX:AUDJPY': 'AUD/JPY',
  'FX:CHFJPY': 'CHF/JPY',
  'FX:EURCHF': 'EUR/CHF',
  'FX:EURAUD': 'EUR/AUD',
  'FX:EURCAD': 'EUR/CAD',
  'FX:GBPAUD': 'GBP/AUD',
  'FX:GBPCAD': 'GBP/CAD',
  'FX:GBPCHF': 'GBP/CHF',
  'FX:AUDCAD': 'AUD/CAD',
  'FX:AUDNZD': 'AUD/NZD',
  'FX:AUDCHF': 'AUD/CHF',
  'FX:CADJPY': 'CAD/JPY',
  'FX:NZDJPY': 'NZD/JPY',
  'FX:CADCHF': 'CAD/CHF',
  'FX:NZDCAD': 'NZD/CAD',
  'FX:EURNZD': 'EUR/NZD',
  'FX:USDMXN': 'USD/MXN',
  'FX:USDZAR': 'USD/ZAR',
  'FX:USDSGD': 'USD/SGD',
  'FX:USDTRY': 'USD/TRY',
  'OANDA:XAUUSD': 'XAU/USD',
  'OANDA:XAGUSD': 'XAG/USD',
  'TVC:USOIL': 'WTI',
  'TVC:UKOIL': 'BRENT',
  'NYMEX:NG1!': 'NG',
  'COMEX:HG1!': 'HG',
  'TVC:PLATINUM': 'PLN',
  'TVC:PALLADIUM': 'PA',
  'CBOT:ZC1!': 'ZC',
  'CBOT:ZW1!': 'ZW',
  'ICEUS:KC1!': 'KC',
  'ICEUS:SB1!': 'SB',
  'FOREXCOM:SPXUSD': 'SPX',
  'FOREXCOM:NSXUSD': 'NDX',
  'FOREXCOM:DJI': 'DJI',
  'INDEX:DEU40': 'DAX',
  'OANDA:UK100GBP': 'FTSE',
  'INDEX:NKY': 'N225',
  'OANDA:FR40EUR': 'CAC',
  'OANDA:AU200AUD': 'ASX',
  'OANDA:HK33HKD': 'HSI',
  'OANDA:EU50EUR': 'SX5E',
  'OANDA:US2000USD': 'RUT',
  'TVC:VIX': 'VIX',
  'NASDAQ:AAPL': 'AAPL',
  'NASDAQ:TSLA': 'TSLA',
  'NASDAQ:NVDA': 'NVDA',
  'NASDAQ:AMZN': 'AMZN',
  'NASDAQ:MSFT': 'MSFT',
  'NASDAQ:META': 'META',
  'NASDAQ:GOOGL': 'GOOGL',
  'NASDAQ:NFLX': 'NFLX',
  'NASDAQ:AMD': 'AMD',
  'NASDAQ:INTC': 'INTC',
  'NASDAQ:ADBE': 'ADBE',
  'NASDAQ:PYPL': 'PYPL',
  'NASDAQ:PLTR': 'PLTR',
  'NYSE:BABA': 'BABA',
  'NYSE:DIS': 'DIS',
  'NYSE:KO': 'KO',
  'NYSE:JPM': 'JPM',
  'NYSE:V': 'V',
};

interface PriceCacheEntry {
  price: number;
  timestamp: number;
}

@Injectable()
export class PriceFeedService {
  private readonly logger = new Logger(PriceFeedService.name);
  private readonly twelveDataApiKey?: string;
  private readonly currencyApiKey?: string;
  private readonly simulatePrices: boolean;
  private readonly priceCache = new Map<string, PriceCacheEntry>();
  private static readonly CACHE_TTL_MS = 2000;
  // Tracks symbols whose current price comes from simulation (global or fallback)
  private readonly simulatedSymbols = new Set<string>();
  // Seed per symbol so simulated prices are consistent but jitter over time
  private readonly simulatedSeeds = new Map<string, number>();
  private readonly simulateOnFailure: boolean;
  // Cache OHLC history for a few minutes to avoid hitting CoinGecko rate limits
  private readonly historyCache = new Map<string, { data: { time: number; open: number; high: number; low: number; close: number }[]; timestamp: number }>();
  private static readonly HISTORY_CACHE_TTL_MS = 5 * 60 * 1000;

  constructor(private readonly configService: ConfigService) {
    this.twelveDataApiKey = (this.configService.get<string>('TWELVE_DATA_API_KEY') || '').trim() || undefined;
    this.currencyApiKey = (this.configService.get<string>('CURRENCY_API_KEY') || '').trim() || undefined;
    this.simulatePrices = this.configService.get<string>('SIMULATE_PRICES') === 'true' || (!this.twelveDataApiKey && !this.currencyApiKey);
    this.simulateOnFailure = this.configService.get<string>('SIMULATE_ON_FAILURE') !== 'false'; // default true

    if (this.twelveDataApiKey) this.logger.log('Twelve Data API configured');
    if (this.currencyApiKey) this.logger.log('CurrencyAPI configured');
    if (this.simulatePrices) this.logger.warn('No real-time forex API key set — using simulated prices. Set TWELVE_DATA_API_KEY or CURRENCY_API_KEY for real prices.');
  }

  isConfigured(): boolean {
    return !!this.twelveDataApiKey || !!this.currencyApiKey || this.simulatePrices;
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

  async getPrice(symbol: string, basePrice = 0): Promise<number | null> {
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < PriceFeedService.CACHE_TTL_MS) {
      return cached.price;
    }

    let price: number | null = null;

    if (this.isBinanceSymbol(symbol)) {
      price = await this.fetchBinancePrice(symbol);
    }

    if (price === null && this.isCoinbaseSymbol(symbol)) {
      price = await this.fetchCoinbasePrice(symbol);
    }

    if (price === null && this.isCryptoCompareSymbol(symbol)) {
      price = await this.fetchCryptoComparePrice(symbol);
    }

    if (price === null && this.isCoinGeckoSymbol(symbol)) {
      price = await this.fetchCoinGeckoPrice(symbol);
    }

    if (price === null && this.twelveDataApiKey) {
      price = await this.fetchTwelveDataPrice(symbol);
    }

    if (price === null && this.currencyApiKey) {
      price = await this.fetchCurrencyApiPrice(symbol);
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
    }

    return price;
  }

  private getBasePrice(symbol: string): number {
    // Fallback base prices so simulated mode has something to drift from
    const defaults: Record<string, number> = {
      'FX:EURUSD': 1.0856, 'FX:GBPUSD': 1.2740, 'FX:USDJPY': 148.25, 'FX:AUDUSD': 0.6580,
      'FX:USDCAD': 1.3640, 'FX:USDCHF': 0.8840, 'FX:NZDUSD': 0.6120, 'FX:EURGBP': 0.8510,
      'FX:EURJPY': 160.85, 'FX:GBPJPY': 188.95, 'FX:AUDJPY': 97.55, 'FX:CHFJPY': 167.55,
      'FX:EURCHF': 0.9590, 'FX:EURAUD': 1.6500, 'FX:EURCAD': 1.4800, 'FX:GBPAUD': 1.9390,
      'FX:GBPCAD': 1.7380, 'FX:GBPCHF': 1.1260, 'FX:AUDCAD': 0.8970, 'FX:AUDNZD': 1.0750,
      'FX:AUDCHF': 0.5810, 'FX:CADJPY': 108.75, 'FX:NZDJPY': 90.75, 'FX:CADCHF': 0.6480,
      'FX:NZDCAD': 0.8340, 'FX:EURNZD': 1.7740, 'FX:USDMXN': 17.85, 'FX:USDZAR': 18.25,
      'FX:USDSGD': 1.3450, 'FX:USDTRY': 32.85,
      'OANDA:XAUUSD': 2325.50, 'OANDA:XAGUSD': 27.85, 'TVC:USOIL': 78.50, 'TVC:UKOIL': 82.50,
      'FOREXCOM:SPXUSD': 5280.00, 'FOREXCOM:NSXUSD': 18600.00, 'FOREXCOM:DJI': 39200.00,
      'INDEX:DEU40': 18200.00, 'OANDA:UK100GBP': 8200.00, 'INDEX:NKY': 39800.00,
      'NASDAQ:AAPL': 185.00, 'NASDAQ:TSLA': 245.00, 'NASDAQ:NVDA': 890.00,
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
    // pseudo-random drift using time + seed (small movement, ~0.02% per 2s)
    const now = Date.now();
    const t = Math.floor(now / 2000);
    const sin = Math.sin((t + seed) * 0.5);
    const cos = Math.cos((t + seed) * 0.7);
    const noise = (sin + cos) * 0.0005;
    return Number((basePrice * (1 + noise)).toFixed(symbol.startsWith('FX:') ? 5 : 2));
  }

  private async fetchCurrencyApiPrice(symbol: string): Promise<number | null> {
    const tdSymbol = TWELVE_DATA_SYMBOL_MAP[symbol];
    if (!tdSymbol) return null;
    // CurrencyAPI free endpoint supports base/quote pairs (e.g. EURUSD)
    const pair = tdSymbol.replace('/', '');
    try {
      const url = `https://api.currencyapi.com/v3/latest?apikey=${this.currencyApiKey}&base_currency=${pair.slice(0, 3)}&currencies=${pair.slice(3)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return null;
      const data = await res.json() as any;
      const rate = data?.data?.[pair.slice(3)]?.value;
      const price = Number(rate);
      if (isNaN(price) || price <= 0) return null;
      return price;
    } catch (err: any) {
      this.logger.debug(`CurrencyAPI fetch failed for ${symbol}: ${err.message}`);
      return null;
    }
  }

  async getPrices(symbols: string[], basePrices: Record<string, number> = {}): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    const promises = symbols.map(async (symbol) => {
      const price = await this.getPrice(symbol, basePrices[symbol] || this.getBasePrice(symbol));
      if (price !== null) results[symbol] = price;
    });
    await Promise.all(promises);
    return results;
  }

  async getHistory(symbol: string, days = 1): Promise<{ time: number; open: number; high: number; low: number; close: number }[]> {
    const cacheKey = `${symbol}:${days}`;
    const cached = this.historyCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < PriceFeedService.HISTORY_CACHE_TTL_MS) {
      return cached.data;
    }

    const cgId = COINGECKO_SYMBOL_MAP[symbol];
    if (!cgId) return [];
    try {
      const url = `https://api.coingecko.com/api/v3/coins/${cgId}/ohlc?vs_currency=usd&days=${days}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return [];
      const data = await res.json() as any;
      if (!Array.isArray(data)) return [];
      const parsed = data
        .filter((c) => Array.isArray(c) && c.length >= 5)
        .map((c) => ({
          time: Math.floor(c[0] / 1000),
          open: Number(c[1]),
          high: Number(c[2]),
          low: Number(c[3]),
          close: Number(c[4]),
        }));
      this.historyCache.set(cacheKey, { data: parsed, timestamp: Date.now() });
      return parsed;
    } catch (err: any) {
      this.logger.debug(`CoinGecko history fetch failed for ${symbol}: ${err.message}`);
      return [];
    }
  }

  getPriceSource(symbol: string): string {
    if (this.simulatedSymbols.has(symbol)) return 'simulated';
    if (this.isBinanceSymbol(symbol)) return 'binance';
    if (this.isCoinbaseSymbol(symbol)) return 'coinbase';
    if (this.isCryptoCompareSymbol(symbol)) return 'cryptocompare';
    if (this.isCoinGeckoSymbol(symbol)) return 'coingecko';
    if (TWELVE_DATA_SYMBOL_MAP[symbol]) return 'twelvedata';
    return 'simulated';
  }

  isSimulated(symbol: string): boolean {
    if (this.simulatedSymbols.has(symbol)) return true;
    if (
      this.isBinanceSymbol(symbol) ||
      this.isCoinbaseSymbol(symbol) ||
      this.isCryptoCompareSymbol(symbol) ||
      this.isCoinGeckoSymbol(symbol)
    ) {
      return false; // crypto is real via one of the providers
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
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
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
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
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
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
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

  private async fetchTwelveDataPrice(symbol: string): Promise<number | null> {
    const tdSymbol = TWELVE_DATA_SYMBOL_MAP[symbol];
    if (!tdSymbol) return null;

    try {
      const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(tdSymbol)}&apikey=${this.twelveDataApiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
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
}
