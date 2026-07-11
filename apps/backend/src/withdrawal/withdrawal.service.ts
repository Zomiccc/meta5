import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Mt5Service } from '../mt5/mt5.service';
import { BitgetService } from '../bitget/bitget.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class WithdrawalService {
  private readonly logger = new Logger(WithdrawalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mt5Service: Mt5Service,
    private readonly bitgetService: BitgetService,
    private readonly emailService: EmailService,
  ) {}

  async createRequest(userId: string, amount: number, walletAddress: string, crypto: string) {
    if (amount < 10) throw new BadRequestException('Minimum withdrawal is $10');
    if (!walletAddress) throw new BadRequestException('USDT TRC20 wallet address required');

    const account = await this.mt5Service.getAccount(userId);
    if (!account || Number(account.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    return this.prisma.withdrawal.create({
      data: {
        userId,
        amount,
        walletAddress,
        clientWalletAddress: walletAddress,
        cryptoCurrency: 'USDT',
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
    const destination = existing.clientWalletAddress || existing.walletAddress;

    // Verify the client has a funded account before approving
    const account = await this.prisma.mT5Account.findUnique({ where: { userId: existing.userId } });
    if (!account) throw new BadRequestException('Client has no MT5 account');
    if (Number(account.balance) < amount) throw new BadRequestException('Insufficient balance to approve withdrawal');

    let txHash: string | undefined;
    let bitgetTxId: string | undefined;

    // Auto-send USDT (TRC20) via Bitget when configured
    if (this.bitgetService.isConfigured()) {
      const result = await this.bitgetService.withdraw({ coin: 'USDT', chain: 'TRC20', address: destination, size: amount });
      if (!result.success) {
        throw new BadRequestException(`Bitget withdrawal failed: ${result.error}`);
      }
      bitgetTxId = result.orderId;
      txHash = result.orderId;
      this.logger.log(`Withdrawal ${id} sent via Bitget. Order: ${bitgetTxId}`);
    } else {
      this.logger.warn(`Withdrawal ${id} approved manually (Bitget not configured).`);
    }

    // Approve withdrawal and debit account atomically
    const [withdrawal] = await this.prisma.$transaction([
      this.prisma.withdrawal.update({
        where: { id },
        data: { status: 'approved', txHash, bitgetTxId, processedAt: new Date() },
      }),
      this.prisma.mT5Account.update({
        where: { userId: existing.userId },
        data: { balance: { decrement: amount }, equity: { decrement: amount } },
      }),
    ]);

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
