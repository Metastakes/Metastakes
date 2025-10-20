import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Gamification')
@Controller('gamification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('my-badges')
  async getMyBadges(@CurrentUser() user: any) {
    return this.gamificationService.getUserBadges(user.sub);
  }

  @Get('my-points')
  async getMyPoints(@CurrentUser() user: any) {
    const total = await this.gamificationService.getUserPoints(user.sub);
    return { total };
  }

  @Post('award-badge')
  async awardBadge(@Body() data: { userId: string; badgeCode: string; context?: any }) {
    return this.gamificationService.awardBadge(data.userId, data.badgeCode, data.context);
  }
}
