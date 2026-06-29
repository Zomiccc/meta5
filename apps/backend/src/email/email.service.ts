import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private enabled = false;
  private from: string;
  private readonly brand = 'FXONS';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.from = this.configService.get<string>('SENDGRID_FROM_EMAIL') || 'noreply@fxons.com';
    if (apiKey && !apiKey.startsWith('your-')) {
      sgMail.setApiKey(apiKey);
      this.enabled = true;
    } else {
      this.logger.warn('SENDGRID_API_KEY not set; emails will be logged only');
    }
  }

  async sendWelcomeEmail(to: string, name: string) {
    return this.send(to, `Welcome to ${this.brand}`, this.wrap(
      'Welcome aboard',
      `<p>Hi ${name},</p><p>Your ${this.brand} account has been created. Verify your email and complete KYC to start trading global markets.</p>`,
    ));
  }

  async sendVerificationEmail(to: string, name: string, code: string) {
    return this.send(to, `Your ${this.brand} verification code`, this.wrap(
      'Verify your email',
      `<p>Hi ${name},</p><p>Use the code below to verify your email address. It expires in 10 minutes.</p>${this.codeBox(code)}`,
    ));
  }

  async sendKycApprovedEmail(to: string, name: string, mt5Login: string, mt5Password: string, server: string) {
    return this.send(to, `${this.brand} — KYC Approved`, this.wrap(
      'KYC Approved',
      `<p>Hi ${name},</p><p>Your identity verification is complete. Your trading account is ready:</p>` +
      `<p><b>Login:</b> ${mt5Login}<br/><b>Password:</b> ${mt5Password}<br/><b>Server:</b> ${server}</p>`,
    ));
  }

  async sendKycRejectedEmail(to: string, name: string, reason: string) {
    return this.send(to, `${this.brand} — KYC Update`, this.wrap(
      'KYC Needs Attention',
      `<p>Hi ${name},</p><p>We could not verify your documents. Reason: <b>${reason}</b></p><p>Please re-upload clear photos.</p>`,
    ));
  }

  async sendDepositApprovedEmail(to: string, name: string, amount: number) {
    return this.send(to, `${this.brand} — Deposit Confirmed`, this.wrap(
      'Deposit Confirmed',
      `<p>Hi ${name},</p><p>Your deposit of <b>$${amount.toFixed(2)}</b> has been credited to your account.</p>`,
    ));
  }

  async sendWithdrawalApprovedEmail(to: string, name: string, amount: number, txHash?: string) {
    const tx = txHash ? `<p><b>Transaction:</b> ${txHash}</p>` : '';
    return this.send(to, `${this.brand} — Withdrawal Sent`, this.wrap(
      'Withdrawal Sent',
      `<p>Hi ${name},</p><p>Your withdrawal of <b>$${amount.toFixed(2)}</b> has been sent to your wallet.</p>${tx}`,
    ));
  }

  async sendWithdrawalRejectedEmail(to: string, name: string, amount: number, reason: string) {
    return this.send(to, `${this.brand} — Withdrawal Update`, this.wrap(
      'Withdrawal Rejected',
      `<p>Hi ${name},</p><p>Your withdrawal of <b>$${amount.toFixed(2)}</b> was rejected. Reason: <b>${reason}</b></p>`,
    ));
  }

  async sendOtpEmail(to: string, name: string, code: string) {
    return this.sendVerificationEmail(to, name, code);
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.enabled) {
      this.logger.warn(`[MOCK EMAIL] to=${to} subject="${subject}"`);
      return { mock: true, to, subject };
    }
    try {
      await sgMail.send({ to, from: this.from, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
      return { sent: true, to, subject };
    } catch (error: any) {
      this.logger.error(`SendGrid error: ${error?.response?.body ? JSON.stringify(error.response.body) : error.message}`);
      return { sent: false, error: error.message };
    }
  }

  private codeBox(code: string) {
    return `<div style="margin:24px 0;text-align:center"><span style="display:inline-block;font-size:32px;letter-spacing:10px;font-weight:700;color:#0b1220;background:#f1c40f;padding:16px 28px;border-radius:12px">${code}</span></div>`;
  }

  private wrap(heading: string, body: string) {
    return `<div style="font-family:Arial,Helvetica,sans-serif;background:#0b1220;padding:32px">
      <div style="max-width:560px;margin:0 auto;background:#111a2e;border:1px solid #1e293b;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#f1c40f,#d4ac0d);padding:20px 28px">
          <h1 style="margin:0;font-size:22px;color:#0b1220;font-weight:800">FXONS</h1>
        </div>
        <div style="padding:28px;color:#cbd5e1;font-size:15px;line-height:1.6">
          <h2 style="color:#fff;font-size:20px;margin-top:0">${heading}</h2>
          ${body}
        </div>
        <div style="padding:18px 28px;border-top:1px solid #1e293b;color:#64748b;font-size:12px">
          &copy; ${new Date().getFullYear()} FXONS. All rights reserved.
        </div>
      </div>
    </div>`;
  }
}
