import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { Mt5BridgeService } from './mt5-bridge.service';
import { OandaService } from './oanda.service';

// Instrument metadata: contract size and base price for simulation
const INSTRUMENTS: Record<string, { contractSize: number; basePrice: number; label: string }> = {
  'FX:EURUSD': { contractSize: 100000, basePrice: 1.0856, label: 'EUR/USD' },
  'FX:GBPUSD': { contractSize: 100000, basePrice: 1.2734, label: 'GBP/USD' },
  'FX:USDJPY': { contractSize: 100000, basePrice: 148.32, label: 'USD/JPY' },
  'OANDA:XAUUSD': { contractSize: 100, basePrice: 2034.5, label: 'Gold' },
  'BITSTAMP:BTCUSD': { contractSize: 1, basePrice: 43210, label: 'BTC/USD' },
  'BITSTAMP:ETHUSD': { contractSize: 1, basePrice: 2280, label: 'ETH/USD' },
  'TVC:USOIL': { contractSize: 1000, basePrice: 78.4, label: 'Crude Oil' },
  'FOREXCOM:SPXUSD': { contractSize: 1, basePrice: 5123, label: 'S&P 500' },
};

const LEVERAGE = 1000;
const LIQUIDATION_LEVEL = 0.5; // 50% margin level triggers liquidation

@Injectable()
export class Mt5Service {
  private readonly logger = new Logger(Mt5Service.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly bridge: Mt5BridgeService,
    private readonly oanda: OandaService,
  ) {}

  // Priority: OANDA → MT5 Bridge → Mock
  private getTradingMode(): 'oanda' | 'mt5' | 'mock' {
    if (this.oanda.isConfigured()) return 'oanda';
    if (this.bridge.isConfigured()) return 'mt5';
    return 'mock';
  }

  async createAccount(userId: string) {
    const existing = await this.prisma.mT5Account.findUnique({ where: { userId } });
    if (existing) {
      return { login: existing.mt5Login, password: existing.mt5Password, server: existing.server };
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });

    let login: string;
    let password: string;
    let server: string;

    const mode = this.getTradingMode();

    if (mode === 'oanda') {
      // OANDA uses a shared account — all users trade on the same OANDA account
      // We store the OANDA account ID as the login
      const oandaAccountId = this.configService.get<string>('OANDA_ACCOUNT_ID') || 'oanda-account';
      login = oandaAccountId;
      password = 'managed-via-oanda';
      server = this.isPracticeOanda() ? 'OANDA-Demo' : 'OANDA-Live';
    } else if (mode === 'mt5') {
      this.logger.log(`Creating real MT5 account for user ${userId} via bridge...`);
      const result = await this.bridge.createAccount(user?.name || 'User', user?.email || '');
      login = result.login;
      password = result.password;
      server = result.server;
    } else {
      login = Math.floor(100000000 + Math.random() * 900000000).toString();
      password = [...Array(10)].map(() => Math.random().toString(36)[2]).join('');
      server = this.configService.get('MT5_SERVER') || 'FXONS-Live';
    }

    await this.prisma.mT5Account.create({
      data: { userId, mt5Login: login, mt5Password: password, server },
    });

