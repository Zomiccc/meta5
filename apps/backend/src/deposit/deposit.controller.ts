import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DepositService } from './deposit.service';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('deposits')
@UseGuards(JwtAuthGuard)
export class DepositController {
  constructor(
    private readonly depositService: DepositService,
    private readonly prisma: PrismaService,
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

  @Post('test')
  async testDeposit(@CurrentUser() user: any, @Body('amount') amount: number) {
    const depositAmount = amount || 1000;
    const deposit = await this.prisma.deposit.create({
      data: {
        userId: user.userId,
        amount: depositAmount,
        uniqueAmount: depositAmount,
        cryptoCurrency: 'USDT',
        cryptoAddress: 'TEST-DEPOSIT',
        status: 'pending',
      },
    });
    await this.depositService.approveDeposit(deposit.id);
    return { message: `Test deposit of $${depositAmount} approved`, depositId: deposit.id };
  }
}
