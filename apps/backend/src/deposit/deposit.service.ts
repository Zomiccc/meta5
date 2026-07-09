import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { Mt5Service } from '../mt5/mt5.service';
import { EmailService } from '../email/email.service';
import { BitgetService } from '../bitget/bitget.service';

const DEPOSIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class DepositService {
  private static readonly REFERRAL_RATE = 0.03; // 3% commission to referrer on each approved deposit
  private readonly logger = new Logger(DepositService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mt5Service: Mt5Service,
    private readonly emailService: EmailService,
    private readonly bitgetService: BitgetService,
  ) {}

  private getDepositAddress(): string {
    return this.configService.get<string>('DEPOSIT_USDT_ADDRESS') || '';
  }

  async createDepositRequest(userId: string, amount: number, crypto: string) {
    if (amount < 10) throw new BadRequestException('Minimum deposit is $10');

    // Add a unique micro-amount so each deposit can be matched against Bitget
    // deposit records. e.g. $100 -> $100.37
    const uniqueCents = Math.floor(Math.random() * 99) + 1; // 1-99 cents
    const uniqueAmount = Math.round(amount * 100 + uniqueCents) / 100;

    const deposit = await this.prisma.deposit.create({
      data: {
        userId,
        amount,
        uniqueAmount,
        cryptoCurrency: 'USDT',
        cryptoAddress: this.getDepositAddress(),
        status: 'pending',
      },
    });

    const address = this.getDepositAddress();
    const paymentId = 'PAY-' + deposit.id.slice(0, 8).toUpperCase();
    const expiresAt = new Date(deposit.createdAt.getTime() + DEPOSIT_WINDOW_MS);

    return {
      deposit,
      paymentId,
      address,
      crypto: 'USDT',
      amount: uniqueAmount,
      uniqueAmount,
      displayAmount: amount,
      expiresIn: DEPOSIT_WINDOW_MS / 1000,
      expiresAt,
      network: 'Tron Network (TRC20)',
      note: `Send exactly ${uniqueAmount.toFixed(2)} USDT (TRC20) to the address above. The unique amount identifies your deposit. This request expires in 24 hours.`,
    };
  }

  /**
   * Poll Bitget every 30s for matching USDT deposits and auto-credit clients.
   * Also auto-cancels deposits older than 24 hours.
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async pollDeposits() {
    // Expire stale pending deposits (older than 24h)
    const cutoff = new Date(Date.now() - DEPOSIT_WINDOW_MS);
    const expired = await this.prisma.deposit.updateMany({
      where: { status: 'pending', createdAt: { lt: cutoff } },
      data: { status: 'expired', adminNote: 'Auto-cancelled after 24 hours' },
    });
    if (expired.count > 0) this.logger.log(`Expired ${expired.count} stale deposit(s)`);

    if (!this.bitgetService.isConfigured()) return;

    const pending = await this.prisma.deposit.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });
    if (pending.length === 0) return;

    const earliest = pending.reduce((min, d) => (d.createdAt < min ? d.createdAt : min), pending[0].createdAt);
    const records = await this.bitgetService.getDepositRecords('USDT', earliest.getTime() - 5 * 60 * 1000);
    const successful = records.filter((r) => r.status === 'success');
    if (successful.length === 0) return;

    // Bitget tx ids already consumed by other deposits
    const usedTxIds = new Set(
      (await this.prisma.deposit.findMany({
        where: { bitgetTxId: { not: null } },
        select: { bitgetTxId: true },
      })).map((d) => d.bitgetTxId as string),
    );

    for (const deposit of pending) {
      const match = successful.find(
        (r) => Math.abs(parseFloat(r.size) - deposit.uniqueAmount) < 0.001 && !usedTxIds.has(r.txId),
      );
      if (!match) continue;
      usedTxIds.add(match.txId);
      await this.creditDeposit(deposit.id, match.txId, match.orderId);
    }
  }

  private async creditDeposit(depositId: string, txHash: string, bitgetTxId: string) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id: depositId } });
    if (!deposit || deposit.status !== 'pending') return;

    await this.prisma.deposit.update({
      where: { id: depositId },
      data: { status: 'approved', txHash, bitgetTxId },
    });

    const amount = Number(deposit.amount);
    await this.mt5Service.creditAccount(deposit.userId, amount);
    await this.creditReferralCommission(deposit.userId, amount);

    const user = await this.prisma.user.findUnique({ where: { id: deposit.userId } });
    if (user) {
      await this.emailService.sendDepositApprovedEmail(user.email, user.name, amount).catch(() => undefined);
      await this.prisma.notification.create({
        data: {
          userId: deposit.userId,
          title: 'Deposit confirmed',
          message: `Your USDT deposit of $${amount.toFixed(2)} has been confirmed. TX: ${txHash.slice(0, 20)}...`,
        },
      }).catch(() => undefined);
    }

    this.logger.log(`Deposit ${depositId} auto-credited via Bitget. TX: ${txHash}`);
  }

  async checkPayment(userId: string, depositId: string) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id: depositId } });
    if (!deposit || deposit.userId !== userId) throw new BadRequestException('Deposit not found');
    if (deposit.status === 'approved') return { status: 'approved', message: 'Deposit already confirmed', txHash: deposit.txHash };
    if (deposit.status === 'rejected') return { status: 'rejected', message: 'Deposit was rejected' };
    if (deposit.status === 'expired') return { status: 'expired', message: 'Deposit request expired' };

    // Trigger an immediate poll so users can force a check
    await this.pollDeposits();
    const updated = await this.prisma.deposit.findUnique({ where: { id: depositId } });
    if (updated?.status === 'approved') {
      return { status: 'approved', message: 'Deposit confirmed!', txHash: updated.txHash };
    }

    return {
      status: 'pending',
      message: 'No matching transaction found yet. Send the exact unique amount and allow a few minutes for confirmation.',
    };
  }

  async findByUser(userId: string) {
    return this.prisma.deposit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveDeposit(id: string) {
    const deposit = await this.prisma.deposit.update({
      where: { id },
      data: { status: 'approved' },
    });
    await this.mt5Service.creditAccount(deposit.userId, Number(deposit.amount));
    await this.creditReferralCommission(deposit.userId, Number(deposit.amount));
    return deposit;
  }

  async rejectDeposit(id: string) {
    return this.prisma.deposit.update({
      where: { id },
      data: { status: 'rejected' },
    });
  }

  // Pays the referrer a 3% commission whenever a referred user's deposit is approved.
  private async creditReferralCommission(userId: string, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referredBy: true, name: true },
    });
    if (!user?.referredBy) return;

    const commission = Number((amount * DepositService.REFERRAL_RATE).toFixed(2));
    if (commission <= 0) return;

    await this.prisma.affiliate.updateMany({
      where: { userId: user.referredBy },
      data: { totalCommission: { increment: commission } },
    });

    await this.prisma.notification
      .create({
        data: {
          userId: user.referredBy,
          title: 'Referral commission earned',
          message: `You earned $${commission.toFixed(2)} (3%) from a deposit by ${user.name}.`,
        },
      })
      .catch(() => undefined);
  }
}
