import { Module } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { Mt5Module } from '../mt5/mt5.module';
import { EmailModule } from '../email/email.module';
import { BitgetModule } from '../bitget/bitget.module';

@Module({
  imports: [PrismaModule, Mt5Module, EmailModule, BitgetModule],
  controllers: [DepositController],
  providers: [DepositService],
  exports: [DepositService],
})
export class DepositModule {}
