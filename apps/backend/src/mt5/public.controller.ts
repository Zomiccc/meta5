import { Controller, Get, Query } from '@nestjs/common';
import { PriceFeedService } from './price-feed.service';

@Controller('public')
export class PublicController {
  constructor(private readonly priceFeedService: PriceFeedService) {}

  @Get('prices')
  async getPrices(@Query('symbols') symbols: string) {
    const list = symbols ? symbols.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const prices = await this.priceFeedService.getPrices(list);
    return { prices };
  }

  @Get('markets')
  async getMarkets(@Query('symbols') symbols: string) {
    const list = symbols ? symbols.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const prices = await this.priceFeedService.getPrices(list);
    const changes: Record<string, number | null> = {};
    const sources: Record<string, string> = {};

    await Promise.all(
      list.map(async (symbol) => {
        sources[symbol] = this.priceFeedService.getPriceSource(symbol);
        if (prices[symbol] === undefined) {
          changes[symbol] = null;
          return;
        }
        try {
          const history = await this.priceFeedService.getHistory(symbol, 1);
          if (history && history.length > 1) {
            const prev = history[0].close;
            const current = prices[symbol];
            if (prev > 0) {
              changes[symbol] = Number((((current - prev) / prev) * 100).toFixed(2));
              return;
            }
          }
        } catch {}
        changes[symbol] = null;
      })
    );

    return { prices, changes, sources };
  }
}
