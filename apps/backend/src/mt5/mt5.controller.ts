import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Mt5Service } from './mt5.service';

@Controller('mt5')
@UseGuards(JwtAuthGuard)
export class Mt5Controller {
  constructor(private readonly mt5Service: Mt5Service) {}

  @Get('account')
  async account(@CurrentUser() user: any) {
    return this.mt5Service.getAccount(user.userId);
  }

  @Post('test-fund')
  async testFund(@CurrentUser() user: any, @Body('amount') amount: number) {
    const fundAmount = amount || 10000;
    return this.mt5Service.testFund(user.userId, Number(fundAmount));
  }

  @Post('trade')
  async openTrade(
    @CurrentUser() user: any,
    @Body('symbol') symbol: string,
    @Body('type') type: 'BUY' | 'SELL',
    @Body('volume') volume: number,
  ) {
    return this.mt5Service.openTrade(user.userId, symbol, type, Number(volume));
  }

  @Get('trades')
  async getTrades(@CurrentUser() user: any) {
    return this.mt5Service.getTrades(user.userId);
  }

  @Post('trades/:id/close')
  async closeTrade(@CurrentUser() user: any, @Param('id') id: string) {
    return this.mt5Service.closeTrade(user.userId, id);
  }

  @Get('instruments')
  async instruments() {
    return this.mt5Service.getInstruments();
  }

  @Get('price')
  async getPrice(@Query('symbol') symbol: string) {
    const price = await this.mt5Service.getLivePrice(symbol);
    return { symbol, price };
  }

  @Get('prices')
  async getPrices(@Query('symbols') symbols: string) {
    const list = symbols ? symbols.split(',').map((s) => s.trim()) : [];
    const prices = await this.mt5Service.getLivePrices(list);
    return prices;
  }

  @Get('price-config')
  async priceConfig() {
    return { simulated: this.mt5Service.isAnyPriceSimulated() };
  }

  @Get('history')
  async getHistory(@Query('symbol') symbol: string, @Query('days') days?: string) {
    const data = await this.mt5Service.getPriceHistory(symbol, days ? Number(days) : 1);
    return { symbol, data };
  }

  @Get('price-source')
  async priceSource(@Query('symbol') symbol: string) {
    return { symbol, source: this.mt5Service.getPriceSource(symbol) };
  }
}
