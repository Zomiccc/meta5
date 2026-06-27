import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RiskService } from './risk.service';

@Controller('risk')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Get('open-trades')
  async openTrades() {
    return this.riskService.getOpenTrades();
  }

  @Get('exposure')
  async exposure(@Query('symbol') symbol: string) {
    return this.riskService.getExposure(symbol);
  }
}
