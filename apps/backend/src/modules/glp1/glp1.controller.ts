import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GLP1Service } from './glp1.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('GLP-1')
@Controller('glp1')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GLP1Controller {
  constructor(private readonly glp1Service: GLP1Service) {}

  @Post('programs')
  async createProgram(@Body() data: any) {
    return this.glp1Service.createProgram(data.patientId, data.providerId, data);
  }

  @Post('checkins')
  async createCheckin(@Body() data: any) {
    return this.glp1Service.createCheckin(data.programId, data);
  }
}
