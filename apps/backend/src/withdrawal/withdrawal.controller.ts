import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WithdrawalService } from './withdrawal.service';

@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Get()
  async list(@CurrentUser() user: any) {
    return this.withdrawalService.findByUser(user.userId);
  }

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() data: { amount: number; walletAddress: string; crypto: string },
  ) {
    return this.withdrawalService.createRequest(user.userId, data.amount, data.walletAddress, data.crypto || 'USDT');
  }
}
