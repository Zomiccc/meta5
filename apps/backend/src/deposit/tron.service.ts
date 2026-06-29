import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TronWeb } from 'tronweb';

export interface TronTransfer {
  txHash: string;
  amount: number; // in USDT (USD)
  from: string;
  to: string;
  timestamp: number; // ms
  confirmed: boolean;
}

/**
 * TRON USDT-TRC20 service.
 * - Detects incoming USDT deposits to the broker hot wallet.
 * - Sends USDT to users when a withdrawal is approved (hot wallet auto-send).
 *
 * Free infra: TronGrid (https://api.trongrid.io). An API key is optional but
 * recommended (free at https://www.trongrid.io) for higher rate limits.
 */
@Injectable()
export class TronService {
  private readonly logger = new Logger(TronService.name);
  private readonly USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // Mainnet USDT-TRC20
  private readonly fullHost: string;
  private readonly apiKey?: string;
  private readonly privateKey?: string;
  private readonly hotWalletAddress: string;
  private tronWeb: TronWeb | null = null;

  constructor(private readonly configService: ConfigService) {
    this.fullHost = this.configService.get<string>('TRON_FULL_HOST') || 'https://api.trongrid.io';
    this.apiKey = this.configService.get<string>('TRONGRID_API_KEY') || undefined;
    this.privateKey = this.configService.get<string>('TRON_HOT_WALLET_PRIVATE_KEY') || undefined;
    this.hotWalletAddress = this.configService.get<string>('TRON_HOT_WALLET_ADDRESS') || '';

    const isPlaceholder = (v?: string) => !v || v.startsWith('your-');

    if (!isPlaceholder(this.privateKey)) {
      try {
        this.tronWeb = new TronWeb({
          fullHost: this.fullHost,
          privateKey: this.privateKey,
          headers: this.apiKey ? { 'TRON-PRO-API-KEY': this.apiKey } : undefined,
        });
        // Derive address from private key if not explicitly set
        if (!this.hotWalletAddress) {
          this.hotWalletAddress = this.tronWeb.address.fromPrivateKey(this.privateKey as string) as string;
        }
        this.logger.log(`TRON hot wallet configured: ${this.hotWalletAddress}`);
      } catch (error) {
        this.logger.error('Failed to init TronWeb', error as Error);
      }
    } else {
      this.logger.warn('TRON_HOT_WALLET_PRIVATE_KEY not set; TRON auto-send disabled (detection still works if address set)');
      // Read-only TronWeb for detection
      this.tronWeb = new TronWeb({
        fullHost: this.fullHost,
        headers: this.apiKey ? { 'TRON-PRO-API-KEY': this.apiKey } : undefined,
      });
    }
  }

  isConfigured(): boolean {
    return !!this.hotWalletAddress;
  }

  canAutoSend(): boolean {
    return !!this.privateKey && !this.privateKey.startsWith('your-');
  }

  getDepositAddress(): string {
    return this.hotWalletAddress;
  }

  /**
   * Fetch recent TRC20 USDT transfers TO the hot wallet using TronGrid REST API.
   */
  async getIncomingTransfers(sinceMs: number): Promise<TronTransfer[]> {
    if (!this.hotWalletAddress) return [];
    try {
      const url = `${this.fullHost}/v1/accounts/${this.hotWalletAddress}/transactions/trc20` +
        `?only_to=true&limit=50&contract_address=${this.USDT_CONTRACT}&min_timestamp=${sinceMs}`;
      const res = await fetch(url, {
        headers: this.apiKey ? { 'TRON-PRO-API-KEY': this.apiKey } : {},
      });
      const data: any = await res.json();
      if (!data?.data) return [];

      return data.data.map((tx: any) => ({
        txHash: tx.transaction_id,
        amount: Number(tx.value) / 1_000_000, // USDT has 6 decimals
        from: tx.from,
        to: tx.to,
        timestamp: tx.block_timestamp,
        confirmed: true,
      }));
    } catch (error) {
      this.logger.error('TronGrid transfer fetch error', error as Error);
      return [];
    }
  }

  /**
   * Verify an incoming deposit matching the expected amount (within tolerance).
   */
  async verifyDeposit(expectedAmount: number, createdAt: Date): Promise<{
    confirmed: boolean;
    txHash?: string;
    receivedAmount?: number;
    from?: string;
  }> {
    const sinceMs = createdAt.getTime() - 5 * 60 * 1000; // 5 min grace
    const transfers = await this.getIncomingTransfers(sinceMs);
    const match = transfers.find(
      (t) => Math.abs(t.amount - expectedAmount) < 0.01 && t.timestamp >= sinceMs,
    );
    if (match) {
      return { confirmed: true, txHash: match.txHash, receivedAmount: match.amount, from: match.from };
    }
    return { confirmed: false };
  }

  /**
   * Send USDT-TRC20 from the hot wallet to a recipient address.
   * amount is in USD/USDT.
   */
  async sendUsdt(toAddress: string, amount: number): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!this.canAutoSend() || !this.tronWeb) {
      return { success: false, error: 'Hot wallet not configured for auto-send' };
    }
    if (!this.tronWeb.isAddress(toAddress)) {
      return { success: false, error: 'Invalid TRON address' };
    }
    try {
      const contract = await this.tronWeb.contract().at(this.USDT_CONTRACT);
      const amountSun = Math.round(amount * 1_000_000); // 6 decimals
      const txId: string = await contract.methods
        .transfer(toAddress, amountSun)
        .send({ feeLimit: 100_000_000 });
      this.logger.log(`USDT sent: ${amount} -> ${toAddress}, tx: ${txId}`);
      return { success: true, txHash: txId };
    } catch (error: any) {
      this.logger.error('USDT send failed', error);
      return { success: false, error: error?.message || 'Send failed' };
    }
  }

  /**
   * Check the hot wallet USDT balance.
   */
  async getHotWalletBalance(): Promise<number> {
    if (!this.tronWeb || !this.hotWalletAddress) return 0;
    try {
      this.tronWeb.setAddress(this.hotWalletAddress);
      const contract = await this.tronWeb.contract().at(this.USDT_CONTRACT);
      const balance = await contract.methods.balanceOf(this.hotWalletAddress).call();
      return Number(balance) / 1_000_000;
    } catch (error) {
      this.logger.error('Balance check failed', error as Error);
      return 0;
    }
  }
}
