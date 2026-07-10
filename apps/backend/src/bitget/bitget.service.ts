import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

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
  private readonly apiKey?: string;
  private readonly secretKey?: string;
  private readonly passphrase?: string;
  private readonly baseUrl = 'https://api.bitget.com';
  private timeOffset = 0;
  private timeSynced = false;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = (this.configService.get<string>('BITGET_API_KEY') || '').trim() || undefined;
    this.secretKey = (this.configService.get<string>('BITGET_SECRET_KEY') || '').trim() || undefined;
    this.passphrase = (this.configService.get<string>('BITGET_PASSPHRASE') || '').trim() || undefined;

    if (this.isConfigured()) {
      this.logger.log(`Bitget API configured — key: ${this.apiKey!.slice(0, 6)}...${this.apiKey!.slice(-4)} (${this.apiKey!.length}), secret: ${this.secretKey!.slice(0, 6)}...${this.secretKey!.slice(-4)} (${this.secretKey!.length}), pass: ${this.passphrase!.slice(0, 2)}***${this.passphrase!.slice(-2)} (${this.passphrase!.length})`);
      this.syncServerTime().catch((err) => {
        this.logger.error(`Failed to sync Bitget server time: ${err.message}`);
      });
    } else {
      this.logger.warn('Bitget API not configured. Set BITGET_API_KEY, BITGET_SECRET_KEY, BITGET_PASSPHRASE to enable deposits/withdrawals.');
    }
  }

  private async syncServerTime(): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v2/public/time`, {
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json() as any;
      const serverTime = Number(data?.data?.[0]?.timestamp || data?.data?.serverTime || 0);
      if (serverTime > 0) {
        this.timeOffset = serverTime - Date.now();
        this.timeSynced = true;
        this.logger.log(`Bitget server time synced — offset: ${this.timeOffset}ms`);
      }
    } catch (err: any) {
      this.logger.error(`Bitget server time sync failed: ${err.message}`);
    }
  }

  private getTimestamp(): string {
    return String(Date.now() + this.timeOffset);
  }

  private sign(timestamp: string, method: string, requestPath: string, body: string): string {
    const message = timestamp + method.toUpperCase() + requestPath + body;
    return createHmac('sha256', this.secretKey!).update(message).digest('base64');
  }

  private async bitgetRequest(method: 'GET' | 'POST', path: string, params: Record<string, string> = {}, body?: any): Promise<any> {
 if (!this.isConfigured()) throw new Error('Bitget API not configured');

    if (!this.timeSynced) {
      await this.syncServerTime();
    }

    const queryString = Object.keys(params).length > 0
      ? '?' + new URLSearchParams(params).toString()
      : '';
    const requestPath = path + queryString;
    const bodyStr = body ? JSON.stringify(body) : '';
    const timestamp = this.getTimestamp();
    const signature = this.sign(timestamp, method, requestPath, bodyStr);

    const url = `${this.baseUrl}${requestPath}`;
    const headers: Record<string, string> = {
      'ACCESS-KEY': this.apiKey!,
      'ACCESS-SIGN': signature,
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-PASSPHRASE': this.passphrase!,
      'Content-Type': 'application/json',
      'locale': 'en-US',
    };

    const options: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(15000),
    };
    if (body) options.body = bodyStr;

    const res = await fetch(url, options);
    const data = await res.json() as any;

    if (!res.ok || data?.code !== '00000') {
      const errMsg = data?.msg || data?.message || `HTTP ${res.status}`;
      const err: any = new Error(errMsg);
      err.body = data;
      err.response = { data };
      throw err;
    }

    return data;
  }

  isConfigured(): boolean {
    const isPlaceholder = (v?: string) => !v || v.startsWith('your-');
    return !isPlaceholder(this.apiKey) && !isPlaceholder(this.secretKey) && !isPlaceholder(this.passphrase);
  }

  /**
   * Fetch USDT deposit records within the given time window (ms epoch).
   */
  async getDepositRecords(coin = 'USDT', startTime?: number, endTime?: number): Promise<BitgetDepositRecord[]> {
    if (!this.isConfigured()) return [];
    const now = Date.now();
    const start = startTime ?? now - 30 * 24 * 60 * 60 * 1000;
    const end = endTime ?? now;
    try {
      const res = await this.bitgetRequest('GET', '/api/v2/spot/account/deposit-records', {
        coin,
        startTime: String(start),
        endTime: String(end),
        limit: '100',
      });
      const data = res?.data;
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      if (error.message?.includes('Invalid IP') || error?.body?.code === '40018') {
        this.logger.warn(
          `getDepositRecords skipped: Bitget API key does not allow this server IP. Add the server IP to your Bitget API whitelist.`,
        );
      } else {
        this.logger.error(`getDepositRecords failed: ${error.message}`);
        this.logger.error(`Full error body: ${JSON.stringify(error?.response?.data || error?.body || error, null, 2)}`);
      }
      return [];
    }
  }

  /**
   * Submit an on-chain USDT withdrawal.
   */
  async withdraw(params: { coin?: string; chain?: string; address: string; size: number }): Promise<BitgetWithdrawResult> {
    if (!this.isConfigured()) return { success: false, error: 'Bitget API not configured' };
    try {
      const res = await this.bitgetRequest('POST', '/api/v2/spot/account/withdrawal', {}, {
        coin: params.coin || 'USDT',
        transferType: 'on_chain',
        address: params.address,
        chain: params.chain || 'TRC20',
        size: params.size.toString(),
      });
      const orderId = res?.data?.orderId;
      this.logger.log(`Bitget withdrawal submitted: ${params.size} USDT -> ${params.address}, orderId: ${orderId}`);
      return { success: true, orderId };
    } catch (error: any) {
      this.logger.error(`Bitget withdrawal failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
