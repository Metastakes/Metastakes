/**
 * NeuroBridge AI - TypeScript Type Definitions
 * Mirrors database schema for type safety across frontend and API contracts
 * Version: 1.0.0
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum UserRole {
  PATIENT = 'patient',
  PROVIDER = 'provider',
  MENTOR = 'mentor',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum LanguagePreference {
  EN = 'en',
  ES = 'es',
}

export enum EncounterStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum EncounterType {
  INITIAL_EVAL = 'initial_eval',
  FOLLOW_UP = 'follow_up',
  MED_MANAGEMENT = 'med_management',
  GLP1_CONSULT = 'glp1_consult',
  CRISIS = 'crisis',
}

export enum NoteStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  AMENDED = 'amended',
  FINAL = 'final',
}

export enum ConsentType {
  TELEHEALTH = 'telehealth',
  NPP = 'npp',
  ROI = 'roi',
  RECORDING = 'recording',
  FINANCIAL = 'financial',
  LATE_CANCEL = 'late_cancel',
}

export enum ConsentStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  DECLINED = 'declined',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
}

export enum ClaimStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  PAID = 'paid',
  DENIED = 'denied',
  APPEALED = 'appealed',
}

export enum MedicationStatus {
  ACTIVE = 'active',
  DISCONTINUED = 'discontinued',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
}

export enum DiagnosisStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  RULE_OUT = 'rule_out',
  HISTORY_OF = 'history_of',
}

export enum GLP1Agent {
  SEMAGLUTIDE = 'semaglutide',
  LIRAGLUTIDE = 'liraglutide',
  TIRZEPATIDE = 'tirzepatide',
  DULAGLUTIDE = 'dulaglutide',
}

export enum GLP1Status {
  BASELINE = 'baseline',
  TITRATION = 'titration',
  MAINTENANCE = 'maintenance',
  DISCONTINUED = 'discontinued',
  COMPLETED = 'completed',
}

export enum RiskLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
}

export enum MDMLevel {
  STRAIGHTFORWARD = 'straightforward',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
}

export enum CPTCode {
  CPT_99212 = '99212',
  CPT_99213 = '99213',
  CPT_99214 = '99214',
  CPT_99215 = '99215',
  G2211 = 'G2211', // Complexity add-on
}

// ============================================================================
// BASE TYPES
// ============================================================================

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface User extends BaseEntity {
  email: string;
  password_hash?: string; // Never sent to client
  role: UserRole;
  status: UserStatus;
  last_login_at: string | null;
  password_changed_at: string;
  mfa_enabled: boolean;
  mfa_secret?: string; // Never sent to client
}

// ============================================================================
// PATIENT TYPES
// ============================================================================

export interface Patient extends BaseEntity {
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string; // ISO date string
  phone: string | null;
  language_preference: LanguagePreference;
  timezone: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  gamification_points: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_checkin_date: string | null; // ISO date string
  insurance_primary_payer: string | null;
  insurance_member_id: string | null;
  insurance_group_number: string | null;
}

export interface ClinicalProfile extends BaseEntity {
  patient_id: string;
  chief_complaint: string | null;
  psychiatric_history: string | null;
  substance_use_history: string | null;
  medical_history: string | null;
  surgical_history: string | null;
  family_psychiatric_history: string | null;
  allergies: string | null;
  current_medications: string | null;
  previous_medications: string | null;
  hospitalization_history: string | null;
  suicide_risk_level: RiskLevel | null;
  homicide_risk_level: RiskLevel | null;
  trauma_history: string | null;
  social_history: string | null;
  smoking_status: string | null;
  alcohol_use: string | null;
  caffeine_use: string | null;
  exercise_frequency: string | null;
  sleep_quality: string | null;
  support_system: string | null;
  employment_status: string | null;
  living_situation: string | null;
}

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export interface Provider extends BaseEntity {
  user_id: string;
  first_name: string;
  last_name: string;
  credentials: string | null;
  npi: string;
  dea_number: string | null;
  dea_expiration_date: string | null;
  state_license_number: string | null;
  state_license_state: string | null;
  state_license_expiration: string | null;
  caqh_id: string | null;
  specialty: string;
  phone: string | null;
  timezone: string;
  is_mentor: boolean;
  mentor_capacity: number;
  requires_supervision: boolean;
  supervisor_id: string | null;
  gamification_points: number;
  safety_score: number;
  empathy_score: number;
  documentation_score: number;
}

// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface Admin extends BaseEntity {
  user_id: string;
  first_name: string;
  last_name: string;
  role_title: string | null;
  permissions: Record<string, any> | null; // JSONB
}

// ============================================================================
// CLINICAL TYPES
// ============================================================================

export interface Diagnosis extends BaseEntity {
  patient_id: string;
  icd10_code: string;
  description: string;
  status: DiagnosisStatus;
  diagnosed_by: string; // provider_id
  diagnosed_at: string;
  resolved_at: string | null;
  is_primary: boolean;
  notes: string | null;
}

export interface Medication extends BaseEntity {
  patient_id: string;
  medication_name: string;
  generic_name: string | null;
  dosage: string;
  frequency: string;
  route: string;
  quantity: number | null;
  refills: number;
  is_controlled_substance: boolean;
  dea_schedule: string | null;
  status: MedicationStatus;
  prescribed_by: string; // provider_id
  prescribed_at: string;
  discontinued_at: string | null;
  discontinuation_reason: string | null;
  pharmacy_name: string | null;
  pharmacy_phone: string | null;
  pharmacy_address: string | null;
  last_filled_date: string | null;
  notes: string | null;
}

// ============================================================================
// ENCOUNTER TYPES
// ============================================================================

export interface Encounter extends BaseEntity {
  patient_id: string;
  provider_id: string;
  supervisor_id: string | null;
  encounter_type: EncounterType;
  status: EncounterStatus;
  scheduled_start: string; // ISO datetime
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  duration_minutes: number | null;
  google_meet_link: string | null;
  google_calendar_event_id: string | null;
  chief_complaint: string | null;
  is_no_show: boolean;
  late_cancel: boolean;
  cancellation_reason: string | null;
}

export interface SOAPNote extends BaseEntity {
  encounter_id: string;
  patient_id: string;
  provider_id: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  status: NoteStatus;
  cpt_codes: string[];
  icd10_codes: string[];
  time_spent_minutes: number | null;
  mdm_level: MDMLevel | null;
  billing_code: CPTCode | null;
  modifiers: string[];
  reviewed_by: string | null; // mentor provider_id
  reviewed_at: string | null;
  review_feedback: string | null;
  amended_by: string | null;
  amendment_reason: string | null;
  finalized_at: string | null;
}

// ============================================================================
// AI & TRANSCRIPT TYPES
// ============================================================================

export interface AIAnalysis {
  safety_score: number; // 0-100
  empathy_score: number; // 0-100
  documentation_quality_score: number; // 0-100
  red_flags: string[];
  suggestions: string[];
  medication_concerns: string[];
  documentation_hints: string[];
}

export interface MentorCorrections {
  corrected_safety_score?: number;
  corrected_empathy_score?: number;
  added_red_flags?: string[];
  removed_red_flags?: string[];
  corrected_suggestions?: string[];
  notes?: string;
}

export interface Transcript {
  id: string;
  encounter_id: string;
  patient_id: string;
  provider_id: string;
  transcript_text: string;
  ai_analysis: AIAnalysis | null;
  safety_score: number | null;
  empathy_score: number | null;
  documentation_quality_score: number | null;
  red_flags: Record<string, any> | null; // JSONB
  suggestions: Record<string, any> | null; // JSONB
  mentor_labeled: boolean;
  mentor_corrections: MentorCorrections | null;
  used_for_training: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// GLP-1 TYPES
// ============================================================================

export interface GLP1Program extends BaseEntity {
  patient_id: string;
  provider_id: string;
  agent: GLP1Agent;
  status: GLP1Status;
  start_date: string; // ISO date
  end_date: string | null;
  baseline_weight: number | null;
  baseline_bmi: number | null;
  baseline_a1c: number | null;
  target_weight: number | null;
  current_dose: string | null;
  titration_schedule: Record<string, any> | null; // JSONB
  contraindications_checked: boolean;
  thyroid_history: string | null;
  pancreatitis_history: boolean;
  gallbladder_issues: boolean;
  renal_function_baseline: string | null;
  weekly_check_ins: number;
  total_weight_lost: number;
  adherence_percentage: number;
  side_effects_reported: string | null;
}

export interface GLP1Progress {
  id: string;
  program_id: string;
  patient_id: string;
  check_in_date: string; // ISO date
  weight: number | null;
  bmi: number | null;
  side_effects: string | null;
  adherence_rating: number | null; // 1-10
  mood_rating: number | null; // 1-10
  energy_rating: number | null; // 1-10
  notes: string | null;
  dose_adjustment: string | null;
  provider_reviewed: boolean;
  created_at: string;
}

// ============================================================================
// CONSENT TYPES
// ============================================================================

export interface Consent {
  id: string;
  patient_id: string;
  consent_type: ConsentType;
  status: ConsentStatus;
  version_number: string;
  consent_text: string;
  signed_at: string | null;
  signature_data: string | null;
  ip_address: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PDMP TYPES
// ============================================================================

export interface PDMPCheck {
  id: string;
  patient_id: string;
  provider_id: string;
  checked_at: string;
  state: string;
  report_data: Record<string, any> | null; // JSONB
  red_flags: Record<string, any> | null;
  requires_review: boolean;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface Payment extends BaseEntity {
  patient_id: string;
  encounter_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  status: PaymentStatus;
  payment_method: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  refund_amount_cents: number | null;
  failure_reason: string | null;
  metadata: Record<string, any> | null;
}

export interface InsuranceClaim extends BaseEntity {
  patient_id: string;
  encounter_id: string;
  provider_id: string;
  payer_name: string | null;
  payer_id: string | null;
  claim_number: string | null;
  status: ClaimStatus;
  date_of_service: string; // ISO date
  cpt_codes: string[];
  icd10_codes: string[];
  billed_amount_cents: number;
  allowed_amount_cents: number | null;
  paid_amount_cents: number | null;
  patient_responsibility_cents: number | null;
  submitted_at: string | null;
  paid_at: string | null;
  denial_reason: string | null;
  clearinghouse: string | null;
  edi_837_data: Record<string, any> | null;
  edi_835_data: Record<string, any> | null;
}

export interface ProviderPayout extends BaseEntity {
  provider_id: string;
  payout_period_start: string; // ISO date
  payout_period_end: string;
  total_encounters: number;
  total_amount_cents: number;
  stripe_payout_id: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  notes: string | null;
}

// ============================================================================
// GAMIFICATION TYPES
// ============================================================================

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  icon_url: string | null;
  points_value: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface Streak {
  id: string;
  patient_id: string;
  streak_date: string; // ISO date
  activity_type: string;
  points_earned: number;
  created_at: string;
}

// ============================================================================
// AUDIT & COMPLIANCE TYPES
// ============================================================================

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_role: UserRole | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
  session_id: string | null;
}

export interface RetentionPolicy extends BaseEntity {
  patient_id: string;
  date_of_birth: string;
  is_minor_at_creation: boolean;
  retention_until: string; // ISO date
  last_encounter_date: string | null;
  scheduled_deletion_date: string | null;
  deletion_executed_at: string | null;
  notes: string | null;
}

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  message_text: string;
  is_read: boolean;
  read_at: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  is_encrypted: boolean;
  created_at: string;
}

// ============================================================================
// SYSTEM TYPES
// ============================================================================

export interface SystemSetting extends BaseEntity {
  setting_key: string;
  setting_value: Record<string, any>;
  description: string | null;
  updated_by: string | null; // admin_id
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    version?: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_prev: boolean;
}

// ============================================================================
// FORM INPUT TYPES
// ============================================================================

export interface LoginInput {
  email: string;
  password: string;
  mfa_code?: string;
}

export interface PatientCheckInInput {
  phq9_score?: number;
  gad7_score?: number;
  mood_rating?: number; // 1-10
  energy_rating?: number; // 1-10
  sleep_quality?: string;
  medication_adherence?: boolean;
  side_effects?: string;
  notes?: string;
}

export interface MedicationPrescribeInput {
  patient_id: string;
  medication_name: string;
  generic_name?: string;
  dosage: string;
  frequency: string;
  route?: string;
  quantity?: number;
  refills?: number;
  is_controlled_substance: boolean;
  dea_schedule?: string;
  pharmacy_name?: string;
  pharmacy_phone?: string;
  notes?: string;
}

export interface SOAPNoteInput {
  encounter_id: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  cpt_codes: string[];
  icd10_codes: string[];
  time_spent_minutes?: number;
  mdm_level?: MDMLevel;
}

export interface EncounterBookingInput {
  patient_id: string;
  provider_id: string;
  encounter_type: EncounterType;
  scheduled_start: string; // ISO datetime
  scheduled_end: string;
  chief_complaint?: string;
}

export interface GLP1ProgressInput {
  program_id: string;
  weight: number;
  side_effects?: string;
  adherence_rating: number; // 1-10
  mood_rating?: number;
  energy_rating?: number;
  notes?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================================================
// DASHBOARD WIDGET TYPES
// ============================================================================

export interface PatientDashboard {
  user: User;
  patient: Patient;
  upcoming_encounters: Encounter[];
  recent_check_ins: Streak[];
  current_streak_days: number;
  total_points: number;
  recent_badges: (UserBadge & { badge: Badge })[];
  active_glp1_program: GLP1Program | null;
  unread_messages_count: number;
}

export interface ProviderDashboard {
  user: User;
  provider: Provider;
  todays_encounters: (Encounter & { patient: Patient })[];
  pending_notes: SOAPNote[];
  pending_reviews: Encounter[];
  performance_stats: {
    safety_score: number;
    empathy_score: number;
    documentation_score: number;
    total_encounters_this_month: number;
  };
  recent_feedback: Transcript[];
}

export interface MentorDashboard {
  user: User;
  provider: Provider;
  supervisees: Provider[];
  pending_reviews: (Encounter & {
    provider: Provider;
    patient: Patient;
    transcript: Transcript | null;
  })[];
  recent_corrections: Transcript[];
  supervisee_stats: Array<{
    provider_id: string;
    provider_name: string;
    avg_safety_score: number;
    avg_empathy_score: number;
    total_encounters: number;
    pending_reviews: number;
  }>;
}

export interface AdminDashboard {
  total_patients: number;
  total_providers: number;
  total_encounters_this_month: number;
  revenue_this_month_cents: number;
  pending_claims: number;
  system_health: {
    database_status: 'healthy' | 'degraded' | 'down';
    api_latency_p95: number;
    error_rate: number;
  };
  recent_audit_logs: AuditLog[];
  retention_alerts: RetentionPolicy[];
}

// ============================================================================
// VALIDATION SCHEMAS (for use with Zod on frontend)
// ============================================================================

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\+?1?\d{10,14}$/;
export const NPI_REGEX = /^\d{10}$/;
export const DEA_REGEX = /^[A-Z]{2}\d{7}$/;
export const ZIP_CODE_REGEX = /^\d{5}(-\d{4})?$/;

// ============================================================================
// WEBSOCKET EVENT TYPES
// ============================================================================

export enum WebSocketEventType {
  // Transcript events
  TRANSCRIPT_CHUNK = 'transcript_chunk',
  TRANSCRIPT_COMPLETE = 'transcript_complete',

  // AI events
  AI_SUGGESTION = 'ai_suggestion',
  AI_ALERT = 'ai_alert',

  // Chat events
  NEW_MESSAGE = 'new_message',
  MESSAGE_READ = 'message_read',

  // Notification events
  BADGE_EARNED = 'badge_earned',
  ENCOUNTER_REMINDER = 'encounter_reminder',

  // System events
  SESSION_EXPIRED = 'session_expired',
  CONNECTION_STATUS = 'connection_status',
}

export interface WebSocketMessage<T = any> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
  user_id?: string;
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export type {
  BaseEntity,
  User,
  Patient,
  Provider,
  Admin,
  ClinicalProfile,
  Diagnosis,
  Medication,
  Encounter,
  SOAPNote,
  Transcript,
  GLP1Program,
  GLP1Progress,
  Consent,
  PDMPCheck,
  Payment,
  InsuranceClaim,
  ProviderPayout,
  Badge,
  UserBadge,
  Streak,
  AuditLog,
  RetentionPolicy,
  Message,
  SystemSetting,
};
