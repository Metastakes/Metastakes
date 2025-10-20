/**
 * @neurobridge/shared - Shared TypeScript types
 * Used across all NeuroBridge applications
 */

// =====================================================
// ENUMS (matching database schema)
// =====================================================

export enum UserRole {
  PATIENT = 'patient',
  PROVIDER = 'provider',
  MENTOR = 'mentor',
  ADMIN = 'admin',
  OWNER = 'owner',
}

export enum VisitType {
  INITIAL_EVAL = 'initial_eval',
  FOLLOW_UP = 'follow_up',
  MED_MANAGEMENT = 'med_management',
  GLP1_VISIT = 'glp1_visit',
  CRISIS = 'crisis',
}

export enum VisitStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum ConsentType {
  TELEHEALTH = 'telehealth',
  NPP = 'npp',
  ROI = 'roi',
  RECORDING = 'recording',
  FINANCIAL = 'financial',
  LATE_CANCEL = 'late_cancel',
}

export enum PrescriptionSchedule {
  UNSCHEDULED = 'unscheduled',
  SCHEDULE_II = 'schedule_ii',
  SCHEDULE_III = 'schedule_iii',
  SCHEDULE_IV = 'schedule_iv',
  SCHEDULE_V = 'schedule_v',
}

export enum BadgeCategory {
  EMPATHY = 'empathy',
  SAFETY = 'safety',
  ADHERENCE = 'adherence',
  DOCUMENTATION = 'documentation',
  LIFESTYLE = 'lifestyle',
  EDUCATION = 'education',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

// =====================================================
// USER & AUTHENTICATION TYPES
// =====================================================

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  preferredLocale: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// =====================================================
// PATIENT TYPES
// =====================================================

export interface Patient {
  id: string;
  userId: string;

  // Demographics (decrypted in application layer)
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  phone: string;
  address: Address;

  // Clinical
  primaryDiagnosis: string[];
  comorbidities: string[];
  allergies: string[];
  currentMedications: Medication[];

  // Insurance
  insuranceProvider?: string;
  insuranceId?: string;
  insuranceGroup?: string;

  // Legal
  minorUntilDate?: Date;
  guardianId?: string;

  // Gamification
  totalPoints: number;
  currentStreakDays: number;
  longestStreakDays: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy?: string;
}

// =====================================================
// PROVIDER TYPES
// =====================================================

export interface Provider {
  id: string;
  userId: string;

  // Credentials
  firstName: string;
  lastName: string;
  credential: string; // PMHNP, MD, etc.
  licenseNumber: string;
  licenseState: string;
  npi: string;
  deaNumber?: string;

  // Practice
  specialty: string[];
  boardCertifications: string[];
  yearsExperience: number;

  // Supervision
  mentorId?: string;
  requiresSupervision: boolean;

  // Metrics
  empathyScore: number;
  safetyScore: number;
  totalVisitsCompleted: number;

  isAcceptingPatients: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// VISIT TYPES
// =====================================================

export interface Visit {
  id: string;

  // Participants
  patientId: string;
  providerId: string;
  supervisingMentorId?: string;

  // Scheduling
  scheduledStart: Date;
  scheduledDurationMinutes: number;
  actualStart?: Date;
  actualEnd?: Date;

  // Details
  visitType: VisitType;
  visitStatus: VisitStatus;
  chiefComplaint?: string;

  // Video
  googleMeetUrl?: string;
  googleCalendarEventId?: string;

  // Clinical Documentation (SOAP)
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;

  // Transcription & AI
  transcript?: string;
  aiSessionId?: string;
  aiAlerts?: AIAlert[];

  // Billing
  cptCodes?: string[];
  mdmLevel?: string;
  totalTimeMinutes?: number;
  g2211Applicable: boolean;

  // PDMP Compliance
  pdmpCheckedAt?: Date;
  pdmpResult?: PDMPResult;

  prescriptionsIssued?: string[];

  createdAt: Date;
  updatedAt: Date;
}

export interface AIAlert {
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  actionTaken?: string;
  dismissed: boolean;
}

export interface PDMPResult {
  prescriptionsFound: number;
  providersFound: number;
  pharmaciesFound: number;
  redFlags: string[];
  riskScore: number;
  rawData: any;
}

// =====================================================
// PRESCRIPTION TYPES
// =====================================================

export interface Prescription {
  id: string;
  visitId?: string;
  patientId: string;
  providerId: string;

  // Medication
  medicationName: string;
  medicationGenericName?: string;
  dosage: string;
  route: string;
  frequency: string;
  quantity: number;
  refills: number;
  daysSupply: number;

  schedule: PrescriptionSchedule;

  // Safety
  indication: string;
  contraindicationsChecked: boolean;
  interactionWarnings?: InteractionWarning[];

  // eRx
  erxSentAt?: Date;
  erxTransactionId?: string;
  erxStatus?: string;
  erxPharmacyNcpdp?: string;

  specialInstructions?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface InteractionWarning {
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  interactingWith: string;
}

// =====================================================
// LAB RESULTS TYPES
// =====================================================

export interface LabResult {
  id: string;
  patientId: string;

  labName: string;
  labCategory: string;
  resultDate: Date;

  results: LabTest[];

