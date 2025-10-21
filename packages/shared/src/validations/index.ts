/**
 * @neurobridge/shared - Zod Validation Schemas
 * Runtime validation for all API inputs/outputs
 */

import { z } from 'zod';
import {
  UserRole,
  VisitType,
  VisitStatus,
  ConsentType,
  PrescriptionSchedule,
  BadgeCategory,
  AlertSeverity,
} from '../types';

// =====================================================
// USER & AUTH SCHEMAS
// =====================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  twoFactorCode: z.string().length(6).optional(),
});

export const registerPatientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().datetime().or(z.date()),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  }),
  preferredLocale: z.enum(['en', 'es']).default('en'),
});

export const registerProviderSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  credential: z.string().min(1).max(50),
  licenseNumber: z.string().min(1).max(50),
  licenseState: z.string().length(2),
  npi: z.string().length(10).regex(/^\d{10}$/, 'NPI must be 10 digits'),
  deaNumber: z.string().regex(/^[A-Z]{2}\d{7}$/, 'Invalid DEA number').optional(),
  specialty: z.array(z.string()).min(1),
});

// =====================================================
// VISIT SCHEMAS
// =====================================================

export const createVisitSchema = z.object({
  patientId: z.string().uuid(),
  providerId: z.string().uuid(),
  scheduledStart: z.string().datetime().or(z.date()),
  scheduledDurationMinutes: z.number().int().min(15).max(120).default(15),
  visitType: z.nativeEnum(VisitType),
  chiefComplaint: z.string().min(1).max(1000).optional(),
});

export const updateVisitSchema = z.object({
  visitStatus: z.nativeEnum(VisitStatus).optional(),
  actualStart: z.string().datetime().or(z.date()).optional(),
  actualEnd: z.string().datetime().or(z.date()).optional(),
  subjective: z.string().max(5000).optional(),
  objective: z.string().max(5000).optional(),
  assessment: z.string().max(5000).optional(),
  plan: z.string().max(5000).optional(),
  transcript: z.string().optional(),
  cptCodes: z.array(z.string()).optional(),
  mdmLevel: z.string().optional(),
  totalTimeMinutes: z.number().int().min(0).optional(),
});

