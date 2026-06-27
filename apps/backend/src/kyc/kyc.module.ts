import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { VisionService } from './vision.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { FileModule } from '../file/file.module';
import { EmailModule } from '../email/email.module';
import { Mt5Module } from '../mt5/mt5.module';

@Module({
  imports: [PrismaModule, FileModule, EmailModule, Mt5Module],
  controllers: [KycController],
  providers: [KycService, VisionService],
  exports: [KycService],
})
export class KycModule {}
