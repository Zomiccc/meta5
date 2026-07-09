import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface BitgetDepositRecord {
  orderId: string;
  txId: string;
  coin: string;
  chain: string;
  size: string;
  status: string;
  toAddress?: string;
  dest?: string;
  cTime: string;
}

export interface BitgetWithdrawResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

/**
 * Bitget Spot API v2 integration.
 * Handles USDT deposit detection and on-chain withdrawals using
 * HMAC SHA256 request signing.
 * Docs: https://www.bitget.com/api-doc/spot/account/Get-Deposit-Record
 */
@Injectable()
export class BitgetService {
  private readonly logger = new Logger(BitgetService.name);
  private readonly baseUrl = 'https://api.bitget.com';
  private readonly apiKey?: string;
  private readonly secretKey?: string;
  private readonly passphrase?: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BITGET_API_KEY') || undefined;
    this.secretKey = this.configService.get<string>('BITGET_SECRET_KEY') || undefined;
    this.passphrase = this.configService.get<string>('BITGET_PASSPHRASE') || undefined;

    if (this.isConfigured()) {
      this.logger.log(`Bitget API configured — key: ${this.apiKey!.slice(0, 6)}...${this.apiKey!.slice(-4)}, secret: ${this.secretKey!.slice(0, 6)}...${this.secretKey!.slice(-4)}, pass: ${this.passphrase!.slice(0, 2)}***${this.passphrase!.slice(-2)}`);
    } else {
      this.logger.warn('Bitget API not configured. Set BITGET_API_KEY, BITGET_SECRET_KEY, BITGET_PASSPHRASE to enable deposits/withdrawals.');
    }
  }

  isConfigured(): boolean {
    const isPlaceholder = (v?: string) => !v || v.startsWith('your-');
    return !isPlaceholder(this.apiKey) && !isPlaceholder(this.secretKey) && !isPlaceholder(this.passphrase);
  }

  private sign(timestamp: string, method: string, requestPath: string, body: string): string {
    const prehash = timestamp + method.toUpperCase() + requestPath + body;
    return crypto.createHmac('sha256', this.secretKey as string).update(prehash).digest('base64');
  }

  private async request<T = any>(method: string, path: string, query?: Record<string, any>, body?: any): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('Bitget API not configured');
    }

    const queryString = query
      ? '?' + Object.entries(query)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
          .join('&')
      : '';
    const requestPath = path + queryString;
    const bodyString = body ? JSON.stringify(body) : '';
    const timestamp = Date.now().toString();
    const sign = this.sign(timestamp, method, requestPath, bodyString);

    const res = await fetch(this.baseUrl + requestPath, {
      method: method.toUpperCase(),
      headers: {
        'ACCESS-KEY': this.apiKey as string,
        'ACCESS-SIGN': sign,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-PASSPHRASE': this.passphrase as string,
        'Content-Type': 'application/json',
        locale: 'en-US',
      },
      body: bodyString || undefined,
    });

    const json: any = await res.json();
    if (json.code && json.code !== '00000') {
      throw new Error(`Bitget API error ${json.code}: ${json.msg}`);
    }
    return json.data as T;
  }

  /**
   * Fetch USDT deposit records within the given time window (ms epoch).
   */
  async getDepositRecords(coin = 'USDT', startTime?: number, endTime?: number): Promise<BitgetDepositRecord[]> {
    const now = Date.now();
    const start = startTime ?? now - 30 * 24 * 60 * 60 * 1000; // default 30 days
    const end = endTime ?? now;
    try {
      const data = await this.request<BitgetDepositRecord[]>('GET', '/api/v2/spot/wallet/deposit-records', {
        coin,
        startTime: start,
        endTime: end,
        limit: 100,
      });
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      if (error.message?.includes('Invalid IP')) {
        this.logger.warn(
          `getDepositRecords skipped: Bitget API key does not allow Render IP. Add 74.220.48.196 to your Bitget API whitelist.`,
        );
      } else {
        this.logger.error(`getDepositRecords failed: ${error.message}`);
      }
      return [];
    }
  }

  /**
   * Submit an on-chain USDT withdrawal.
   */
  async withdraw(params: { coin?: string; chain?: string; address: string; size: number }): Promise<BitgetWithdrawResult> {
    const body = {
      coin: params.coin || 'USDT',
      transferType: 'on_chain',
      address: params.address,
      chain: params.chain || 'TRC20',
      size: params.size.toString(),
    };
    try {
      const data = await this.request<{ orderId: string }>('POST', '/api/v2/spot/wallet/withdrawal', undefined, body);
      this.logger.log(`Bitget withdrawal submitted: ${params.size} USDT -> ${params.address}, orderId: ${data?.orderId}`);
      return { success: true, orderId: data?.orderId };
    } catch (error: any) {
      this.logger.error(`Bitget withdrawal failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
