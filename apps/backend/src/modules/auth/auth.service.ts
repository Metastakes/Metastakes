/**
 * Authentication Service
 * Handles user registration, login, token management
 */

import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { DatabaseService } from '../../common/database/database.service';
import { RedisService } from '../../common/redis/redis.service';
import { User, UserRole, AuthTokens, JWTPayload } from '@neurobridge/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly db: DatabaseService,
    private readonly redis: RedisService
  ) {}

  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    role: UserRole,
    additionalData?: any
  ): Promise<User> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await this.usersService.create({
      email,
      password_hash: passwordHash,
      role,
      is_active: true,
      is_email_verified: false,
      preferred_locale: 'en',
      ...additionalData,
    });

    return user;
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string, twoFactorCode?: string): Promise<AuthTokens> {
    // Find user
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    const userAny = user as any;
    if (userAny.locked_until && new Date(userAny.locked_until) > new Date()) {
      const minutesLeft = Math.ceil(
        (new Date(userAny.locked_until).getTime() - Date.now()) / 1000 / 60
      );
      throw new UnauthorizedException(
        `Account locked. Try again in ${minutesLeft} minutes.`
      );
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, userAny.password_hash);
    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        throw new UnauthorizedException('Two-factor authentication code required');
      }

      const isValid = await this.verify2FA(user.id, twoFactorCode);
      if (!isValid) {
        throw new UnauthorizedException('Invalid two-factor authentication code');
      }
    }

    // Reset failed attempts on successful login
    await this.resetFailedAttempts(user.id);

    // Update last login
    await this.db.update('users', { id: user.id }, { last_login_at: new Date() });

    // Generate tokens
    return this.generateTokens(user);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Check if refresh token exists in database
      const session = await this.db.findOne<any>('sessions', {
        user_id: payload.sub,
        refresh_token_hash: this.hashRefreshToken(refreshToken),
      });

      if (!session || new Date(session.expires_at) < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Get user
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Update session with new refresh token
      await this.db.update(
        'sessions',
        { id: session.id },
        {
          refresh_token_hash: this.hashRefreshToken(tokens.refreshToken),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          last_activity_at: new Date(),
        }
      );

      return tokens;
    } catch (error) {
      this.logger.error(`Refresh token error: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Logout (invalidate refresh token)
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    await this.db.query('DELETE FROM sessions WHERE user_id = $1 AND refresh_token_hash = $2', [
      userId,
      refreshTokenHash,
    ]);

    // Clear cached user data
    await this.redis.deletePattern(`user:${userId}:*`);
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    await this.db.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    await this.redis.deletePattern(`user:${userId}:*`);
  }

  /**
   * Validate user from JWT payload
   */
  async validateUser(payload: JWTPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  /**
   * Generate access + refresh tokens
   */
  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    };

    const accessToken = this.jwtService.sign(payload);

    // Refresh token with longer expiration
    const refreshPayload = {
      sub: user.id,
      type: 'refresh',
    };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    // Store refresh token in database
    await this.db.create('sessions', {
      user_id: user.id,
      refresh_token_hash: this.hashRefreshToken(refreshToken),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ip_address: null, // Set from request in controller
      user_agent: null, // Set from request in controller
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Hash refresh token for storage
   */
  private hashRefreshToken(token: string): string {
    return bcrypt.hashSync(token, 10);
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) return;

    const userAny = user as any;
    const failedAttempts = (userAny.failed_login_attempts || 0) + 1;
    const maxAttempts = 5;

    if (failedAttempts >= maxAttempts) {
      // Lock account for 30 minutes
      const lockoutMinutes = 30;
      const lockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);

      await this.db.update(
        'users',
        { id: userId },
        {
          failed_login_attempts: failedAttempts,
          locked_until: lockedUntil,
        }
      );

      this.logger.warn(`User ${userId} account locked due to failed login attempts`);
    } else {
      await this.db.update(
        'users',
        { id: userId },
        {
          failed_login_attempts: failedAttempts,
        }
      );
    }
  }

  /**
   * Reset failed login attempts
   */
  private async resetFailedAttempts(userId: string): Promise<void> {
    await this.db.update(
      'users',
      { id: userId },
      {
        failed_login_attempts: 0,
        locked_until: null,
      }
    );
  }

  /**
   * Verify 2FA code
   */
  private async verify2FA(userId: string, code: string): Promise<boolean> {
    // TODO: Implement TOTP verification
    // This is a placeholder - implement with authenticator library (e.g., speakeasy)
    return true;
  }
}
