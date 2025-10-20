/**
 * Database Service
 * Provides type-safe database query methods
 */

import { Injectable, Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import { PG_CONNECTION } from './database.module';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@Inject(PG_CONNECTION) private readonly pool: Pool) {}

  /**
   * Execute a query with parameterized values (SQL injection protection)
   */
  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;

      if (duration > 1000) {
        this.logger.warn(`Slow query detected (${duration}ms): ${text.substring(0, 100)}...`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Database query error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Transaction error: ${error.message}`, error.stack);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find one record
   */
  async findOne<T>(table: string, where: Record<string, any>): Promise<T | null> {
    const keys = Object.keys(where);
    const values = Object.values(where);
    const conditions = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');

    const query = `SELECT * FROM ${table} WHERE ${conditions} LIMIT 1`;
    const result = await this.query<T>(query, values);

    return result.rows[0] || null;
  }

  /**
   * Find many records
   */
  async findMany<T>(
    table: string,
    where?: Record<string, any>,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<T[]> {
    let query = `SELECT * FROM ${table}`;
    const values: any[] = [];

    if (where) {
      const keys = Object.keys(where);
      const conditions = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
      query += ` WHERE ${conditions}`;
      values.push(...Object.values(where));
    }

    if (options?.orderBy) {
      query += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'DESC'}`;
    }

    if (options?.limit) {
      query += ` LIMIT ${options.limit}`;
    }

    if (options?.offset) {
      query += ` OFFSET ${options.offset}`;
    }

    const result = await this.query<T>(query, values);
    return result.rows;
  }

  /**
   * Create a record
   */
  async create<T>(table: string, data: Record<string, any>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.query<T>(query, values);
    return result.rows[0];
  }

  /**
   * Update a record
   */
  async update<T>(
    table: string,
    where: Record<string, any>,
    data: Record<string, any>
  ): Promise<T | null> {
    const dataKeys = Object.keys(data);
    const dataValues = Object.values(data);
    const whereKeys = Object.keys(where);
    const whereValues = Object.values(where);

    const setClause = dataKeys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    const whereClause = whereKeys
      .map((key, i) => `${key} = $${i + 1 + dataKeys.length}`)
      .join(' AND ');

    const query = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${whereClause}
      RETURNING *
    `;

    const result = await this.query<T>(query, [...dataValues, ...whereValues]);
    return result.rows[0] || null;
  }

  /**
   * Delete a record (soft delete preferred for HIPAA retention)
   */
  async delete(table: string, where: Record<string, any>): Promise<number> {
    const keys = Object.keys(where);
    const values = Object.values(where);
    const conditions = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');

    const query = `DELETE FROM ${table} WHERE ${conditions}`;
    const result = await this.query(query, values);

    return result.rowCount || 0;
  }

  /**
   * Soft delete (sets deleted_at timestamp)
   */
  async softDelete(table: string, where: Record<string, any>): Promise<number> {
    const keys = Object.keys(where);
    const values = Object.values(where);
    const conditions = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');

    const query = `
      UPDATE ${table}
      SET deleted_at = NOW()
      WHERE ${conditions} AND deleted_at IS NULL
    `;

    const result = await this.query(query, values);
    return result.rowCount || 0;
  }

  /**
   * Count records
   */
  async count(table: string, where?: Record<string, any>): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${table}`;
    const values: any[] = [];

    if (where) {
      const keys = Object.keys(where);
      const conditions = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
      query += ` WHERE ${conditions}`;
      values.push(...Object.values(where));
    }

    const result = await this.query<{ count: string }>(query, values);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Check if record exists
   */
  async exists(table: string, where: Record<string, any>): Promise<boolean> {
    const count = await this.count(table, where);
    return count > 0;
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('Database connection pool closed');
  }
}
