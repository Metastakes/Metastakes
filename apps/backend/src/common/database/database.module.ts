/**
 * Database Module
 * PostgreSQL connection and query interface
 */

import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';

export const PG_CONNECTION = 'PG_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: PG_CONNECTION,
      useFactory: (configService: ConfigService) => {
        return new Pool({
          connectionString: configService.get<string>('DATABASE_URL'),
          ssl:
            configService.get<string>('DATABASE_SSL_MODE') === 'require'
              ? { rejectUnauthorized: false }
              : false,
          min: configService.get<number>('DATABASE_POOL_MIN', 2),
          max: configService.get<number>('DATABASE_POOL_MAX', 10),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        });
      },
      inject: [ConfigService],
    },
    DatabaseService,
  ],
  exports: [PG_CONNECTION, DatabaseService],
})
export class DatabaseModule {}
