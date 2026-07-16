import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OandaAccountInfo {
  id: string;
  balance: number;
  equity: number;
  margin: number;
  marginUsed: number;
  marginAvailable: number;
  currency: string;
  leverage: number;
}

export interface OandaPrice {
  instrument: string;
  bid: number;
  ask: number;
  mid: number;
  time: string;
}

export interface OandaTradeResult {
  tradeId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  openTime: string;
  profit: number;
}

export interface OandaPosition {
  tradeId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  swap: number;
  openTime: string;
}

// Map our internal symbols to OANDA instrument format
const SYMBOL_MAP: Record<string, string> = {
  'BITSTAMP:BTCUSD': 'BTC_USD',
  'BITSTAMP:ETHUSD': 'ETH_USD',
};

/**
 * OANDA REST API Service — real trading without MT5 server.
 *
 * Get started:
 * 1. Sign up at https://www.oanda.com (demo or real account)
 * 2. Go to https://www.oanda.com/account/your-account/api-keys
 * 3. Generate an API key
 * 4. Find your Account ID in the OANDA dashboard
 *
 * Required env vars:
 *   OANDA_API_KEY     — your OANDA REST API key
 *   OANDA_ACCOUNT_ID  — your OANDA account ID (e.g., 001-001-12345-001)
 *   OANDA_ENVIRONMENT — 'practice' (demo) or 'trade' (real money)
 *
 * When these are NOT configured, the system falls back to mock/MT5 bridge.
 */
@Injectable()
export class OandaService {
  private readonly logger = new Logger(OandaService.name);
  private readonly apiKey: string | null;
  private readonly accountId: string | null;
  private readonly baseUrl: string;
  private readonly isPractice: boolean;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OANDA_API_KEY') || null;
    this.accountId = this.configService.get<string>('OANDA_ACCOUNT_ID') || null;
    this.isPractice = (this.configService.get<string>('OANDA_ENVIRONMENT') || 'practice') === 'practice';
    this.baseUrl = this.isPractice
      ? 'https://api-fxpractice.oanda.com/v3'
      : 'https://api-fxtrade.oanda.com/v3';

