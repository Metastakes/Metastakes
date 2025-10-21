/**
 * Authentication Controller
 * Handles login, register, token refresh, logout
 */

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { PatientsService } from '../patients/patients.service';
import { ProvidersService } from '../providers/providers.service';
import {
  LoginInput,
  RegisterPatientInput,
  RegisterProviderInput,
  loginSchema,
  registerPatientSchema,
  registerProviderSchema,
} from '@neurobridge/shared';
import { Request } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly patientsService: PatientsService,
    private readonly providersService: ProvidersService
  ) {}

  /**
   * Login with email and password
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: LoginInput) {
    // Validate input
    const validated = loginSchema.parse(body);

    // Authenticate
    const tokens = await this.authService.login(
      validated.email,
      validated.password,
      validated.twoFactorCode
    );

    return {
      message: 'Login successful',
      ...tokens,
    };
  }

  /**
   * Register new patient
   */
  @Post('register/patient')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new patient account' })
  @ApiResponse({ status: 201, description: 'Patient registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async registerPatient(@Body() body: RegisterPatientInput) {
    // Validate input
    const validated = registerPatientSchema.parse(body);

    // Register user
    const user = await this.authService.register(
      validated.email,
      validated.password,
      'patient' as any
    );

    // Create patient profile
    const patient = await this.patientsService.create(user.id, {
      firstName: validated.firstName,
      lastName: validated.lastName,
      dateOfBirth: new Date(validated.dateOfBirth),
      phone: validated.phone,
      address: validated.address,
    });

    // Generate tokens for auto-login
    const tokens = await this.authService.login(validated.email, validated.password);

    return {
      message: 'Patient registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      patient: {
        id: patient.id,
      },
      ...tokens,
    };
  }

  /**
   * Register new provider (admin only)
   */
  @Post('register/provider')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new provider account (admin only)' })
  @ApiResponse({ status: 201, description: 'Provider registered successfully' })
  @ApiResponse({ status: 409, description: 'Email or NPI already exists' })
  async registerProvider(@Body() body: RegisterProviderInput) {
    // Validate input
    const validated = registerProviderSchema.parse(body);

    // Register user
    const user = await this.authService.register(
      validated.email,
      validated.password,
      'provider' as any
    );

    // Create provider profile
    const provider = await this.providersService.create(user.id, {
      firstName: validated.firstName,
      lastName: validated.lastName,
      credential: validated.credential,
      licenseNumber: validated.licenseNumber,
      licenseState: validated.licenseState,
      npi: validated.npi,
      deaNumber: validated.deaNumber,
      specialty: validated.specialty,
    });

    return {
      message: 'Provider registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      provider: {
        id: provider.id,
        npi: provider.npi,
      },
    };
  }

  /**
   * Refresh access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    const tokens = await this.authService.refreshToken(body.refreshToken);

    return {
      message: 'Token refreshed successfully',
      ...tokens,
    };
  }

  /**
   * Logout (invalidate current session)
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from current session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@CurrentUser() user: any, @Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    await this.authService.logout(user.sub, body.refreshToken);

    return {
      message: 'Logged out successfully',
    };
  }

  /**
   * Logout from all devices
   */
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'Logged out from all devices' })
  async logoutAll(@CurrentUser() user: any) {
    await this.authService.logoutAll(user.sub);

    return {
      message: 'Logged out from all devices',
    };
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user retrieved' })
  async getCurrentUser(@CurrentUser() user: any) {
    // User is already validated by JwtAuthGuard
    return {
      id: user.sub,
      email: user.email,
      role: user.role,
    };
  }
}
