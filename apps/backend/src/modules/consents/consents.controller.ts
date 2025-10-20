import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConsentsService } from './consents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Consents')
@Controller('consents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConsentsController {
  constructor(private readonly consentsService: ConsentsService) {}

  @Post()
  async create(@Body() data: any) {
    return this.consentsService.create(data.patientId, data.consentType, data);
  }

  @Get('patient/:patientId')
  async getPatientConsents(@Param('patientId') patientId: string) {
    return this.consentsService.getActiveConsents(patientId);
  }
}
