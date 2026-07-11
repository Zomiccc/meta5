import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { KycModule } from '../kyc/kyc.module';
import { DepositModule } from '../deposit/deposit.module';
import { WithdrawalModule } from '../withdrawal/withdrawal.module';
import { EmailModule } from '../email/email.module';
import { FileModule } from '../file/file.module';
import { Mt5Module } from '../mt5/mt5.module';

@Module({
  imports: [PrismaModule, KycModule, DepositModule, WithdrawalModule, EmailModule, FileModule, Mt5Module],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
