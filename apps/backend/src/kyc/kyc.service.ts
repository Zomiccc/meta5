import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { FileService } from '../file/file.service';
import { EmailService } from '../email/email.service';
import { Mt5Service } from '../mt5/mt5.service';
import { VisionService } from './vision.service';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly emailService: EmailService,
    private readonly mt5Service: Mt5Service,
    private readonly visionService: VisionService,
  ) {}

  async uploadDocuments(userId: string, files: { cnicFront?: Express.Multer.File; cnicBack?: Express.Multer.File; selfie?: Express.Multer.File }) {
    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } });
    if (!account?.emailVerified) {
      throw new BadRequestException('Please verify your email before submitting KYC');
    }
    if (!files.cnicFront || !files.cnicBack || !files.selfie) {
      throw new BadRequestException('ID front, ID back, and selfie are required');
    }

    const front = await this.fileService.uploadKycImage(files.cnicFront, userId, 'cnic-front');
    const back = await this.fileService.uploadKycImage(files.cnicBack, userId, 'cnic-back');
    const selfie = await this.fileService.uploadKycImage(files.selfie, userId, 'selfie');

    const kyc = await this.prisma.kYC.upsert({
      where: { userId },
      create: {
        userId,
        cnicFrontUrl: front.key,
        cnicBackUrl: back.key,
        selfieUrl: selfie.key,
        status: 'pending',
      },
      update: {
        cnicFrontUrl: front.key,
        cnicBackUrl: back.key,
        selfieUrl: selfie.key,
        status: 'pending',
        aiResponse: null,
        rejectionReason: null,
      },
    });

    return this.prisma.kYC.findUnique({ where: { userId } });
  }

  /**
   * Auto-approve KYC submissions after 20 seconds.
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async processPendingKyc() {
    const cutoff = new Date(Date.now() - 20_000);
    const pending = await this.prisma.kYC.findMany({
      where: { status: 'pending', createdAt: { lt: cutoff } },
      take: 10,
      orderBy: { createdAt: 'asc' },
    });
    if (pending.length === 0) return;

    for (const kyc of pending) {
      try {
        await this.autoApproveKyc(kyc.id, kyc.userId);
      } catch (error) {
        this.logger.error(`processPendingKyc failed for ${kyc.userId}`, error);
      }
    }
  }

  private async autoApproveKyc(id: string, userId: string) {
    const kyc = await this.prisma.kYC.findUnique({ where: { id } });
    if (!kyc || kyc.status !== 'pending') return;

    await this.prisma.kYC.update({
      where: { id },
      data: {
        status: 'approved',
        aiResponse: {
          approved: true,
          hardFail: false,
          name: null,
          cnicNumber: null,
          expiryDate: null,
          faceMatch: true,
          confidence: 1,
          flags: ['Auto-approved'],
          rejectionReason: null,
        } as any,
        rejectionReason: null,
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    try {
      const mt5 = await this.mt5Service.createAccount(userId);
      await this.emailService.sendKycApprovedEmail(user.email, user.name, mt5.login, mt5.password, mt5.server);
    } catch (error) {
      this.logger.error('MT5/Email error after KYC approval', error);
    }
  }

  async findByUserId(userId: string) {
    return this.prisma.kYC.findUnique({ where: { userId } });
  }

  async findByUserIdWithUrls(userId: string) {
    const kyc = await this.prisma.kYC.findUnique({ where: { userId } });
    if (!kyc) return null;
    return {
      ...kyc,
      cnicFrontUrl: kyc.cnicFrontUrl ? this.fileService.getSignedUrl(kyc.cnicFrontUrl) : null,
      cnicBackUrl: kyc.cnicBackUrl ? this.fileService.getSignedUrl(kyc.cnicBackUrl) : null,
      selfieUrl: kyc.selfieUrl ? this.fileService.getSignedUrl(kyc.selfieUrl) : null,
    };
  }

  async findByIdWithUrls(id: string) {
    const kyc = await this.prisma.kYC.findUnique({ where: { id } });
    if (!kyc) return null;
    return {
      ...kyc,
      cnicFrontUrl: kyc.cnicFrontUrl ? this.fileService.getSignedUrl(kyc.cnicFrontUrl) : null,
      cnicBackUrl: kyc.cnicBackUrl ? this.fileService.getSignedUrl(kyc.cnicBackUrl) : null,
      selfieUrl: kyc.selfieUrl ? this.fileService.getSignedUrl(kyc.selfieUrl) : null,
    };
  }
}
