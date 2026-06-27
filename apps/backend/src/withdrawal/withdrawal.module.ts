import { Module } from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { WithdrawalController } from './withdrawal.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { Mt5Module } from '../mt5/mt5.module';

@Module({
  imports: [PrismaModule, Mt5Module],
  controllers: [WithdrawalController],
  providers: [WithdrawalService],
  exports: [WithdrawalService],
})
export class WithdrawalModule {}
