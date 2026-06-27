import { Module } from '@nestjs/common';
import { Mt5Service } from './mt5.service';
import { Mt5BridgeService } from './mt5-bridge.service';
import { OandaService } from './oanda.service';
import { Mt5Controller } from './mt5.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [Mt5Controller],
  providers: [Mt5Service, Mt5BridgeService, OandaService],
  exports: [Mt5Service],
})
export class Mt5Module {}
