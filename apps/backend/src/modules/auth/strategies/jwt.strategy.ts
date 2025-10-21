/**
 * JWT Strategy
 * Validates JWT tokens and extracts user payload
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JWTPayload } from '@neurobridge/shared';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Validate JWT payload
   * This is called automatically by Passport after JWT signature is verified
   */
  async validate(payload: JWTPayload) {
    // Additional validation (check if user still exists and is active)
    const user = await this.authService.validateUser(payload);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    // Return user data to be attached to request object
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
