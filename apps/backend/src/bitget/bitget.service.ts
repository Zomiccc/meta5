import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RestClientV2 } from 'bitget-api';

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
  private client: RestClientV2 | null = null;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = (this.configService.get<string>('BITGET_API_KEY') || '').trim() || undefined;
    this.secretKey = (this.configService.get<string>('BITGET_SECRET_KEY') || '').trim() || undefined;
    this.passphrase = (this.configService.get<string>('BITGET_PASSPHRASE') || '').trim() || undefined;

    if (this.isConfigured()) {
      this.logger.log(`Bitget API configured — key: ${this.apiKey!.slice(0, 6)}...${this.apiKey!.slice(-4)}, secret: ${this.secretKey!.slice(0, 6)}...${this.secretKey!.slice(-4)}, pass: ${this.passphrase!.slice(0, 2)}***${this.passphrase!.slice(-2)}`);
      this.client = new RestClientV2({
        apiKey: this.apiKey!,
        apiSecret: this.secretKey!,
        apiPass: this.passphrase!,
      });
    } else {
      this.logger.warn('Bitget API not configured. Set BITGET_API_KEY, BITGET_SECRET_KEY, BITGET_PASSPHRASE to enable deposits/withdrawals.');
    }
  }

  isConfigured(): boolean {
    const isPlaceholder = (v?: string) => !v || v.startsWith('your-');
    return !isPlaceholder(this.apiKey) && !isPlaceholder(this.secretKey) && !isPlaceholder(this.passphrase);
  }

  /**
   * Fetch USDT deposit records within the given time window (ms epoch).
   */
  async getDepositRecords(coin = 'USDT', startTime?: number, endTime?: number): Promise<BitgetDepositRecord[]> {
    if (!this.client) return [];
    const now = Date.now();
    const start = startTime ?? now - 30 * 24 * 60 * 60 * 1000;
    const end = endTime ?? now;
    try {
      const res = await this.client.getSpotDepositHistory({
        coin,
        startTime: String(start),
        endTime: String(end),
        limit: '100',
      });
      const data = (res as any)?.data;
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
    if (!this.client) return { success: false, error: 'Bitget API not configured' };
    try {
      const res = await this.client.spotWithdraw({
        coin: params.coin || 'USDT',
        transferType: 'on_chain',
        address: params.address,
        chain: params.chain || 'TRC20',
        size: params.size.toString(),
      });
      const orderId = (res as any)?.data?.orderId;
      this.logger.log(`Bitget withdrawal submitted: ${params.size} USDT -> ${params.address}, orderId: ${orderId}`);
      return { success: true, orderId };
    } catch (error: any) {
      this.logger.error(`Bitget withdrawal failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
