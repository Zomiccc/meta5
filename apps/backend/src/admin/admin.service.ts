import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { DepositService } from '../deposit/deposit.service';
import { WithdrawalService } from '../withdrawal/withdrawal.service';
import { EmailService } from '../email/email.service';
import { Mt5Service } from '../mt5/mt5.service';
import { FileService } from '../file/file.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly depositService: DepositService,
    private readonly withdrawalService: WithdrawalService,
    private readonly emailService: EmailService,
    private readonly mt5Service: Mt5Service,
    private readonly fileService: FileService,
  ) {}

  private withKycUrls(kyc: any) {
    if (!kyc) return kyc;
    return {
      ...kyc,
      cnicFrontUrl: kyc.cnicFrontUrl ? this.fileService.getSignedUrl(kyc.cnicFrontUrl) : null,
      cnicBackUrl: kyc.cnicBackUrl ? this.fileService.getSignedUrl(kyc.cnicBackUrl) : null,
      selfieUrl: kyc.selfieUrl ? this.fileService.getSignedUrl(kyc.selfieUrl) : null,
    };
  }

  async getDashboardStats() {
    const [clients, deposits, withdrawals, pendingKyc, openTrades] = await Promise.all([
      this.prisma.user.count({ where: { role: 'client' } }),
      this.prisma.deposit.aggregate({ _sum: { amount: true }, where: { status: 'approved' } }),
      this.prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { status: 'approved' } }),
      this.prisma.kYC.count({ where: { status: 'pending' } }),
      this.prisma.openTrade.count(),
    ]);

    return {
      totalClients: clients,
      totalDeposits: deposits._sum.amount || 0,
      totalWithdrawals: withdrawals._sum.amount || 0,
      pendingKYC: pendingKyc,
      openTrades: openTrades,
    };
  }

  async getClients() {
    return this.prisma.user.findMany({
      where: { role: 'client' },
      omit: { password: true },
      include: { mt5Account: true, kyc: true, affiliate: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingKyc() {
    const items = await this.prisma.kYC.findMany({
      where: { status: 'pending' },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((k) => this.withKycUrls(k));
  }

  async getAllKyc(status?: string) {
    const items = await this.prisma.kYC.findMany({
      where: status ? { status: status as any } : undefined,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((k) => this.withKycUrls(k));
  }

  async resetKyc(id: string) {
    const kyc = await this.prisma.kYC.update({
      where: { id },
      data: {
        status: 'pending',
        adminOverride: false,
        rejectionReason: null,
        adminNote: null,
        aiResponse: null,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return this.withKycUrls(kyc);
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

  async approveKyc(id: string) {
    const kyc = await this.prisma.kYC.update({
      where: { id },
      data: { status: 'approved', adminOverride: true },
      include: { user: true },
    });

    const mt5 = await this.mt5Service.createAccount(kyc.userId);
    await this.emailService.sendKycApprovedEmail(kyc.user.email, kyc.user.name, mt5.login, mt5.password, mt5.server);
    return this.withKycUrls(kyc);
  }

  async rejectKyc(id: string, reason: string) {
    const kyc = await this.prisma.kYC.update({
      where: { id },
      data: { status: 'rejected', adminOverride: true, rejectionReason: reason },
      include: { user: true },
    });
    await this.emailService.sendKycRejectedEmail(kyc.user.email, kyc.user.name, reason);
    return this.withKycUrls(kyc);
  }

  async deleteAllKyc() {
    const result = await this.prisma.kYC.deleteMany({});
    return { deleted: result.count };
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
