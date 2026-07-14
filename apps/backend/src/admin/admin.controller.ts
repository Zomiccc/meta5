import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async dashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('clients')
  async clients() {
    return this.adminService.getClients();
  }

  @Delete('clients/:id')
  async deleteClient(@Param('id') id: string) {
    return this.adminService.deleteClient(id);
  }

  @Get('kyc/pending')
  async pendingKyc() {
    return this.adminService.getPendingKyc();
  }

  @Get('kyc')
  async allKyc(@Query('status') status: string) {
    return this.adminService.getAllKyc(status);
  }

  @Post('kyc/:id/approve')
  async approveKyc(@Param('id') id: string) {
    return this.adminService.approveKyc(id);
  }

  @Post('kyc/:id/reject')
  async rejectKyc(@Param('id') id: string, @Body('reason') reason: string) {
    return this.adminService.rejectKyc(id, reason);
  }

  @Post('kyc/:id/reset')
  async resetKyc(@Param('id') id: string) {
    return this.adminService.resetKyc(id);
  }

  @Delete('kyc')
  async deleteAllKyc() {
    return this.adminService.deleteAllKyc();
  }

  @Get('deposits')
  async deposits(@Query('status') status: string) {
    return this.adminService.getDeposits(status);
  }

  @Post('deposits/:id/approve')
  async approveDeposit(@Param('id') id: string) {
    return this.adminService.approveDeposit(id);
  }

  @Post('deposits/:id/reject')
  async rejectDeposit(@Param('id') id: string) {
    return this.adminService.rejectDeposit(id);
  }

  @Get('withdrawals')
  async withdrawals(@Query('status') status: string) {
    return this.adminService.getWithdrawals(status);
  }

  @Post('withdrawals/:id/approve')
  async approveWithdrawal(@Param('id') id: string) {
    return this.adminService.approveWithdrawal(id);
  }

  @Post('withdrawals/:id/reject')
  async rejectWithdrawal(@Param('id') id: string, @Body('reason') reason: string) {
    return this.adminService.rejectWithdrawal(id, reason);
  }
}
