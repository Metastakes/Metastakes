/**
 * @neurobridge/shared
 * Shared types, validations, and utilities for NeuroBridge platform
 */

// Export all types
export * from './types';

// Export all validation schemas
export * from './validations';

// Constants
export const CONSTANTS = {
  // Retention policies (HIPAA compliance)
  RETENTION_YEARS: 7,
  RETENTION_MINOR_AGE: 25,

  // Visit time limits (for CPT coding)
  MIN_VISIT_MINUTES: 10,
  MAX_VISIT_MINUTES: 120,
  THERAPY_TIME_THRESHOLD: 10, // Recommend therapy referral if > 10 min psychotherapy

  // Gamification
  POINTS_PER_VISIT: 50,
  POINTS_PER_CHECKIN: 25,
  POINTS_PER_STREAK_DAY: 10,
  STREAK_BREAK_DAYS: 2,

  // GLP-1 Program
  GLP1_MIN_BMI: 27, // With comorbidities
  GLP1_MIN_BMI_NO_COMORBID: 30,
  GLP1_WEEKLY_CHECKIN_REQUIRED: true,

  // Security
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,

  // File uploads
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_FILE_TYPES: ['pdf', 'png', 'jpg', 'jpeg'],

  // Locales
  DEFAULT_LOCALE: 'en',
  SUPPORTED_LOCALES: ['en', 'es'],
} as const;

// CPT Code reference
export const CPT_CODES = {
  // Office/Outpatient E/M (established patient)
  '99212': {
    description: 'Office visit, straightforward MDM, 10-19 min',
    minTime: 10,
    maxTime: 19,
    mdmLevel: 'straightforward',
  },
  '99213': {
    description: 'Office visit, low complexity MDM, 20-29 min',
    minTime: 20,
    maxTime: 29,
    mdmLevel: 'low',
  },
  '99214': {
    description: 'Office visit, moderate complexity MDM, 30-39 min',
    minTime: 30,
    maxTime: 39,
    mdmLevel: 'moderate',
  },
  '99215': {
    description: 'Office visit, high complexity MDM, 40-54 min',
    minTime: 40,
    maxTime: 54,
    mdmLevel: 'high',
  },
  'G2211': {
    description: 'Visit complexity add-on for continuity care',
    minTime: 0,
    maxTime: 0,
    mdmLevel: null,
  },
} as const;

// Common diagnoses (ICD-10 codes)
export const ICD10_CODES = {
  // Depression
  F33_0: 'Major depressive disorder, recurrent, mild',
  F33_1: 'Major depressive disorder, recurrent, moderate',
  F33_2: 'Major depressive disorder, recurrent, severe without psychotic features',

  // Anxiety
  F41_1: 'Generalized anxiety disorder',
  F41_0: 'Panic disorder',

  // ADHD
  F90_0: 'ADHD, predominantly inattentive',
  F90_1: 'ADHD, predominantly hyperactive',
  F90_2: 'ADHD, combined type',

  // Bipolar
  F31_81: 'Bipolar disorder, current episode depressed, mild',
  F31_9: 'Bipolar disorder, unspecified',

  // Sleep
  G47_00: 'Insomnia, unspecified',

  // Obesity (for GLP-1)
  E66_01: 'Morbid obesity due to excess calories',
  E66_9: 'Obesity, unspecified',
  E11_9: 'Type 2 diabetes mellitus without complications',
} as const;

// Utility functions
export const utils = {
  /**
   * Calculate BMI
   */
  calculateBMI(weightKg: number, heightCm: number): number {
    const heightM = heightCm / 100;
    return Number((weightKg / (heightM * heightM)).toFixed(2));
  },

  /**
   * Calculate age from date of birth
   */
  calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return age;
  },

  /**
   * Calculate retention expiration date
   */
  calculateRetentionDate(isMinor: boolean, minorUntilDate?: Date): Date {
    if (isMinor && minorUntilDate) {
      const years = CONSTANTS.RETENTION_YEARS;
      const retentionDate = new Date(minorUntilDate);
      retentionDate.setFullYear(retentionDate.getFullYear() + years);
      return retentionDate;
    }

    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() + CONSTANTS.RETENTION_YEARS);
    return retentionDate;
  },

  /**
   * Format phone number to E.164
   */
  formatPhoneE164(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }

    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }

    return phone;
  },

  /**
   * Mask sensitive data (for logging)
   */
  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars) {
      return '***';
    }

    const visible = data.slice(-visibleChars);
    const masked = '*'.repeat(data.length - visibleChars);
    return `${masked}${visible}`;
  },

  /**
   * Generate secure random string
   */
  generateSecureToken(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      result += charset[randomValues[i] % charset.length];
    }

    return result;
  },

  /**
   * Determine if PDMP check is required
   */
  isPDMPRequired(schedule: string): boolean {
    return [
      'schedule_ii',
      'schedule_iii',
      'schedule_iv',
      'schedule_v',
    ].includes(schedule);
  },

  /**
   * Recommend CPT code based on time and complexity
   */
  recommendCPTCode(timeMinutes: number, mdmLevel: string): string | null {
    if (timeMinutes >= 40) return '99215';
    if (timeMinutes >= 30) return '99214';
    if (timeMinutes >= 20) return '99213';
    if (timeMinutes >= 10) return '99212';
    return null;
  },
};
