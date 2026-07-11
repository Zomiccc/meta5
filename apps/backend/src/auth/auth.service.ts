import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(dto.password, 12);
    const referralCode = this.generateReferralCode();

    // Resolve the referrer by their referral code (referredBy is a FK to User.id)
    let referrerId: string | null = null;
    if (dto.referralCode) {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode: dto.referralCode },
        select: { id: true },
      });
      referrerId = referrer?.id ?? null;
    }

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hash,
        phone: dto.phone,
        country: dto.country,
        countryCode: dto.countryCode,
        referralCode,
        referredBy: referrerId,
      },
      omit: { password: true },
    });

    if (referrerId) {
      await this.prisma.affiliate.updateMany({
        where: { userId: referrerId },
        data: { totalReferred: { increment: 1 } },
      });
    }

    await this.prisma.affiliate.create({
      data: { userId: user.id, referralCode },
    });

    await this.emailService.sendWelcomeEmail(user.email, user.name);
    await this.sendVerificationCode(user.email, user.name);

    const tokens = await this.generateTokens(user.id, user.role);
    return { user, ...tokens };
  }

  private async sendVerificationCode(email: string, name: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.prisma.emailOtp.deleteMany({ where: { email, purpose: 'verify_email' } });
    await this.prisma.emailOtp.create({
      data: {
        email,
        code,
        purpose: 'verify_email',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    await this.emailService.sendVerificationEmail(email, name, code);
  }

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (user.emailVerified) return { message: 'Email already verified' };
    await this.sendVerificationCode(user.email, user.name);
    return { message: 'Verification code sent' };
  }

  async verifyEmail(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (user.emailVerified) return { verified: true };

    const record = await this.prisma.emailOtp.findFirst({
      where: { email: user.email, purpose: 'verify_email' },
      orderBy: { createdAt: 'desc' },
    });
    if (!record || record.code !== code || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired code');
    }

    await this.prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
    await this.prisma.emailOtp.deleteMany({ where: { email: user.email, purpose: 'verify_email' } });
    return { verified: true };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (user.status === 'suspended') throw new UnauthorizedException('Account suspended');

    const tokens = await this.generateTokens(user.id, user.role);
    const { password, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  }

  async refreshTokens(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { token } });
    const tokens = await this.generateTokens(stored.user.id, stored.user.role);
    const { password, ...safeUser } = stored.user;
    return { user: safeUser, ...tokens };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Logged out' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      omit: { password: true },
      include: { mt5Account: true, affiliate: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async requestOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Email not found');
    await this.sendVerificationCode(email, user.name);
    return { message: 'OTP sent' };
  }

  async verifyOtp(email: string, code: string) {
    const record = await this.prisma.emailOtp.findFirst({
      where: { email, purpose: 'verify_email' },
      orderBy: { createdAt: 'desc' },
    });
    if (!record || record.code !== code || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    await this.prisma.user.updateMany({ where: { email }, data: { emailVerified: true } });
    await this.prisma.emailOtp.deleteMany({ where: { email, purpose: 'verify_email' } });
    return { verified: true };
  }

  private async generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(userId);
    return { accessToken, refreshToken };
  }

  private async createRefreshToken(userId: string) {
    const token = [...Array(64)].map(() => Math.random().toString(36)[2]).join('');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });
    return token;
  }

  private generateReferralCode(): string {
    return [...Array(8)].map(() => Math.random().toString(36)[2]).join('').toUpperCase();
  }
}
