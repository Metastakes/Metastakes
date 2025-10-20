import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@neurobridge/shared';

@ApiTags('Providers')
@Controller('providers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get('me')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR)
  async getMyProfile(@CurrentUser() user: any) {
    return this.providersService.findByUserId(user.sub);
  }

  @Patch('me')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR)
  async updateMyProfile(@CurrentUser() user: any, @Body() data: any) {
    const provider = await this.providersService.findByUserId(user.sub);
    return this.providersService.update(provider.id, data);
  }

  @Get(':id')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN, UserRole.OWNER)
  async findOne(@Param('id') id: string) {
    return this.providersService.findById(id);
  }
}
