import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@neurobridge/shared';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('session/start')
  @Roles(UserRole.PROVIDER)
  async startSession(@Body() data: { visitId: string; providerId: string; inputData: any }) {
    return this.aiService.startSession(data.visitId, data.providerId, data.inputData);
  }

  @Post('safety-check')
  @Roles(UserRole.PROVIDER)
  async safetyCheck(@Body() data: { patientData: any; plannedMedication: any }) {
    return this.aiService.generateSafetyAlerts(data.patientData, data.plannedMedication);
  }

  @Post('next-question')
  @Roles(UserRole.PROVIDER)
  async nextQuestion(@Body() context: any) {
    return this.aiService.generateNextQuestion(context);
  }
}
