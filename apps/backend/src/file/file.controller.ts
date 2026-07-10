import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get('signed-url')
  @Roles('admin')
  async getSignedUrl(@Query('key') key: string) {
    return { url: this.fileService.getSignedUrl(key) };
  }
}
