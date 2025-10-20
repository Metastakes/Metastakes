import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PDMPService } from './pdmp.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@neurobridge/shared';

@ApiTags('Compliance')
@Controller('pdmp')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PDMPController {
  constructor(private readonly pdmpService: PDMPService) {}

  @Post('check')
  @Roles(UserRole.PROVIDER)
  async checkPatient(@Body() data: { patientId: string; providerId: string; visitId?: string }) {
    return this.pdmpService.checkPatient(data.patientId, data.providerId, data.visitId);
  }

  @Post('acknowledge')
  @Roles(UserRole.PROVIDER)
  async acknowledge(@Body() data: { pdmpCheckId: string; providerId: string; notes: string }) {
    await this.pdmpService.acknowledgePDMPCheck(data.pdmpCheckId, data.providerId, data.notes);
    return { message: 'PDMP check acknowledged' };
  }
}
