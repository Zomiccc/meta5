import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Map internal symbols to Binance ticker symbols for crypto
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
  private readonly priceCache = new Map<string, PriceCacheEntry>();
  private static readonly CACHE_TTL_MS = 2000;

  constructor(private readonly configService: ConfigService) {
    this.twelveDataApiKey = (this.configService.get<string>('TWELVE_DATA_API_KEY') || '').trim() || undefined;
    if (this.twelveDataApiKey) {
      this.logger.log('Twelve Data API configured for live price feeds');
    } else {
      this.logger.warn('Twelve Data API not configured. Set TWELVE_DATA_API_KEY for live forex/stock/commodity prices. Crypto prices will use Binance (free).');
    }
  }

  isConfigured(): boolean {
    return !!this.twelveDataApiKey;
  }

  private isBinanceSymbol(symbol: string): boolean {
    return !!BINANCE_SYMBOL_MAP[symbol];
  }

  async getPrice(symbol: string): Promise<number | null> {
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < PriceFeedService.CACHE_TTL_MS) {
      return cached.price;
    }

    let price: number | null = null;

    if (this.isBinanceSymbol(symbol)) {
      price = await this.fetchBinancePrice(symbol);
    }

    if (price === null && this.twelveDataApiKey) {
      price = await this.fetchTwelveDataPrice(symbol);
    }

    if (price !== null) {
      this.priceCache.set(symbol, { price, timestamp: Date.now() });
    }

    return price;
  }

  async getPrices(symbols: string[]): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    const promises = symbols.map(async (symbol) => {
      const price = await this.getPrice(symbol);
      if (price !== null) results[symbol] = price;
    });
    await Promise.all(promises);
    return results;
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
