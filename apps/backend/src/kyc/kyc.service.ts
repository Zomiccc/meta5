import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
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
   * Process pending KYC submissions using AI verification.
   * Downloads the uploaded images, runs them through VisionService for real
   * document analysis, then approves, rejects, or routes to admin review.
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async processPendingKyc() {
    const cutoff = new Date(Date.now() - 20_000);
    const pending = await this.prisma.kYC.findMany({
      where: { status: 'pending', aiResponse: { equals: Prisma.DbNull }, createdAt: { lt: cutoff } },
      take: 10,
      orderBy: { createdAt: 'asc' },
    });
    if (pending.length === 0) return;

    for (const kyc of pending) {
      try {
        await this.processKycWithAi(kyc);
      } catch (error) {
        this.logger.error(`processPendingKyc failed for ${kyc.userId}`, error);
      }
    }
  }

  private async processKycWithAi(kyc: any) {
    // Re-fetch to make sure it's still pending
    const current = await this.prisma.kYC.findUnique({ where: { id: kyc.id } });
    if (!current || current.status !== 'pending') return;

    // Download the uploaded images
    const [frontBuf, backBuf, selfieBuf] = await Promise.all([
      this.fileService.getFileBuffer(kyc.cnicFrontUrl),
      this.fileService.getFileBuffer(kyc.cnicBackUrl),
      this.fileService.getFileBuffer(kyc.selfieUrl),
    ]);

    if (!frontBuf || !backBuf || !selfieBuf) {
      this.logger.error(`Failed to download KYC images for user ${kyc.userId}`);
      return; // leave pending so it can retry
    }

    // Run AI verification
    const aiResult = await this.visionService.processKyc(frontBuf, backBuf, selfieBuf);
    this.logger.log(`KYC AI result for ${kyc.userId}: approved=${aiResult.approved}, confidence=${aiResult.confidence}, hardFail=${aiResult.hardFail}, flags=${aiResult.flags.join('; ')}`);

    if (aiResult.hardFail) {
      // Clearly invalid upload — auto-reject
      await this.rejectKycAuto(kyc.id, kyc.userId, aiResult);
      return;
    }

    if (aiResult.approved && aiResult.confidence >= 0.8) {
      // High-confidence approval — auto-approve
      await this.approveKycAuto(kyc.id, kyc.userId, aiResult);
      return;
    }

    if (!aiResult.approved && aiResult.confidence >= 0.6) {
      // Gemini made a clear rejection decision (e.g. face mismatch, expired, not a real ID)
      await this.rejectKycAuto(kyc.id, kyc.userId, aiResult);
      return;
    }

    // Truly uncertain (confidence < 0.6) — keep pending for admin review
    await this.prisma.kYC.update({
      where: { id: kyc.id },
      data: {
        status: 'pending',
        aiResponse: aiResult as any,
        rejectionReason: null,
      },
    });
    this.logger.log(`KYC ${kyc.userId} kept pending for admin review (confidence=${aiResult.confidence})`);
  }

  private async approveKycAuto(id: string, userId: string, aiResult: any) {
    await this.prisma.kYC.update({
      where: { id },
      data: {
        status: 'approved',
        aiResponse: aiResult as any,
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

  private async rejectKycAuto(id: string, userId: string, aiResult: any) {
    const reason = aiResult.rejectionReason || aiResult.flags?.join(' ') || 'Document verification failed';
    await this.prisma.kYC.update({
      where: { id },
      data: {
        status: 'rejected',
        aiResponse: aiResult as any,
        rejectionReason: reason,
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    try {
      await this.emailService.sendKycRejectedEmail(user.email, user.name, reason);
    } catch (error) {
      this.logger.error('Email error after KYC rejection', error);
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
