/**
 * NeuroBridge App Module
 * Main application module with all feature modules
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Common modules
import { DatabaseModule } from './common/database/database.module';
import { RedisModule } from './common/redis/redis.module';
import { EncryptionModule } from './common/encryption/encryption.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PatientsModule } from './modules/patients/patients.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { VisitsModule } from './modules/visits/visits.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { LabsModule } from './modules/labs/labs.module';
import { GLP1Module } from './modules/glp1/glp1.module';
import { ConsentsModule } from './modules/consents/consents.module';
import { PDMPModule } from './modules/pdmp/pdmp.module';
import { ERxModule } from './modules/erx/erx.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { AIModule } from './modules/ai/ai.module';
import { AuditModule } from './modules/audit/audit.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';

// Guards
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Rate limiting (HIPAA security requirement)
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        limit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      },
    ]),

    // Common/Infrastructure
    DatabaseModule,
    RedisModule,
    EncryptionModule,

    // Core Features
    AuthModule,
    UsersModule,
    PatientsModule,
    ProvidersModule,
    VisitsModule,
    PrescriptionsModule,
    LabsModule,
    GLP1Module,
    ConsentsModule,

    // Compliance & Integrations
    PDMPModule,
    ERxModule,
    CalendarModule,
    NotificationsModule,

    // Advanced Features
    GamificationModule,
    AIModule,
    AuditModule,
    ReportsModule,
  ],
  providers: [
    // Global guards (applied to all routes)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Note: JwtAuthGuard and RolesGuard will be applied at controller level
    // to allow public routes (login, register, etc.)
  ],
})
export class AppModule {}
