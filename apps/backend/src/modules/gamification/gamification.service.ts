/**
 * Gamification Service
 * Manages badges, points, and streaks for patients and providers
 */

import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { Badge, UserBadge, BadgeCategory } from '@neurobridge/shared';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Award badge to user
   */
  async awardBadge(userId: string, badgeCode: string, context?: any): Promise<UserBadge> {
    // Check if badge already awarded
    const existing = await this.db.query<any>(
      `SELECT * FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = $1 AND b.code = $2`,
      [userId, badgeCode]
    );

    if (existing.rows.length > 0) {
      this.logger.log(`Badge ${badgeCode} already awarded to user ${userId}`);
      return this.mapToUserBadge(existing.rows[0]);
    }

    // Get badge
    const badgeResult = await this.db.query<any>('SELECT * FROM badges WHERE code = $1', [
      badgeCode,
    ]);

    if (badgeResult.rows.length === 0) {
      throw new Error(`Badge ${badgeCode} not found`);
    }

    const badge = badgeResult.rows[0];

    // Award badge
    const result = await this.db.query<any>(
      `INSERT INTO user_badges (user_id, badge_id, context) VALUES ($1, $2, $3) RETURNING *`,
      [userId, badge.id, context || null]
    );

    // Award points
    await this.db.query(
      `INSERT INTO point_transactions (user_id, points, reason, context)
       VALUES ($1, $2, $3, $4)`,
      [userId, badge.points_value, `Badge earned: ${badge.name}`, context || null]
    );

    this.logger.log(`Awarded badge ${badgeCode} to user ${userId}`);

    return this.mapToUserBadge({ ...result.rows[0], badge });
  }

  /**
   * Award points to user
   */
  async awardPoints(userId: string, points: number, reason: string, context?: any): Promise<void> {
    await this.db.query(
      `INSERT INTO point_transactions (user_id, points, reason, context)
       VALUES ($1, $2, $3, $4)`,
      [userId, points, reason, context || null]
    );

    this.logger.log(`Awarded ${points} points to user ${userId}: ${reason}`);
  }

  /**
   * Get user's total points
   */
  async getUserPoints(userId: string): Promise<number> {
    const result = await this.db.query<any>(
      'SELECT COALESCE(SUM(points), 0) as total FROM point_transactions WHERE user_id = $1',
      [userId]
    );

    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Get user's badges
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const result = await this.db.query<any>(
      `SELECT ub.*, b.* FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at DESC`,
      [userId]
    );

    return result.rows.map((row: any) => this.mapToUserBadge(row));
  }

  /**
   * Check and award automatic badges based on criteria
   */
  async checkAndAwardAutomaticBadges(userId: string, userType: 'patient' | 'provider'): Promise<void> {
    // Example: First visit badge
    if (userType === 'patient') {
      const visitCount = await this.db.query<any>(
        `SELECT COUNT(*) as count FROM visits WHERE patient_id = (
          SELECT id FROM patients WHERE user_id = $1
        )`,
        [userId]
      );

      if (parseInt(visitCount.rows[0].count, 10) === 1) {
        await this.awardBadge(userId, 'first_visit', { visitCount: 1 });
      }
    }

    // Example: Empathy master badge for providers
    if (userType === 'provider') {
      const provider = await this.db.query<any>(
        'SELECT empathy_score FROM providers WHERE user_id = $1',
        [userId]
      );

      if (provider.rows[0] && parseFloat(provider.rows[0].empathy_score) >= 0.9) {
        await this.awardBadge(userId, 'empathy_master', { empathyScore: provider.rows[0].empathy_score });
      }
    }
  }

  private mapToUserBadge(row: any): UserBadge {
    return {
      id: row.id,
      userId: row.user_id,
      badgeId: row.badge_id,
      earnedAt: row.earned_at,
      context: row.context,
      badge: row.badge_id ? {
        id: row.badge_id,
        code: row.code,
        name: row.name,
        description: row.description,
        category: row.category as BadgeCategory,
        iconUrl: row.icon_url,
        pointsValue: row.points_value,
        criteria: row.criteria,
        nameEs: row.name_es,
        descriptionEs: row.description_es,
        createdAt: row.created_at,
      } : undefined,
    };
  }
}
