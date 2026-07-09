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

    // Process AI analysis asynchronously so the upload request returns immediately
    this.processKycBackground(userId, files.cnicFront.buffer, files.cnicBack.buffer, files.selfie.buffer).catch((error) => {
      this.logger.error('Background KYC processing error', error);
    });

    return this.prisma.kYC.findUnique({ where: { userId } });
  }

  private async processKycBackground(userId: string, cnicFrontBuffer: Buffer, cnicBackBuffer: Buffer, selfieBuffer: Buffer) {
    let aiResult: KycAiResult;
    try {
      // Add a 15 second timeout so the user never waits forever
      aiResult = await this.promiseWithTimeout(
        this.visionService.processKyc(cnicFrontBuffer, cnicBackBuffer, selfieBuffer),
        15_000,
        {
          approved: false,
          hardFail: false,
          name: null,
          cnicNumber: null,
          expiryDate: null,
          faceMatch: false,
          confidence: 0,
          flags: ['AI analysis timed out - admin review required'],
          rejectionReason: null,
        },
      );
    } catch (error) {
      this.logger.error('KYC analysis error', error);
      aiResult = {
        approved: false,
        hardFail: false,
        name: null,
        cnicNumber: null,
        expiryDate: null,
        faceMatch: false,
        confidence: 0,
        flags: ['AI analysis failed - admin review required'],
        rejectionReason: null,
      };
    }

    // Real logic:
    //  - hardFail = obvious fake/corrupt/duplicate -> auto-reject
    //  - approved = Google Vision verified faces + readable ID + no issues -> auto-approve
    //  - otherwise = pending admin review (only happens when Google Vision is unavailable)
    const newStatus = aiResult.hardFail ? 'rejected' : (aiResult.approved ? 'approved' : 'pending');

    await this.prisma.kYC.update({
      where: { userId },
      data: {
        aiResponse: aiResult as any,
        status: newStatus,
        rejectionReason: aiResult.hardFail ? aiResult.rejectionReason : null,
      },
    });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    if (aiResult.approved) {
      try {
        const mt5 = await this.mt5Service.createAccount(userId);
        await this.emailService.sendKycApprovedEmail(user.email, user.name, mt5.login, mt5.password, mt5.server);
      } catch (error) {
        this.logger.error('MT5/Email error after KYC approval', error);
      }
    } else if (aiResult.hardFail && aiResult.rejectionReason) {
      try {
        await this.emailService.sendKycRejectedEmail(user.email, user.name, aiResult.rejectionReason);
      } catch (error) {
        this.logger.error('Email error after KYC rejection', error);
      }
    }
  }

  private promiseWithTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('KYC processing timeout')), ms)),
    ]).catch(() => fallback);
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
