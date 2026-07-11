import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { DepositService } from '../deposit/deposit.service';
import { WithdrawalService } from '../withdrawal/withdrawal.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly depositService: DepositService,
    private readonly withdrawalService: WithdrawalService,
    private readonly emailService: EmailService,
  ) {}

  async getDashboardStats() {
    const [clients, deposits, withdrawals, openTrades] = await Promise.all([
      this.prisma.user.count({ where: { role: 'client' } }),
      this.prisma.deposit.aggregate({ _sum: { amount: true }, where: { status: 'approved' } }),
      this.prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { status: 'approved' } }),
      this.prisma.openTrade.count(),
    ]);

    return {
      totalClients: clients,
      totalDeposits: deposits._sum.amount || 0,
      totalWithdrawals: withdrawals._sum.amount || 0,
      openTrades: openTrades,
    };
  }

  async getClients() {
    return this.prisma.user.findMany({
      where: { role: 'client' },
      omit: { password: true },
      include: { mt5Account: true, affiliate: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDeposits(status?: string) {
    return this.prisma.deposit.findMany({
      where: status ? { status: status as any } : undefined,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWithdrawals(status?: string) {
    return this.prisma.withdrawal.findMany({
      where: status ? { status: status as any } : undefined,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveDeposit(id: string) {
    const deposit = await this.depositService.approveDeposit(id);
    const user = await this.prisma.user.findUnique({ where: { id: deposit.userId } });
    await this.emailService.sendDepositApprovedEmail(user.email, user.name, Number(deposit.amount));
    return deposit;
  }

  async rejectDeposit(id: string) {
    return this.depositService.rejectDeposit(id);
  }

  async approveWithdrawal(id: string) {
    return this.withdrawalService.approveWithdrawal(id);
  }

  async rejectWithdrawal(id: string, reason: string) {
    return this.withdrawalService.rejectWithdrawal(id, reason);
  }
}