    return { login, password, server };
  }

  async getAccount(userId: string) {
    const account = await this.prisma.mT5Account.findUnique({ where: { userId } });
    if (!account) return null;
    // Recalculate equity from open trades before returning
    await this.updatePricesAndEquity(userId);
    return this.prisma.mT5Account.findUnique({ where: { userId } });
  }

  async creditAccount(userId: string, amount: number) {
    const account = await this.prisma.mT5Account.findUnique({ where: { userId } });
    if (!account) return;

    const mode = this.getTradingMode();

    if (mode === 'mt5') {
      try {
        await this.bridge.deposit(account.mt5Login, amount, 'Deposit');
      } catch (err) {
        this.logger.error(`Bridge deposit failed for ${userId}, updating DB only: ${err.message}`);
      }
    }
    // OANDA: deposits are managed via OANDA dashboard, not API — just update DB

    await this.prisma.mT5Account.update({
      where: { userId },
      data: { balance: { increment: amount }, equity: { increment: amount } },
    });
  }

  async debitAccount(userId: string, amount: number) {
    await this.prisma.mT5Account.update({
      where: { userId },
      data: { balance: { decrement: amount }, equity: { decrement: amount } },
    });
  }

  // ─── Test funding (instant, no deposit record) ───
  async testFund(userId: string, amount: number) {
    const account = await this.prisma.mT5Account.findUnique({ where: { userId } });
    if (!account) throw new BadRequestException('No MT5 account found. Complete KYC first.');

    await this.creditAccount(userId, amount);

    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Test funds added',
        message: `$${amount.toFixed(2)} test funds credited to your MT5 account (Login: ${account.mt5Login}).`,
      },
    }).catch(() => undefined);

    return { message: `Test funds of $${amount.toFixed(2)} added successfully`, newBalance: Number(account.balance) + amount };
  }

  // ─── Open a new trade ───
  async openTrade(userId: string, symbol: string, type: 'BUY' | 'SELL', volume: number) {
    const account = await this.prisma.mT5Account.findUnique({ where: { userId } });
    if (!account) throw new BadRequestException('No MT5 account. Complete KYC first.');

    const instrument = INSTRUMENTS[symbol];
    if (!instrument) throw new BadRequestException('Unsupported symbol: ' + symbol);

    if (volume <= 0) throw new BadRequestException('Volume must be positive');

    let entryPrice: number;
    let trade: any;
    const mode = this.getTradingMode();

    if (mode === 'oanda') {
      // Real OANDA trade
      this.logger.log(`Opening OANDA trade: ${type} ${volume} ${symbol} for user ${userId}`);
      const result = await this.oanda.openTrade(symbol, type, volume);
      entryPrice = result.openPrice;

      trade = await this.prisma.openTrade.create({
        data: {
          userId,
          mt5Login: account.mt5Login,
          symbol,
          type,
          volume,
          openPrice: entryPrice,
          currentPrice: entryPrice,
          profit: 0,
          openTime: new Date(),
        },
      });

      // Sync account from OANDA
      await this.syncAccountFromOanda(userId);
    } else if (mode === 'mt5') {
      // Real MT5 trade via bridge
      this.logger.log(`Opening real MT5 trade: ${type} ${volume} ${symbol} for login ${account.mt5Login}`);
      const result = await this.bridge.openTrade({
        symbol: this.mapSymbolForMt5(symbol),
        type,
        volume,
        login: account.mt5Login,
      });
      entryPrice = result.openPrice;

      trade = await this.prisma.openTrade.create({
        data: {
          userId,
          mt5Login: account.mt5Login,
          symbol,
          type,
          volume,
          openPrice: entryPrice,
          currentPrice: entryPrice,
          profit: 0,
          openTime: new Date(),
        },
      });

      await this.syncAccountFromBridge(userId);
    } else {
      // Mock trading
      entryPrice = this.simulatePrice(instrument.basePrice);

      const notional = volume * instrument.contractSize * entryPrice;
      const requiredMargin = notional / LEVERAGE;

      const usedMargin = Number(account.margin);
      const equity = Number(account.equity);
      const freeMargin = equity - usedMargin;

      if (freeMargin < requiredMargin) {
        throw new BadRequestException(
          `Insufficient free margin. Required: $${requiredMargin.toFixed(2)}, available: $${freeMargin.toFixed(2)}. Reduce volume or add funds.`,
        );
      }

      trade = await this.prisma.openTrade.create({
        data: {
          userId,
          mt5Login: account.mt5Login,
          symbol,
          type,
          volume,
          openPrice: entryPrice,
          currentPrice: entryPrice,
          profit: 0,
          openTime: new Date(),
        },
      });

      await this.prisma.mT5Account.update({
        where: { userId },
        data: { margin: { increment: requiredMargin } },
      });
    }

    this.logger.log(`Trade opened: ${type} ${volume} ${symbol} @ ${entryPrice} for user ${userId}`);

    const notional = volume * instrument.contractSize * entryPrice;
    const requiredMargin = notional / LEVERAGE;

    return {
      trade,
      entryPrice,
      requiredMargin: Number(requiredMargin.toFixed(2)),
      message: `${type} ${volume} lots ${instrument.label} opened at ${entryPrice}`,
    };
  }

  // ─── Close a trade ───
  async closeTrade(userId: string, tradeId: string) {
    const trade = await this.prisma.openTrade.findUnique({ where: { id: tradeId } });
    if (!trade || trade.userId !== userId) throw new BadRequestException('Trade not found');

    const account = await this.prisma.mT5Account.findUnique({ where: { userId } });
    if (!account) throw new BadRequestException('Account not found');

    const instrument = INSTRUMENTS[trade.symbol];
    if (!instrument) throw new BadRequestException('Instrument data missing');

    let pnl: number;
    let closePrice: number;
    let newBalance: number;
    const mode = this.getTradingMode();

    if (mode === 'oanda') {
      // Real OANDA close
      this.logger.log(`Closing OANDA trade ${tradeId} for user ${userId}`);
      const result = await this.oanda.closeTrade(tradeId);
      pnl = result.profit;
      closePrice = result.closePrice;

      await this.prisma.openTrade.delete({ where: { id: tradeId } });

      // Sync account from OANDA
      await this.syncAccountFromOanda(userId);
      const updatedAccount = await this.prisma.mT5Account.findUnique({ where: { userId } });
      newBalance = Number(updatedAccount?.balance || 0);
    } else if (mode === 'mt5') {
      // Real MT5 close via bridge
      this.logger.log(`Closing real MT5 trade ${tradeId} for login ${account.mt5Login}`);
      const result = await this.bridge.closeTrade(account.mt5Login, Number(trade.id));
      pnl = result.profit;
      closePrice = result.closePrice;

      await this.prisma.openTrade.delete({ where: { id: tradeId } });

      // Sync account info from MT5 (balance, equity, margin all come from server)
      await this.syncAccountFromBridge(userId);
      const updatedAccount = await this.prisma.mT5Account.findUnique({ where: { userId } });
      newBalance = Number(updatedAccount?.balance || 0);
    } else {
      // Mock close
      const slippage = Number(trade.currentPrice) * 0.0001;
      closePrice = trade.type === 'BUY'
        ? Number(trade.currentPrice) - slippage
        : Number(trade.currentPrice) + slippage;

      pnl = this.calculatePnL(trade.type, Number(trade.openPrice), closePrice, Number(trade.volume), instrument.contractSize);

      const notional = Number(trade.volume) * instrument.contractSize * Number(trade.openPrice);
      const marginToRelease = notional / LEVERAGE;

      newBalance = Number(account.balance) + pnl;
      const protectedBalance = Math.max(0, newBalance);

      await this.prisma.mT5Account.update({
        where: { userId },
        data: {
          balance: protectedBalance,
          margin: { decrement: marginToRelease },
        },
      });

      await this.prisma.openTrade.delete({ where: { id: tradeId } });
      await this.updatePricesAndEquity(userId);
      newBalance = protectedBalance;
    }

    this.logger.log(`Trade closed: ${trade.symbol} P&L=$${pnl.toFixed(2)} for user ${userId}`);

    return {
      message: `Position closed. P&L: $${pnl.toFixed(2)}`,
      pnl,
      closePrice,
      newBalance,
    };
  }

  // ─── Get all open trades with live P&L ───
  async getTrades(userId: string) {
    // Update prices and check liquidation before returning
    await this.updatePricesAndEquity(userId);

    const trades = await this.prisma.openTrade.findMany({
      where: { userId },
      orderBy: { openTime: 'desc' },
    });

    return trades.map((t) => ({
      ...t,
      volume: Number(t.volume),
      openPrice: Number(t.openPrice),
      currentPrice: Number(t.currentPrice),
      profit: Number(t.profit),
    }));
  }

  // ─── Price simulation + equity update + liquidation check ───
  private async updatePricesAndEquity(userId: string) {
    const account = await this.prisma.mT5Account.findUnique({ where: { userId } });
    if (!account) return;

    const trades = await this.prisma.openTrade.findMany({ where: { userId } });
    if (trades.length === 0) {
      // No open trades — equity = balance, margin = 0
      await this.prisma.mT5Account.update({
        where: { userId },
        data: { equity: account.balance, margin: 0 },
      });
      return;
    }

    const mode = this.getTradingMode();

    if (mode === 'oanda') {
      // Use real OANDA prices
      await this.updatePricesFromOanda(userId, trades, account);
      return;
    }

    // Mock or MT5 bridge: simulate prices
    let totalProfit = 0;
    let totalMargin = 0;

    for (const trade of trades) {
      const instrument = INSTRUMENTS[trade.symbol];
      if (!instrument) continue;

      // Simulate price movement from the current price
      const newPrice = this.simulatePrice(Number(trade.currentPrice));
      const pnl = this.calculatePnL(trade.type, Number(trade.openPrice), newPrice, Number(trade.volume), instrument.contractSize);
      totalProfit += pnl;

      const notional = Number(trade.volume) * instrument.contractSize * Number(trade.openPrice);
      totalMargin += notional / LEVERAGE;

      // Update trade with new price and P&L
      await this.prisma.openTrade.update({
        where: { id: trade.id },
        data: { currentPrice: newPrice, profit: pnl },
      });
    }

    const equity = Number(account.balance) + totalProfit;

    // Check liquidation: if equity / margin < liquidation level
    if (totalMargin > 0 && equity / totalMargin < LIQUIDATION_LEVEL) {
      this.logger.warn(`LIQUIDATION triggered for user ${userId}. Equity=$${equity.toFixed(2)}, Margin=$${totalMargin.toFixed(2)}`);
      await this.liquidateAll(userId, trades, account.balance);
      return;
    }

    // Update equity and margin
    await this.prisma.mT5Account.update({
      where: { userId },
      data: { equity, margin: totalMargin },
    });
  }

  // ─── Force-close all positions (liquidation) ───
  private async liquidateAll(userId: string, trades: any[], currentBalance: any) {
    let totalRealizedLoss = 0;
    let totalMarginReleased = 0;

    for (const trade of trades) {
      const instrument = INSTRUMENTS[trade.symbol];
      if (!instrument) continue;

      const closePrice = Number(trade.currentPrice);
      const pnl = this.calculatePnL(trade.type, Number(trade.openPrice), closePrice, Number(trade.volume), instrument.contractSize);
      totalRealizedLoss += pnl;

      const notional = Number(trade.volume) * instrument.contractSize * Number(trade.openPrice);
      totalMarginReleased += notional / LEVERAGE;

      await this.prisma.openTrade.delete({ where: { id: trade.id } });
    }

    // Realize all losses with negative balance protection
    const newBalance = Math.max(0, Number(currentBalance) + totalRealizedLoss);

    await this.prisma.mT5Account.update({
      where: { userId },
      data: {
        balance: newBalance,
        equity: newBalance,
        margin: 0,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Positions liquidated',
        message: `Your positions were force-closed (margin call). Realized P&L: $${totalRealizedLoss.toFixed(2)}. Remaining balance: $${newBalance.toFixed(2)}.`,
      },
    }).catch(() => undefined);

    this.logger.log(`Liquidation complete for user ${userId}. Total P&L: $${totalRealizedLoss.toFixed(2)}, new balance: $${newBalance.toFixed(2)}`);
  }

  // ─── Helpers ───

  private simulatePrice(basePrice: number): number {
    // Random walk: ±0.05% to ±0.3% per tick
    const drift = (Math.random() - 0.5) * 0.006; // ±0.3%
    const newPrice = basePrice * (1 + drift);
    // Round appropriately based on price magnitude
    if (newPrice > 1000) return Math.round(newPrice * 100) / 100;
    if (newPrice > 10) return Math.round(newPrice * 10000) / 10000;
    return Math.round(newPrice * 100000) / 100000;
  }

  private calculatePnL(type: string, openPrice: number, currentPrice: number, volume: number, contractSize: number): number {
    const priceDiff = type === 'BUY' ? currentPrice - openPrice : openPrice - currentPrice;
    return Number((priceDiff * volume * contractSize).toFixed(2));
  }

  // Get available instruments for the frontend
  getInstruments() {
    return Object.entries(INSTRUMENTS).map(([symbol, data]) => ({
      symbol,
      label: data.label,
      contractSize: data.contractSize,
      basePrice: data.basePrice,
    }));
  }

  // ─── Bridge helpers ───

  // Sync local DB account with real MT5 server values
  private async syncAccountFromBridge(userId: string) {
    if (!this.bridge.isConfigured()) return;

    const account = await this.prisma.mT5Account.findUnique({ where: { userId } });
    if (!account) return;

    try {
      const info = await this.bridge.getAccountInfo(account.mt5Login);
      await this.prisma.mT5Account.update({
        where: { userId },
        data: {
          balance: info.balance,
          equity: info.equity,
          margin: info.margin,
        },
      });

      // Also sync positions from MT5
      const positions = await this.bridge.getPositions(account.mt5Login);
      // Delete local trades that no longer exist on MT5
      const localTrades = await this.prisma.openTrade.findMany({ where: { userId } });
      const mt5Tickets = new Set(positions.map((p) => p.ticket));
      for (const lt of localTrades) {
        if (!mt5Tickets.has(Number(lt.id))) {
          await this.prisma.openTrade.delete({ where: { id: lt.id } }).catch(() => undefined);
        }
      }
      // Update local trades with live MT5 data
      for (const pos of positions) {
        const existing = localTrades.find((lt) => Number(lt.id) === pos.ticket);
        if (existing) {
          await this.prisma.openTrade.update({
            where: { id: existing.id },
            data: {
              currentPrice: pos.currentPrice,
              profit: pos.profit,
            },
          });
        }
      }
    } catch (err) {
      this.logger.error(`Failed to sync account from bridge: ${err.message}`);
    }
  }

  // Map our internal symbol format to MT5 symbol format
  // e.g., "FX:EURUSD" -> "EURUSD", "OANDA:XAUUSD" -> "XAUUSD"
  private mapSymbolForMt5(symbol: string): string {
    const parts = symbol.split(':');
    return parts.length > 1 ? parts[1] : symbol;
  }

  // ─── OANDA helpers ───

  private isPracticeOanda(): boolean {
    return (this.configService.get<string>('OANDA_ENVIRONMENT') || 'practice') === 'practice';
  }

  // Sync local DB account with real OANDA account values
  private async syncAccountFromOanda(userId: string) {
    if (!this.oanda.isConfigured()) return;

    try {
      const info = await this.oanda.getAccountInfo();
      const account = await this.prisma.mT5Account.findUnique({ where: { userId } });
      if (!account) return;

      // OANDA uses a shared account — we track per-user balance in DB
      // But we sync equity/margin from OANDA to keep things consistent
      // For per-user tracking, we calculate equity from local trades + local balance
      await this.updatePricesFromOanda(userId, await this.prisma.openTrade.findMany({ where: { userId } }), account);
    } catch (err) {
      this.logger.error(`Failed to sync account from OANDA: ${err.message}`);
    }
  }

  // Update trade prices and equity using real OANDA prices
  private async updatePricesFromOanda(userId: string, trades: any[], account: any) {
    try {
      // Fetch real prices for all open trade symbols
      const symbols = [...new Set(trades.map((t) => t.symbol))];
      const prices = await this.oanda.getPrices(symbols);

      let totalProfit = 0;
      let totalMargin = 0;

      for (const trade of trades) {
        const instrument = INSTRUMENTS[trade.symbol];
        if (!instrument) continue;

        const oandaSymbol = this.mapSymbolToOanda(trade.symbol);
        const priceData = prices[oandaSymbol];
        if (!priceData) continue;

        // Use mid price as current price
        const newPrice = priceData.mid;
        const pnl = this.calculatePnL(trade.type, Number(trade.openPrice), newPrice, Number(trade.volume), instrument.contractSize);
        totalProfit += pnl;

        const notional = Number(trade.volume) * instrument.contractSize * Number(trade.openPrice);
        totalMargin += notional / LEVERAGE;

        await this.prisma.openTrade.update({
          where: { id: trade.id },
          data: { currentPrice: newPrice, profit: pnl },
        });
      }

      const equity = Number(account.balance) + totalProfit;

      // Check liquidation
      if (totalMargin > 0 && equity / totalMargin < LIQUIDATION_LEVEL) {
        this.logger.warn(`LIQUIDATION triggered for user ${userId}. Equity=$${equity.toFixed(2)}, Margin=$${totalMargin.toFixed(2)}`);
        await this.liquidateAll(userId, trades, account.balance);
        return;
      }

      await this.prisma.mT5Account.update({
        where: { userId },
        data: { equity, margin: totalMargin },
      });
    } catch (err) {
      this.logger.error(`Failed to update prices from OANDA: ${err.message}`);
      // Fall back to simulated prices if OANDA API fails
      let totalProfit = 0;
      let totalMargin = 0;
      for (const trade of trades) {
        const instrument = INSTRUMENTS[trade.symbol];
        if (!instrument) continue;
        const newPrice = this.simulatePrice(Number(trade.currentPrice));
        const pnl = this.calculatePnL(trade.type, Number(trade.openPrice), newPrice, Number(trade.volume), instrument.contractSize);
        totalProfit += pnl;
        const notional = Number(trade.volume) * instrument.contractSize * Number(trade.openPrice);
        totalMargin += notional / LEVERAGE;
        await this.prisma.openTrade.update({
          where: { id: trade.id },
          data: { currentPrice: newPrice, profit: pnl },
        });
      }
      const equity = Number(account.balance) + totalProfit;
      await this.prisma.mT5Account.update({
        where: { userId },
        data: { equity, margin: totalMargin },
      });
    }
  }

  // Map internal symbol to OANDA format
  private mapSymbolToOanda(symbol: string): string {
    const map: Record<string, string> = {
      'FX:EURUSD': 'EUR_USD',
      'FX:GBPUSD': 'GBP_USD',
      'FX:USDJPY': 'USD_JPY',
      'OANDA:XAUUSD': 'XAU_USD',
      'BITSTAMP:BTCUSD': 'BTC_USD',
      'BITSTAMP:ETHUSD': 'ETH_USD',
      'TVC:USOIL': 'WTI_USD',
      'FOREXCOM:SPXUSD': 'SPX500_USD',
    };
    return map[symbol] || symbol.replace(':', '_');
  }
}
