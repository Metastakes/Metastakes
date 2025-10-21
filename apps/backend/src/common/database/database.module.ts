/**
 * Database Module
 * PostgreSQL connection and query interface
 */

import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';
import { PG_CONNECTION } from './database.constants';

@Global()
@Module({
  providers: [
    {
      provide: PG_CONNECTION,
      useFactory: () => {
        return new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl:
            process.env.DATABASE_SSL_MODE === 'require'
              ? { rejectUnauthorized: false }
              : false,
          min: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
          max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        });
      },
    },
    DatabaseService,
  ],
  exports: [PG_CONNECTION, DatabaseService],
})
export class DatabaseModule {}
