/**
 * Patients Controller
 * Patient management endpoints
 */

import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@neurobridge/shared';

@ApiTags('Patients')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  /**
   * Get current patient profile
   */
  @Get('me')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Get current patient profile' })
  @ApiResponse({ status: 200, description: 'Patient profile retrieved' })
  async getMyProfile(@CurrentUser() user: any) {
    const patient = await this.patientsService.findByUserId(user.sub);

    if (!patient) {
      throw new ForbiddenException('Patient profile not found');
    }

    return patient;
  }

  /**
   * Update current patient profile
   */
  @Patch('me')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Update current patient profile' })
  @ApiResponse({ status: 200, description: 'Patient profile updated' })
  async updateMyProfile(@CurrentUser() user: any, @Body() data: any) {
    const patient = await this.patientsService.findByUserId(user.sub);

    if (!patient) {
      throw new ForbiddenException('Patient profile not found');
    }

    return this.patientsService.update(patient.id, data);
  }

  /**
   * Get patient by ID (provider/admin only)
   */
  @Get(':id')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get patient by ID (provider/admin only)' })
  @ApiResponse({ status: 200, description: 'Patient found' })
  async findOne(@Param('id') id: string) {
    return this.patientsService.findById(id);
  }

  /**
   * Update patient by ID (provider/admin only)
   */
  @Patch(':id')
  @Roles(UserRole.PROVIDER, UserRole.MENTOR, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update patient (provider/admin only)' })
  @ApiResponse({ status: 200, description: 'Patient updated' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.patientsService.update(id, data);
  }
}