    if (this.isConfigured()) {
      this.logger.log(`OANDA configured: ${this.isPractice ? 'PRACTICE (demo)' : 'LIVE (real money)'} — account: ${this.accountId}`);
    } else {
      this.logger.warn('OANDA not configured. Set OANDA_API_KEY, OANDA_ACCOUNT_ID, OANDA_ENVIRONMENT to enable real trading.');
    }
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.accountId);
  }

  // ─── Account ───

  async getAccountInfo(): Promise<OandaAccountInfo> {
    const data = await this.request('GET', `/accounts/${this.accountId}/summary`);
    const acct = data.account;

    return {
      id: acct.id,
      balance: Number(acct.balance),
      equity: Number(acct.NAV || acct.equity),
      margin: Number(acct.marginUsed),
      marginUsed: Number(acct.marginUsed),
      marginAvailable: Number(acct.marginAvailable),
      currency: acct.currency,
      leverage: 1, // OANDA doesn't expose leverage directly; margin is calculated server-side
    };
  }

  // ─── Pricing ───

  async getPrice(symbol: string): Promise<OandaPrice> {
    const oandaSymbol = this.mapSymbol(symbol);
    const data = await this.request('GET', `/accounts/${this.accountId}/pricing`, {
      instruments: oandaSymbol,
    });

    const price = data.prices[0];
    const bid = Number(price.bids[0].price);
    const ask = Number(price.asks[0].price);

    return {
      instrument: oandaSymbol,
      bid,
      ask,
      mid: (bid + ask) / 2,
      time: price.time,
    };
  }

  async getPrices(symbols: string[]): Promise<Record<string, OandaPrice>> {
    const oandaSymbols = symbols.map((s) => this.mapSymbol(s)).join(',');
    const data = await this.request('GET', `/accounts/${this.accountId}/pricing`, {
      instruments: oandaSymbols,
    });

    const result: Record<string, OandaPrice> = {};
    for (const price of data.prices) {
      const bid = Number(price.bids?.[0]?.price || 0);
      const ask = Number(price.asks?.[0]?.price || 0);
      result[price.instrument] = {
        instrument: price.instrument,
        bid,
        ask,
        mid: (bid + ask) / 2,
        time: price.time,
      };
    }
    return result;
  }

  // ─── Trading ───

  async openTrade(symbol: string, type: 'BUY' | 'SELL', volume: number): Promise<OandaTradeResult> {
    const oandaSymbol = this.mapSymbol(symbol);
    const side = type === 'BUY' ? 'long' : 'short';

    const body = {
      order: {
        type: 'MARKET',
        instrument: oandaSymbol,
        units: String(type === 'BUY' ? volume : -volume),
        side,
        timeInForce: 'FOK',
        positionFill: 'DEFAULT',
      },
    };

    const data = await this.request('POST', `/accounts/${this.accountId}/orders`, {}, body);

    const orderFill = data.orderFillTransaction || data.orderCreateTransaction;
    const tradeId = data.orderFillTransaction?.tradeOpened?.tradeID ||
      data.orderFillTransaction?.tradeReduced?.tradeID ||
      data.orderFillTransaction?.id ||
      'unknown';

    const openPrice = Number(orderFill?.price || data.orderFillTransaction?.price || 0);
    const openTime = orderFill?.time || new Date().toISOString();

    return {
      tradeId: String(tradeId),
      symbol,
      type,
      volume,
      openPrice,
      openTime,
      profit: 0,
    };
  }

  async closeTrade(tradeId: string): Promise<{ profit: number; closePrice: number }> {
    const body = { units: 'ALL' };
    const data = await this.request('PUT', `/accounts/${this.accountId}/trades/${tradeId}/close`, {}, body);

    const fill = data.orderFillTransaction;
    return {
      profit: Number(fill?.realizedPL || 0),
      closePrice: Number(fill?.price || 0),
    };
  }

  async getOpenTrades(): Promise<OandaPosition[]> {
    const data = await this.request('GET', `/accounts/${this.accountId}/openTrades`);
    const trades = data.trades || [];

    return trades.map((t: any) => {
      const units = Number(t.currentUnits);
      return {
        tradeId: String(t.id),
        symbol: this.reverseMapSymbol(t.instrument),
        type: units > 0 ? 'BUY' : 'SELL',
        volume: Math.abs(units),
        openPrice: Number(t.price),
        currentPrice: 0, // Will be filled by price sync
        profit: Number(t.unrealizedPL || 0),
        swap: Number(t.financing || 0),
        openTime: t.openTime,
      };
    });
  }

  // ─── Deposit/Withdraw (OANDA doesn't support API deposits, but we can track) ───

  // OANDA doesn't have a deposit API — deposits are done via OANDA dashboard
  // We track balance in our DB and sync from OANDA periodically

  // ─── Internal HTTP client ───

  private async request(
    method: string,
    path: string,
    params: Record<string, string> = {},
    body?: any,
  ): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('OANDA is not configured');
    }

    let url = `${this.baseUrl}${path}`;
    if (Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept-Datetime-Format': 'RFC3339',
        },
        signal: AbortSignal.timeout(10000),
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.errorMessage || errorJson.message || errorText;
        } catch {
          // keep raw text
        }
        throw new Error(`OANDA API error ${response.status}: ${errorMessage}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError) {
        this.logger.error(`OANDA connection failed: ${url} — ${error.message}`);
        throw new Error(`Cannot connect to OANDA API. Check your network and API key.`);
      }
      throw error;
    }
  }

  // ─── Symbol mapping ───

  private mapSymbol(internalSymbol: string): string {
    return SYMBOL_MAP[internalSymbol] || internalSymbol.replace(':', '_');
  }

  private reverseMapSymbol(oandaSymbol: string): string {
    const entry = Object.entries(SYMBOL_MAP).find(([, v]) => v === oandaSymbol);
    return entry ? entry[0] : oandaSymbol.replace('_', ':');
  }
}
