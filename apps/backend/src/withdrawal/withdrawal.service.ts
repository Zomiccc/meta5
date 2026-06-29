import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Mt5Service } from '../mt5/mt5.service';
import { TronService } from '../deposit/tron.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class WithdrawalService {
  private readonly logger = new Logger(WithdrawalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mt5Service: Mt5Service,
    private readonly tronService: TronService,
    private readonly emailService: EmailService,
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
    const existing = await this.prisma.withdrawal.findUnique({ where: { id } });
    if (!existing) throw new BadRequestException('Withdrawal not found');
    if (existing.status === 'approved') return existing;

    const amount = Number(existing.amount);
    const isUsdt = existing.cryptoCurrency === 'USDT' || existing.cryptoCurrency === 'USDT-TRC20';

    let txHash: string | undefined;

    // Auto-send USDT from the hot wallet when configured
    if (isUsdt && this.tronService.canAutoSend()) {
      const result = await this.tronService.sendUsdt(existing.walletAddress, amount);
      if (!result.success) {
        throw new BadRequestException(`Auto-send failed: ${result.error}`);
      }
      txHash = result.txHash;
      this.logger.log(`Withdrawal ${id} auto-sent. TX: ${txHash}`);
    } else {
      this.logger.warn(`Withdrawal ${id} approved manually (auto-send not configured or non-USDT).`);
    }

    const withdrawal = await this.prisma.withdrawal.update({
      where: { id },
      data: { status: 'approved', txHash, processedAt: new Date() },
    });

    await this.mt5Service.debitAccount(withdrawal.userId, amount);

    const user = await this.prisma.user.findUnique({ where: { id: withdrawal.userId } });
    if (user) {
      await this.emailService.sendWithdrawalApprovedEmail(user.email, user.name, amount, txHash).catch(() => undefined);
      await this.prisma.notification.create({
        data: {
          userId: withdrawal.userId,
          title: 'Withdrawal sent',
          message: `Your withdrawal of $${amount.toFixed(2)} has been sent${txHash ? `. TX: ${txHash.slice(0, 16)}...` : ''}.`,
        },
      }).catch(() => undefined);
    }

    return withdrawal;
  }

  async rejectWithdrawal(id: string, reason: string) {
    const withdrawal = await this.prisma.withdrawal.update({
      where: { id },
      data: { status: 'rejected', rejectionReason: reason },
    });
    const user = await this.prisma.user.findUnique({ where: { id: withdrawal.userId } });
    if (user) {
      await this.emailService
        .sendWithdrawalRejectedEmail(user.email, user.name, Number(withdrawal.amount), reason)
        .catch(() => undefined);
    }
    return withdrawal;
  }
}
