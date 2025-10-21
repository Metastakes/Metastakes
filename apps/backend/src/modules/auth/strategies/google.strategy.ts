/**
 * Google OAuth2 Strategy
 * For Google Calendar/Meet integration
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'placeholder_client_id',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'placeholder_client_secret',
      callbackURL: configService.get<string>('GOOGLE_OAUTH_REDIRECT_URI') || 'http://localhost:3100/auth/google/callback',
      scope: (configService.get<string>('GOOGLE_OAUTH_SCOPES') || 'openid,email,profile,calendar.readonly,calendar.events').split(','),
    });
  }

  /**
   * Validate Google OAuth callback
   */
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback
  ): Promise<any> {
    const { emails, displayName } = profile;

    const user = {
      email: emails[0].value,
      name: displayName,
      googleAccessToken: accessToken,
      googleRefreshToken: refreshToken,
    };

    done(null, user);
  }
}
