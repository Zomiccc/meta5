import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DepositService } from './deposit.service';

@Controller('deposits')
@UseGuards(JwtAuthGuard)
export class DepositController {
  constructor(
    private readonly depositService: DepositService,
  ) {}

  @Get()
  async list(@CurrentUser() user: any) {
    return this.depositService.findByUser(user.userId);
  }

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() data: { amount: number; crypto: string },
  ) {
    return this.depositService.createDepositRequest(user.userId, data.amount, data.crypto || 'USDT');
  }

  @Post(':id/check-payment')
  async checkPayment(@CurrentUser() user: any, @Param('id') id: string) {
    return this.depositService.checkPayment(user.userId, id);
  }
}
