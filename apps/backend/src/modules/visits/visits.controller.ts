import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@neurobridge/shared';

@ApiTags('Visits')
@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  @Roles(UserRole.PROVIDER, UserRole.ADMIN)
  async create(@Body() data: any) {
    return this.visitsService.create(data);
  }

  @Get(':id')
  @Roles(UserRole.PATIENT, UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN)
  async findOne(@Param('id') id: string) {
    return this.visitsService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR)
  async update(@Param('id') id: string, @Body() data: any) {
    return this.visitsService.update(id, data);
  }

  @Post(':id/complete')
  @Roles(UserRole.PROVIDER)
  async complete(@Param('id') id: string) {
    return this.visitsService.complete(id);
  }
}
