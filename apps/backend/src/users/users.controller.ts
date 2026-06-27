import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser() user: any) {
    return this.usersService.findById(user.userId);
  }

  @Put('me')
  async updateMe(@CurrentUser() user: any, @Body() data: { name?: string; phone?: string }) {
    return this.usersService.updateProfile(user.userId, data);
  }
}
