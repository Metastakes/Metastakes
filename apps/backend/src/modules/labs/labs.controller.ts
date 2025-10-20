import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LabsService } from './labs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Labs')
@Controller('labs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LabsController {
  constructor(private readonly labsService: LabsService) {}

  @Post()
  async create(@Body() data: any) {
    return this.labsService.create(data.patientId, data);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.labsService.findById(id);
  }
}
