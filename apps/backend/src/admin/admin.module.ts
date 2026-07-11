import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { DepositModule } from '../deposit/deposit.module';
import { WithdrawalModule } from '../withdrawal/withdrawal.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, DepositModule, WithdrawalModule, EmailModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
