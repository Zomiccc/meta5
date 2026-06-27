import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { FileService } from '../file/file.service';
import { EmailService } from '../email/email.service';
import { Mt5Service } from '../mt5/mt5.service';
import { VisionService, KycAiResult } from './vision.service';

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
    if (!files.cnicFront || !files.cnicBack || !files.selfie) {
      throw new BadRequestException('CNIC front, CNIC back, and selfie are required');
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

    let aiResult: KycAiResult;
    try {
      aiResult = await this.visionService.processKyc(
        files.cnicFront.buffer,
        files.cnicBack.buffer,
        files.selfie.buffer,
      );
    } catch (error) {
      this.logger.error('KYC analysis error', error);
      // On actual system error, keep pending for admin manual review
      aiResult = {
        approved: false,
        name: null,
        cnicNumber: null,
        expiryDate: null,
        faceMatch: false,
        confidence: 0,
        rejectionReason: 'Pending manual review by admin',
      };
    }

    // Auto-approve if analysis passed, auto-reject if it found issues
    // Only fall back to pending manual review on actual system errors
    const isSystemError = aiResult.confidence === 0 && aiResult.rejectionReason === 'Pending manual review by admin';
    const newStatus = isSystemError ? 'pending' : (aiResult.approved ? 'approved' : 'rejected');

    await this.prisma.kYC.update({
      where: { userId },
      data: {
        aiResponse: aiResult as any,
        status: newStatus,
        rejectionReason: aiResult.approved ? null : aiResult.rejectionReason,
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (aiResult.approved && !isSystemError) {
      try {
        const mt5 = await this.mt5Service.createAccount(userId);
        await this.emailService.sendKycApprovedEmail(user.email, user.name, mt5.login, mt5.password, mt5.server);
      } catch (error) {
        this.logger.error('MT5/Email error after KYC approval', error);
      }
    } else if (!aiResult.approved && !isSystemError && aiResult.rejectionReason) {
      try {
        await this.emailService.sendKycRejectedEmail(user.email, user.name, aiResult.rejectionReason);
      } catch (error) {
        this.logger.error('Email error after KYC rejection', error);
      }
    }

    return this.prisma.kYC.findUnique({ where: { userId } });
  }

  async findByUserId(userId: string) {
    return this.prisma.kYC.findUnique({ where: { userId } });
  }
}