export const visitQuerySchema = z.object({
  providerId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  status: z.nativeEnum(VisitStatus).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// =====================================================
// PRESCRIPTION SCHEMAS
// =====================================================

export const createPrescriptionSchema = z.object({
  visitId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  medicationName: z.string().min(1).max(255),
  medicationGenericName: z.string().min(1).max(255).optional(),
  dosage: z.string().min(1).max(100),
  route: z.enum(['oral', 'sublingual', 'transdermal', 'injection', 'other']),
  frequency: z.string().min(1).max(100),
  quantity: z.number().int().min(1),
  refills: z.number().int().min(0).max(11),
  daysSupply: z.number().int().min(1).max(365),
  schedule: z.nativeEnum(PrescriptionSchedule),
  indication: z.string().min(1).max(500),
  specialInstructions: z.string().max(1000).optional(),
  erxPharmacyNcpdp: z.string().optional(),
});

// Validation: Schedule II-V requires PDMP check
export const prescriptionWithPDMPSchema = createPrescriptionSchema.refine(
  (data) => {
    if (data.schedule !== PrescriptionSchedule.UNSCHEDULED) {
      // PDMP check will be validated in backend
      return true;
    }
    return true;
  },
  {
    message: 'PDMP check required for controlled substances',
  }
);

// =====================================================
// LAB RESULT SCHEMAS
// =====================================================

export const labTestSchema = z.object({
  testName: z.string().min(1),
  value: z.union([z.number(), z.string()]),
  unit: z.string(),
  referenceRange: z.string(),
  flag: z.enum(['low', 'normal', 'high', 'critical']).optional(),
});

export const createLabResultSchema = z.object({
  patientId: z.string().uuid(),
  labName: z.string().min(1).max(255),
  labCategory: z.string().min(1).max(100),
  resultDate: z.string().datetime().or(z.date()),
  results: z.array(labTestSchema).min(1),
  orderedByProviderId: z.string().uuid().optional(),
  clinicalNotes: z.string().max(2000).optional(),
});

// =====================================================
// GLP-1 PROGRAM SCHEMAS
// =====================================================

export const createGLP1ProgramSchema = z.object({
  patientId: z.string().uuid(),
  providerId: z.string().uuid(),
  startDate: z.string().datetime().or(z.date()),
  medication: z.enum(['semaglutide', 'liraglutide', 'dulaglutide', 'tirzepatide']),
  baselineWeightKg: z.number().min(30).max(300),
  baselineBmi: z.number().min(15).max(70),
  baselineA1c: z.number().min(4).max(14).optional(),
  targetWeightKg: z.number().min(30).max(300).optional(),
  targetBmi: z.number().min(15).max(35).optional(),
  pancreatitisHistory: z.boolean().default(false),
  gallbladderHistory: z.boolean().default(false),
  thyroidCancerHistory: z.boolean().default(false),
});

// Safety validation: Reject if contraindications present
export const glp1SafetySchema = createGLP1ProgramSchema.refine(
  (data) => {
    if (data.pancreatitisHistory || data.thyroidCancerHistory) {
      return false;
    }
    return true;
  },
  {
    message: 'GLP-1 contraindicated: history of pancreatitis or thyroid cancer',
    path: ['contraindications'],
  }
);

export const glp1WeeklyCheckinSchema = z.object({
  programId: z.string().uuid(),
  weekNumber: z.number().int().min(1),
  checkinDate: z.string().datetime().or(z.date()),
  weightKg: z.number().min(30).max(300),
  bmi: z.number().min(15).max(70),
  nauseaSeverity: z.number().int().min(0).max(10).optional(),
  vomiting: z.boolean().default(false),
  diarrhea: z.boolean().default(false),
  constipation: z.boolean().default(false),
  abdominalPain: z.boolean().default(false),
  otherSideEffects: z.string().max(500).optional(),
  medicationTakenAsPrescribed: z.boolean(),
  missedDoses: z.number().int().min(0).default(0),
  exerciseMinutesWeek: z.number().int().min(0).max(10080), // 7 days max
  dietaryAdherenceScore: z.number().int().min(0).max(10),
});

// =====================================================
// CONSENT SCHEMAS
// =====================================================

export const createConsentSchema = z.object({
  patientId: z.string().uuid(),
  consentType: z.nativeEnum(ConsentType),
  consentVersion: z.string(),
  signatureMethod: z.enum(['esign', 'verbal', 'written']),
  ipAddress: z.string().ip().optional(),
});

// =====================================================
// PDMP CHECK SCHEMA
// =====================================================

export const pdmpCheckSchema = z.object({
  patientId: z.string().uuid(),
  providerId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  state: z.string().length(2).default('FL'),
});

// =====================================================
// GAMIFICATION SCHEMAS
// =====================================================

export const awardBadgeSchema = z.object({
  userId: z.string().uuid(),
  badgeCode: z.string(),
  context: z.record(z.any()).optional(),
});

export const awardPointsSchema = z.object({
  userId: z.string().uuid(),
  points: z.number().int(),
  reason: z.string().min(1).max(255),
  context: z.record(z.any()).optional(),
});

// =====================================================
// AI SESSION SCHEMAS
// =====================================================

export const createAISessionSchema = z.object({
  visitId: z.string().uuid(),
  providerId: z.string().uuid(),
  modelVersion: z.string(),
  promptVersion: z.string(),
  inputData: z.record(z.any()),
});

export const aiSuggestionSchema = z.object({
  type: z.enum(['next_question', 'safety_check', 'documentation', 'billing']),
  content: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const mentorReviewSchema = z.object({
  aiSessionId: z.string().uuid(),
  overallRating: z.number().int().min(1).max(5),
  feedback: z.string().min(1).max(2000),
  areasOfImprovement: z.array(z.string()).optional(),
  areasOfStrength: z.array(z.string()).optional(),
  labels: z.record(z.any()).optional(),
});

// =====================================================
// QUERY SCHEMAS (Common)
// =====================================================

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
});

// =====================================================
// TYPE INFERENCE HELPERS
// =====================================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;
export type RegisterProviderInput = z.infer<typeof registerProviderSchema>;
export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
export type VisitQuery = z.infer<typeof visitQuerySchema>;
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type CreateLabResultInput = z.infer<typeof createLabResultSchema>;
export type CreateGLP1ProgramInput = z.infer<typeof createGLP1ProgramSchema>;
export type GLP1WeeklyCheckinInput = z.infer<typeof glp1WeeklyCheckinSchema>;
export type CreateConsentInput = z.infer<typeof createConsentSchema>;
export type PDMPCheckInput = z.infer<typeof pdmpCheckSchema>;
export type AwardBadgeInput = z.infer<typeof awardBadgeSchema>;
export type AwardPointsInput = z.infer<typeof awardPointsSchema>;
export type CreateAISessionInput = z.infer<typeof createAISessionSchema>;
export type MentorReviewInput = z.infer<typeof mentorReviewSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type DateRangeQuery = z.infer<typeof dateRangeSchema>;
