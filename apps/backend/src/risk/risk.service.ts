import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class RiskService {
  constructor(private readonly prisma: PrismaService) {}

  async getOpenTrades() {
    return this.prisma.openTrade.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getExposure(symbol?: string) {
    const where = symbol ? { symbol } : {};
    const trades = await this.prisma.openTrade.findMany({ where });
    const totalVolume = trades.reduce((sum, t) => sum + Number(t.volume), 0);
    const totalProfit = trades.reduce((sum, t) => sum + Number(t.profit), 0);
    return { trades, totalVolume, totalProfit };
  }
}
