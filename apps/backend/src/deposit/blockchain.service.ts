import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface BlockchainTransaction {
  txHash: string;
  amount: number;
  confirmations: number;
  from: string;
  timestamp: number;
}

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);

  // Broker deposit wallet addresses — configured via env or defaults for demo
  private readonly usdtAddress: string;
  private readonly btcAddress: string;

  constructor(private readonly configService: ConfigService) {
    this.usdtAddress = this.configService.get('DEPOSIT_USDT_ADDRESS') || 'TQn9Y2khEsLJW1ChVWFkMe671phbQcJ1eE';
    this.btcAddress = this.configService.get('DEPOSIT_BTC_ADDRESS') || 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
  }

  getDepositAddress(crypto: string): string {
    if (crypto === 'BTC') return this.btcAddress;
    return this.usdtAddress; // USDT and other TRC20 tokens
  }

  /**
   * Check for incoming USDT (TRC20) transactions using TronScan free API.
   * No API key required.
   */
  async checkUsdtTransactions(expectedAmount: number): Promise<BlockchainTransaction[]> {
    try {
      const url = `https://apilist.tronscanapi.com/api/transaction?sort=-timestamp&count=true&limit=50&start=0&address=${this.usdtAddress}`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (!data?.data) return [];

      const txs: BlockchainTransaction[] = [];
      for (const tx of data.data) {
        // Look for TRC20 USDT transfers (contract calls)
        const contractData = tx.contractData || '';
        const contractType = tx.contractType || 0;

        // TRC20 token transfer (type 1 = TRC20)
        if (contractType === 1 || tx.contractRet === 'SUCCESS') {
          const amount = this.extractTronAmount(tx);
          if (amount > 0) {
            txs.push({
              txHash: tx.hash,
              amount,
              confirmations: tx.confirmed ? 20 : 0,
              from: tx.ownerAddress || '',
              timestamp: tx.timestamp || 0,
            });
          }
        }
      }

      return txs;
    } catch (error) {
      this.logger.error('TronScan API error:', error);
      return [];
    }
  }

  /**
   * Check for incoming BTC transactions using Blockchain.com free API.
   * No API key required.
   */
  async checkBtcTransactions(expectedAmount: number): Promise<BlockchainTransaction[]> {
    try {
      const url = `https://blockchain.info/rawaddr/${this.btcAddress}?limit=50`;
      const response = await fetch(url);
      const data: any = await response.json();

      if (!data?.txs) return [];

      const txs: BlockchainTransaction[] = [];
      for (const tx of data.txs) {
        // Sum outputs going to our address
        let received = 0;
        for (const out of tx.out || []) {
          if (out.addr === this.btcAddress) {
            received += out.value; // in satoshis
          }
        }
        if (received > 0) {
          txs.push({
            txHash: tx.hash,
            amount: received / 100000000, // convert satoshis to BTC
            confirmations: tx.confirmations || 0,
            from: tx.inputs?.[0]?.prev_out?.addr || '',
            timestamp: tx.time || 0,
          });
        }
      }

      return txs;
    } catch (error) {
      this.logger.error('Blockchain.com API error:', error);
      return [];
    }
  }

  /**
   * Check if a deposit matching the expected amount has been received.
   * For USDT: amount is in USD (1 USDT ≈ 1 USD)
   * For BTC: amount is in USD, converted to BTC at current price
   */
  async verifyDeposit(crypto: string, expectedAmountUsd: number, depositCreatedAt: Date): Promise<{
    confirmed: boolean;
    txHash?: string;
    receivedAmount?: number;
    confirmations?: number;
  }> {
    let txs: BlockchainTransaction[] = [];

    if (crypto === 'BTC') {
      txs = await this.checkBtcTransactions(expectedAmountUsd);
      // Convert USD to BTC amount for comparison (approximate)
      const btcPrice = await this.getBtcPrice();
      const expectedBtc = expectedAmountUsd / btcPrice;
      const matchingTx = txs.find(
        (tx) => tx.timestamp >= Math.floor(depositCreatedAt.getTime() / 1000) - 300 &&
        Math.abs(tx.amount - expectedBtc) / expectedBtc < 0.02 &&
        tx.confirmations >= 1,
      );
      if (matchingTx) {
        return {
          confirmed: true,
          txHash: matchingTx.txHash,
          receivedAmount: matchingTx.amount * btcPrice,
          confirmations: matchingTx.confirmations,
        };
      }
    } else {
      // USDT TRC20 — 1 USDT = 1 USD
      txs = await this.checkUsdtTransactions(expectedAmountUsd);
      const matchingTx = txs.find(
        (tx) => tx.timestamp >= Math.floor(depositCreatedAt.getTime() / 1000) - 300000 &&
        Math.abs(tx.amount - expectedAmountUsd) / expectedAmountUsd < 0.02 &&
        tx.confirmations >= 1,
      );
      if (matchingTx) {
        return {
          confirmed: true,
          txHash: matchingTx.txHash,
          receivedAmount: matchingTx.amount,
          confirmations: matchingTx.confirmations,
        };
      }
    }

    return { confirmed: false };
  }

  private async getBtcPrice(): Promise<number> {
    try {
      const response = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
      const data: any = await response.json();
      return parseFloat(data?.data?.amount || '60000');
    } catch {
      return 60000; // fallback
    }
  }

  private extractTronAmount(tx: any): number {
    // For TRC20 transfers, amount is usually in the contractData
    // TronScan returns amount in sun (6 decimals for USDT)
    if (tx.amount) {
      return Number(tx.amount) / 1000000;
    }
    if (tx.contractData && typeof tx.contractData === 'string') {
      const val = parseInt(tx.contractData, 16);
      if (!isNaN(val)) return val / 1000000;
    }
    return 0;
  }
}
