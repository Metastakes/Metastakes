/**
 * Users Service
 * CRUD operations for users table
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { User } from '@neurobridge/shared';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const result = await this.db.query<any>(
      'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );

    return result.rows[0] ? this.mapToUser(result.rows[0]) : null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db.query<any>(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email]
    );

    return result.rows[0] ? this.mapToUser(result.rows[0]) : null;
  }

  /**
   * Create new user
   */
  async create(data: Partial<User> & { password_hash: string }): Promise<User> {
    const result = await this.db.query<any>(
      `INSERT INTO users (
        email, password_hash, role, is_active, is_email_verified,
        two_factor_enabled, preferred_locale
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        data.email,
        (data as any).password_hash,
        data.role,
        data.isActive ?? true,
        data.isEmailVerified ?? false,
        data.twoFactorEnabled ?? false,
        data.preferredLocale ?? 'en',
      ]
    );

    return this.mapToUser(result.rows[0]);
  }

  /**
   * Update user
   */
  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${this.camelToSnake(key)} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return user;
    }

    values.push(id);

    const result = await this.db.query<any>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return this.mapToUser(result.rows[0]);
  }

  /**
   * Soft delete user
   */
  async delete(id: string): Promise<void> {
    await this.db.query('UPDATE users SET deleted_at = NOW() WHERE id = $1', [id]);
  }

  /**
   * Map database row to User type
   */
  private mapToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      isActive: row.is_active,
      isEmailVerified: row.is_email_verified,
      twoFactorEnabled: row.two_factor_enabled,
      preferredLocale: row.preferred_locale,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } as any; // Include extra fields for auth (password_hash, etc.) but never expose in API
  }

  /**
   * Convert camelCase to snake_case
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}
