import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AffiliateService {
  constructor(private readonly prisma: PrismaService) {}

  async getAffiliate(userId: string) {
    return this.prisma.affiliate.findUnique({
      where: { userId },
      include: { user: { select: { name: true, email: true } } },
    });
  }
}
