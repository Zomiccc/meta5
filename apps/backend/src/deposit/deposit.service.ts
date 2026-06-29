import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { Mt5Service } from '../mt5/mt5.service';
import { BlockchainService } from './blockchain.service';
import { TronService } from './tron.service';

@Injectable()
export class DepositService {
  private static readonly REFERRAL_RATE = 0.03; // 3% commission to referrer on each approved deposit
  private readonly logger = new Logger(DepositService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mt5Service: Mt5Service,
    private readonly blockchainService: BlockchainService,
    private readonly tronService: TronService,
  ) {}

  async createDepositRequest(userId: string, amount: number, crypto: string) {
    if (amount < 10) throw new BadRequestException('Minimum deposit is $10');

    // Add a unique micro-amount to make the deposit identifiable on-chain
    // e.g., $100 -> $100.37, $100 -> $100.48 (cents-based unique identifier)
    const uniqueCents = Math.floor(Math.random() * 9000) + 100; // 100-9100 cents
    const exactAmount = Math.round(amount * 100 + uniqueCents) / 100;

    const deposit = await this.prisma.deposit.create({
      data: {
        userId,
        amount: exactAmount,
        cryptoCurrency: crypto,
        status: 'pending',
      },
    });

    // Prefer the configured TRON hot wallet for USDT; fall back to legacy address
    const useTron = (crypto === 'USDT' || crypto === 'USDT-TRC20') && this.tronService.isConfigured();
    const address = useTron
      ? this.tronService.getDepositAddress()
      : this.blockchainService.getDepositAddress(crypto);
    const paymentId = 'PAY-' + deposit.id.slice(0, 8).toUpperCase();

    return {
      deposit,
      paymentId,
      address,
      crypto,
      amount: exactAmount,
      displayAmount: amount,
      expiresIn: 3600,
      network: crypto === 'BTC' ? 'Bitcoin Network' : 'Tron Network (TRC20)',
      note: `Send exactly $${exactAmount.toFixed(2)} worth of ${crypto} to the address above. The unique cents amount identifies your deposit.`,
    };
  }

  async checkPayment(userId: string, depositId: string) {
    const deposit = await this.prisma.deposit.findUnique({ where: { id: depositId } });
    if (!deposit || deposit.userId !== userId) throw new BadRequestException('Deposit not found');
    if (deposit.status === 'approved') return { status: 'approved', message: 'Deposit already confirmed' };
    if (deposit.status === 'rejected') return { status: 'rejected', message: 'Deposit was rejected' };

    this.logger.log(`Checking blockchain for deposit ${depositId} (${deposit.cryptoCurrency} $${deposit.amount})`);

    const useTron = (deposit.cryptoCurrency === 'USDT' || deposit.cryptoCurrency === 'USDT-TRC20') && this.tronService.isConfigured();
    const result = useTron
      ? await this.tronService.verifyDeposit(Number(deposit.amount), deposit.createdAt)
      : await this.blockchainService.verifyDeposit(
          deposit.cryptoCurrency,
          Number(deposit.amount),
          deposit.createdAt,
        );

    if (result.confirmed) {
      // Auto-approve: credit the user's balance
      await this.prisma.deposit.update({
        where: { id: depositId },
        data: {
          status: 'approved',
          txHash: result.txHash,
        },
      });

      await this.mt5Service.creditAccount(deposit.userId, Number(deposit.amount));
      await this.creditReferralCommission(deposit.userId, Number(deposit.amount));

      // Notify user
      await this.prisma.notification.create({
        data: {
          userId: deposit.userId,
          title: 'Deposit confirmed',
          message: `Your ${deposit.cryptoCurrency} deposit of $${Number(deposit.amount).toFixed(2)} has been confirmed on the blockchain. TX: ${result.txHash?.slice(0, 20)}...`,
        },
      }).catch(() => undefined);

      this.logger.log(`Deposit ${depositId} auto-confirmed via blockchain. TX: ${result.txHash}`);

      return {
        status: 'approved',
        message: 'Deposit confirmed on blockchain!',
        txHash: result.txHash,
        receivedAmount: result.receivedAmount,
        confirmations: (result as any).confirmations,
      };
    }

    return {
      status: 'pending',
      message: 'No matching transaction found yet. Please send the exact amount and wait for blockchain confirmation.',
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
