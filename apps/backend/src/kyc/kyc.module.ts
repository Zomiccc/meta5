import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { VisionService } from './vision.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [PrismaModule, FileModule],
  controllers: [KycController],
  providers: [KycService, VisionService],
  exports: [KycService],
})
export class KycModule {}
