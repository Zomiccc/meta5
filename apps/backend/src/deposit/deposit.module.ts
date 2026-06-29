import { Module } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { BlockchainService } from './blockchain.service';
import { TronService } from './tron.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { Mt5Module } from '../mt5/mt5.module';

@Module({
  imports: [PrismaModule, Mt5Module],
  controllers: [DepositController],
  providers: [DepositService, BlockchainService, TronService],
  exports: [DepositService, TronService],
})
export class DepositModule {}
