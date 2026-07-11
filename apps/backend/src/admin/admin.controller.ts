import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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
