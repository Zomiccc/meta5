import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendWelcomeEmail(to: string, name: string) {
    this.logger.log(`Welcome email to ${to}`);
    return this.sendMock('welcome', to, { name });
  }

  async sendKycApprovedEmail(to: string, name: string, mt5Login: string, mt5Password: string, server: string) {
    this.logger.log(`KYC approved email to ${to}`);
    return this.sendMock('kyc-approved', to, { name, mt5Login, mt5Password, server });
  }

  async sendKycRejectedEmail(to: string, name: string, reason: string) {
    this.logger.log(`KYC rejected email to ${to}`);
    return this.sendMock('kyc-rejected', to, { name, reason });
  }

  async sendDepositApprovedEmail(to: string, name: string, amount: number) {
    this.logger.log(`Deposit approved email to ${to}`);
    return this.sendMock('deposit-approved', to, { name, amount });
  }

  async sendWithdrawalApprovedEmail(to: string, name: string, amount: number) {
    this.logger.log(`Withdrawal approved email to ${to}`);
    return this.sendMock('withdrawal-approved', to, { name, amount });
  }

  async sendWithdrawalRejectedEmail(to: string, name: string, amount: number, reason: string) {
    this.logger.log(`Withdrawal rejected email to ${to}`);
    return this.sendMock('withdrawal-rejected', to, { name, amount, reason });
  }

  async sendOtpEmail(to: string, name: string, code: string) {
    this.logger.log(`OTP email to ${to}: ${code}`);
    return this.sendMock('otp', to, { name, code });
  }

  private async sendMock(template: string, to: string, variables: Record<string, any>) {
    const apiKey = this.configService.get('SENDGRID_API_KEY');
    if (!apiKey) {
      this.logger.warn(`SENDGRID_API_KEY not set. Mock email: ${template} -> ${to}`);
      return { mock: true, template, to, variables };
    }
    return { mock: true, template, to, variables };
  }
}
