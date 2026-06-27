import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Mt5Service } from '../mt5/mt5.service';

@Injectable()
export class WithdrawalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mt5Service: Mt5Service,
  ) {}

  async createRequest(userId: string, amount: number, walletAddress: string, crypto: string) {
    if (amount < 10) throw new BadRequestException('Minimum withdrawal is $10');
    if (!walletAddress) throw new BadRequestException('Wallet address required');

    const account = await this.mt5Service.getAccount(userId);
    if (!account || Number(account.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    return this.prisma.withdrawal.create({
      data: {
        userId,
        amount,
        walletAddress,
        cryptoCurrency: crypto || 'USDT',
        status: 'pending',
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveWithdrawal(id: string) {
    const withdrawal = await this.prisma.withdrawal.update({
      where: { id },
      data: { status: 'approved' },
    });
    await this.mt5Service.debitAccount(withdrawal.userId, Number(withdrawal.amount));
    return withdrawal;
  }

  async rejectWithdrawal(id: string, reason: string) {
    return this.prisma.withdrawal.update({
      where: { id },
      data: { status: 'rejected', rejectionReason: reason },
    });
  }
}
