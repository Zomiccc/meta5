import { Controller, Get, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get()
  async getKyc(@CurrentUser() user: any) {
    return this.kycService.findByUserId(user.userId);
  }

  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cnicFront', maxCount: 1 },
      { name: 'cnicBack', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
    ]),
  )
  async upload(
    @CurrentUser() user: any,
    @UploadedFiles()
    files: {
      cnicFront?: Express.Multer.File[];
      cnicBack?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
  ) {
    return this.kycService.uploadDocuments(user.userId, {
      cnicFront: files.cnicFront?.[0],
      cnicBack: files.cnicBack?.[0],
      selfie: files.selfie?.[0],
    });
  }
}
