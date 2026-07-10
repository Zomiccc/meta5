import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Mt5AccountInfo {
  login: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  currency: string;
  server: string;
}

export interface Mt5TradeRequest {
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  login: string;
}

export interface Mt5TradeResult {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  openTime: string;
  profit: number;
}

export interface Mt5Position {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  swap: number;
  commission: number;
  openTime: string;
}

export interface Mt5CreateAccountResult {
  login: string;
  password: string;
  server: string;
}

/**
 * MT5 Bridge Service — connects to a real MT5 server via the MQL5-JSON-API.
 *
 * The MQL5-JSON-API is a free open-source REST bridge that runs on the MT5 server.
 * GitHub: https://github.com/khramkov/MQL5-JSON-API
 *
 * Required env vars:
 *   MT5_BRIDGE_URL     — URL of the MQL5-JSON-API (e.g., http://your-mt5-server:5000)
 *   MT5_MANAGER_LOGIN  — MT5 manager account login
 *   MT5_MANAGER_PASSWORD — MT5 manager account password
 *   MT5_SERVER         — MT5 server name (e.g., FXONS-Live)
 *
 * When these are NOT configured, the system falls back to mock trading.
 */
@Injectable()
export class Mt5BridgeService {
  private readonly logger = new Logger(Mt5BridgeService.name);
  private readonly bridgeUrl: string | null;
  private readonly managerLogin: string | null;
  private readonly managerPassword: string | null;
  private readonly serverName: string;

  constructor(private readonly configService: ConfigService) {
    this.bridgeUrl = this.configService.get<string>('MT5_BRIDGE_URL') || null;
    this.managerLogin = this.configService.get<string>('MT5_MANAGER_LOGIN') || null;
    this.managerPassword = this.configService.get<string>('MT5_MANAGER_PASSWORD') || null;
    this.serverName = this.configService.get<string>('MT5_SERVER') || 'FXONS-Live';

    if (this.isConfigured()) {
      this.logger.log(`MT5 Bridge configured: ${this.bridgeUrl} (server: ${this.serverName})`);
    } else {
      this.logger.warn('MT5 Bridge not configured — using mock trading. Set MT5_BRIDGE_URL, MT5_MANAGER_LOGIN, MT5_MANAGER_PASSWORD to enable live trading.');
    }
  }

  isConfigured(): boolean {
    return !!(this.bridgeUrl && this.managerLogin && this.managerPassword);
  }

  // ─── Account Management ───

  async createAccount(name: string, email: string, leverage: number = 1000): Promise<Mt5CreateAccountResult> {
    const password = this.generatePassword();
    const response = await this.request('/account/create', {
      name,
      email,
      password,
      leverage,
      group: 'real\\standard',
      currency: 'USD',
    });

    return {
      login: String(response.login),
      password,
      server: this.serverName,
    };
  }

  async getAccountInfo(login: string): Promise<Mt5AccountInfo> {
    const response = await this.request('/account/info', { login });
    return {
      login: String(response.login),
      balance: Number(response.balance),
      equity: Number(response.equity),
      margin: Number(response.margin),
      freeMargin: Number(response.margin_free || response.freeMargin || 0),
      leverage: Number(response.leverage),
      currency: response.currency || 'USD',
      server: this.serverName,
    };
  }

  async deposit(login: string, amount: number, comment: string = 'Deposit'): Promise<void> {
    await this.request('/account/deposit', {
      login,
      amount,
      comment,
    });
  }

  async withdraw(login: string, amount: number, comment: string = 'Withdrawal'): Promise<void> {
    await this.request('/account/withdraw', {
      login,
      amount: -Math.abs(amount),
      comment,
    });
  }

  // ─── Trading ───

  async openTrade(req: Mt5TradeRequest): Promise<Mt5TradeResult> {
    const response = await this.request('/trade/open', {
      login: req.login,
      symbol: req.symbol,
      type: req.type.toLowerCase(),
      volume: req.volume,
    });

    return {
      ticket: Number(response.ticket || response.order),
      symbol: req.symbol,
      type: req.type,
      volume: req.volume,
      openPrice: Number(response.open_price || response.price),
      openTime: response.open_time || new Date().toISOString(),
      profit: 0,
    };
  }

  async closeTrade(login: string, ticket: number): Promise<{ profit: number; closePrice: number }> {
    const response = await this.request('/trade/close', {
      login,
      ticket,
    });

    return {
      profit: Number(response.profit || 0),
      closePrice: Number(response.close_price || response.price || 0),
    };
  }

  async getPositions(login: string): Promise<Mt5Position[]> {
    const response = await this.request('/positions', { login });
    const positions = Array.isArray(response) ? response : (response.positions || []);

    return positions.map((p: any) => ({
      ticket: Number(p.ticket || p.order),
      symbol: p.symbol,
      type: (p.type === 'buy' || p.type === 'BUY') ? 'BUY' : 'SELL',
      volume: Number(p.volume),
      openPrice: Number(p.open_price || p.price_open),
      currentPrice: Number(p.current_price || p.price_current),
      profit: Number(p.profit),
      swap: Number(p.swap || 0),
      commission: Number(p.commission || 0),
      openTime: p.open_time || p.time,
    }));
  }

  async getSymbolPrice(symbol: string): Promise<{ bid: number; ask: number }> {
    const response = await this.request('/symbol/price', { symbol });
    return {
      bid: Number(response.bid),
      ask: Number(response.ask),
    };
  }

  // ─── Internal HTTP client ───

  private async request(endpoint: string, payload: any): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('MT5 Bridge is not configured');
    }

    const url = `${this.bridgeUrl}${endpoint}`;
    const body = {
      ...payload,
      manager_login: this.managerLogin,
      manager_password: this.managerPassword,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MT5 Bridge error ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`MT5 Bridge error: ${data.error}`);
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError) {
        this.logger.error(`MT5 Bridge connection failed: ${url} — ${error.message}`);
        throw new Error(`Cannot connect to MT5 server at ${this.bridgeUrl}. Ensure the MQL5-JSON-API is running.`);
      }
      throw error;
    }
  }

  private generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    return [...Array(12)].map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}