  orderedByProviderId?: string;
  reviewedByProviderId?: string;
  reviewedAt?: Date;
  clinicalNotes?: string;

  createdAt: Date;
}

export interface LabTest {
  testName: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  flag?: 'low' | 'normal' | 'high' | 'critical';
}

// =====================================================
// GLP-1 PROGRAM TYPES
// =====================================================

export interface GLP1Program {
  id: string;
  patientId: string;
  providerId: string;

  startDate: Date;
  endDate?: Date;
  medication: string;

  // Baseline
  baselineWeightKg: number;
  baselineBmi: number;
  baselineA1c?: number;
  baselineLipids?: LipidPanel;

  // Goals
  targetWeightKg?: number;
  targetBmi?: number;

  // Safety History
  pancreatitisHistory: boolean;
  gallbladderHistory: boolean;
  thyroidCancerHistory: boolean;

  isActive: boolean;
  discontinuationReason?: string;
  discontinuationDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface GLP1WeeklyCheckin {
  id: string;
  programId: string;
  patientId: string;

  weekNumber: number;
  checkinDate: Date;

  // Metrics
  weightKg: number;
  bmi: number;

  // Side Effects
  nauseaSeverity?: number; // 0-10
  vomiting: boolean;
  diarrhea: boolean;
  constipation: boolean;
  abdominalPain: boolean;
  otherSideEffects?: string;

  // Adherence
  medicationTakenAsPrescribed: boolean;
  missedDoses: number;

  // Lifestyle
  exerciseMinutesWeek: number;
  dietaryAdherenceScore: number; // 0-10

  // Gamification
  pointsEarned: number;
  badgesUnlocked: string[];

  createdAt: Date;
}

export interface LipidPanel {
  totalCholesterol: number;
  ldl: number;
  hdl: number;
  triglycerides: number;
}

// =====================================================
// CONSENT TYPES
// =====================================================

export interface Consent {
  id: string;
  patientId: string;
  consentType: ConsentType;

  // Version Control
  consentVersion: string;
  consentText: string;

  // Signature
  signedAt: Date;
  signatureMethod: 'esign' | 'verbal' | 'written';
  ipAddress?: string;

  // Status
  isActive: boolean;
  revokedAt?: Date;
  revocationReason?: string;

  expiresAt?: Date;

  createdAt: Date;
}

// =====================================================
// GAMIFICATION TYPES
// =====================================================

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  category: BadgeCategory;
  iconUrl?: string;
  pointsValue: number;
  criteria: Record<string, any>;

  // Localization
  nameEs?: string;
  descriptionEs?: string;

  createdAt: Date;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: Date;
  context?: Record<string, any>;

  // Joined data
  badge?: Badge;
}

export interface PointTransaction {
  id: string;
  userId: string;
  points: number;
  reason: string;
  context?: Record<string, any>;
  createdAt: Date;
}

// =====================================================
// AI SESSION TYPES
// =====================================================

export interface AISession {
  id: string;
  visitId: string;
  providerId: string;

  modelVersion: string;
  promptVersion: string;

  inputData: Record<string, any>;

  suggestions: AISuggestion[];
  safetyAlerts: AIAlert[];
  empathyScores: EmpathyScore[];
  nextQuestionHints: string[];

  // Mentor Feedback
  mentorReviewed: boolean;
  mentorReviewData?: MentorReview;
  mentorLabels?: Record<string, any>;

  createdAt: Date;
}

export interface AISuggestion {
  timestamp: Date;
  type: 'next_question' | 'safety_check' | 'documentation' | 'billing';
  content: string;
  confidence: number;
  accepted?: boolean;
}

export interface EmpathyScore {
  timestamp: Date;
  score: number; // 0-100
  reasoning?: string;
}

export interface MentorReview {
  mentorId: string;
  reviewedAt: Date;
  overallRating: number; // 1-5
  feedback: string;
  areasOfImprovement: string[];
  areasOfStrength: string[];
}

// =====================================================
// AUDIT LOG TYPES
// =====================================================

export interface AuditLog {
  id: string;
  userId?: string;
  userRole?: UserRole;

  action: string;
  resourceType: string;
  resourceId?: string;

  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;

  changes?: Record<string, any>;
  reason?: string;

  retentionExpiresAt: Date;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: {
    pagination?: Pagination;
    timestamp: Date;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string; // Only in development
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

// =====================================================
// REAL-TIME/WEBSOCKET TYPES
// =====================================================

export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: Date;
}

export interface VisitLiveUpdate {
  visitId: string;
  type: 'ai_alert' | 'transcript_update' | 'suggestion' | 'timer_update';
  data: any;
}

// =====================================================
// CPT CODE & BILLING TYPES
// =====================================================

export interface CPTRecommendation {
  code: string;
  description: string;
  timeRequirement: {
    min: number;
    max: number;
  };
  mdmLevel: 'straightforward' | 'low' | 'moderate' | 'high';
  confidence: number;
  reasoning: string[];
}

export interface BillingCalculation {
  cptCodes: string[];
  totalTimeMinutes: number;
  mdmLevel: string;
  g2211Applicable: boolean;
  estimatedReimbursement?: number;
  compliance: {
    pdmpRequired: boolean;
    pdmpCompleted: boolean;
    therapyTimeExceeded: boolean;
    therapyReferralSuggested: boolean;
  };
}
