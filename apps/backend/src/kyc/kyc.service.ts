import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { FileService } from '../file/file.service';
import { VisionService } from './vision.service';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly visionService: VisionService,
  ) {}

  /**
   * Upload KYC documents and immediately verify with Gemini AI.
   * No cron job — verification happens synchronously during upload.
   */
  async uploadDocuments(userId: string, files: { cnicFront?: Express.Multer.File; cnicBack?: Express.Multer.File; selfie?: Express.Multer.File }) {
    const account = await this.prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } });
    if (!account?.emailVerified) {
      throw new BadRequestException('Please verify your email before submitting KYC');
    }
    if (!files.cnicFront || !files.cnicBack || !files.selfie) {
      throw new BadRequestException('ID front, ID back, and selfie are required');
    }

    // Upload images to storage (R2 or local) — best-effort; verification works in-memory
    let frontKey: string | null = null;
    let backKey: string | null = null;
    let selfieKey: string | null = null;
    try {
      const front = await this.fileService.uploadKycImage(files.cnicFront, userId, 'cnic-front');
      frontKey = front.key;
    } catch (err: any) {
      this.logger.warn(`KYC front image storage failed for ${userId}: ${err.message}`);
    }
    try {
      const back = await this.fileService.uploadKycImage(files.cnicBack, userId, 'cnic-back');
      backKey = back.key;
    } catch (err: any) {
      this.logger.warn(`KYC back image storage failed for ${userId}: ${err.message}`);
    }
    try {
      const selfie = await this.fileService.uploadKycImage(files.selfie, userId, 'selfie');
      selfieKey = selfie.key;
    } catch (err: any) {
      this.logger.warn(`KYC selfie storage failed for ${userId}: ${err.message}`);
    }

    // Create/update KYC record as pending
    await this.prisma.kYC.upsert({
      where: { userId },
      create: {
        userId,
        cnicFrontUrl: frontKey,
        cnicBackUrl: backKey,
        selfieUrl: selfieKey,
        status: 'pending',
      },
      update: {
        cnicFrontUrl: frontKey,
        cnicBackUrl: backKey,
        selfieUrl: selfieKey,
        status: 'pending',
        aiResponse: null,
        rejectionReason: null,
      },
    });

    // Run AI analysis for admin recommendation, but keep status pending for manual review.
    // The user sees "Verification in Progress" while the admin reviews documents.
    let aiResult: any = null;

    try {
      this.logger.log(`Starting AI KYC analysis for user ${userId}`);
      aiResult = await this.visionService.analyzeKycDocuments(files.cnicFront.buffer, files.cnicBack.buffer, files.selfie.buffer);
      this.logger.log(`KYC AI recommendation for ${userId}: approved=${aiResult.approved}, confidence=${aiResult.confidence}, hardFail=${aiResult.hardFail}, flags=${aiResult.flags.join('; ')}`);
    } catch (err: any) {
      this.logger.error(`AI KYC analysis error for ${userId}: ${err.message}`);
      aiResult = { error: err.message, flags: ['AI analysis unavailable'] };
    }

    // Always keep KYC pending until an admin manually approves/rejects it
    await this.prisma.kYC.update({
      where: { userId },
      data: {
        status: 'pending',
        aiResponse: aiResult as any,
        rejectionReason: null,
      },
    });

    return this.prisma.kYC.findUnique({ where: { userId } });
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

  async resetMyKyc(userId: string) {
    const result = await this.prisma.kYC.deleteMany({ where: { userId } });
    this.logger.log(`User ${userId} reset their KYC (${result.count} record deleted)`);
    return { deleted: result.count };
  }
}
