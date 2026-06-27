import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AffiliateService } from './affiliate.service';

@Controller('affiliate')
@UseGuards(JwtAuthGuard)
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Get()
  async getAffiliate(@CurrentUser() user: any) {
    return this.affiliateService.getAffiliate(user.userId);
  }
}
