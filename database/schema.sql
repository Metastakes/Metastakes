-- ============================================================================
-- NeuroBridge AI - PostgreSQL Database Schema
-- HIPAA-Compliant Telepsychiatry Platform
-- Version: 1.0.0
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('patient', 'provider', 'mentor', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');
CREATE TYPE language_preference AS ENUM ('en', 'es');
CREATE TYPE encounter_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE encounter_type AS ENUM ('initial_eval', 'follow_up', 'med_management', 'glp1_consult', 'crisis');
CREATE TYPE note_status AS ENUM ('draft', 'pending_review', 'approved', 'amended', 'final');
CREATE TYPE consent_type AS ENUM ('telehealth', 'npp', 'roi', 'recording', 'financial', 'late_cancel');
CREATE TYPE consent_status AS ENUM ('pending', 'signed', 'declined', 'expired', 'revoked');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'disputed');
CREATE TYPE claim_status AS ENUM ('draft', 'submitted', 'accepted', 'rejected', 'paid', 'denied', 'appealed');
CREATE TYPE medication_status AS ENUM ('active', 'discontinued', 'on_hold', 'completed');
CREATE TYPE diagnosis_status AS ENUM ('active', 'resolved', 'rule_out', 'history_of');
CREATE TYPE glp1_agent AS ENUM ('semaglutide', 'liraglutide', 'tirzepatide', 'dulaglutide');
CREATE TYPE glp1_status AS ENUM ('baseline', 'titration', 'maintenance', 'discontinued', 'completed');

-- ============================================================================
-- CORE USER TABLES
-- ============================================================================

-- Users (Universal Authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    status user_status DEFAULT 'pending_verification',
    last_login_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1 NOT NULL -- Optimistic locking
);

-- Patients
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(20),
    language_preference language_preference DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    gamification_points INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    last_checkin_date DATE,
    insurance_primary_payer VARCHAR(100),
    insurance_member_id VARCHAR(100),
    insurance_group_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1 NOT NULL
);

-- Providers (PMHNPs)
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    credentials VARCHAR(50), -- e.g., PMHNP-BC, FNP-C
    npi VARCHAR(10) UNIQUE NOT NULL,
    dea_number VARCHAR(20),
    dea_expiration_date DATE,
    state_license_number VARCHAR(50),
    state_license_state VARCHAR(2),
    state_license_expiration DATE,
    caqh_id VARCHAR(20),
    specialty VARCHAR(100) DEFAULT 'Psychiatric Mental Health',
    phone VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    is_mentor BOOLEAN DEFAULT FALSE,
    mentor_capacity INTEGER DEFAULT 0, -- Max supervisees
    requires_supervision BOOLEAN DEFAULT TRUE,
    supervisor_id UUID REFERENCES providers(id), -- Self-referencing for mentorship
    gamification_points INTEGER DEFAULT 0,
    safety_score DECIMAL(5,2) DEFAULT 100.00,
    empathy_score DECIMAL(5,2) DEFAULT 0.00,
    documentation_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1 NOT NULL
);

-- Admin/Staff
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_title VARCHAR(100), -- e.g., "System Admin", "Clinical Director"
    permissions JSONB, -- Flexible permission structure
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1 NOT NULL
);

-- ============================================================================
-- CLINICAL PROFILE & HISTORY
-- ============================================================================

-- Clinical Profile (PHI)
CREATE TABLE clinical_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID UNIQUE NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    chief_complaint TEXT,
    psychiatric_history TEXT,
    substance_use_history TEXT,
    medical_history TEXT,
    surgical_history TEXT,
    family_psychiatric_history TEXT,
    allergies TEXT,
    current_medications TEXT,
    previous_medications TEXT,
    hospitalization_history TEXT,
    suicide_risk_level VARCHAR(20), -- low, moderate, high
    homicide_risk_level VARCHAR(20),
    trauma_history TEXT,
    social_history TEXT,
    smoking_status VARCHAR(50),
    alcohol_use VARCHAR(50),
    caffeine_use VARCHAR(50),
    exercise_frequency VARCHAR(50),
    sleep_quality VARCHAR(50),
    support_system TEXT,
    employment_status VARCHAR(50),
    living_situation VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1 NOT NULL
);

-- Diagnoses (ICD-10)
CREATE TABLE diagnoses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    icd10_code VARCHAR(10) NOT NULL,
    description TEXT NOT NULL,
    status diagnosis_status DEFAULT 'active',
    diagnosed_by UUID NOT NULL REFERENCES providers(id),
    diagnosed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    is_primary BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1 NOT NULL
);

-- Medications
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medication_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200),
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    route VARCHAR(50) DEFAULT 'PO',
    quantity INTEGER,
    refills INTEGER DEFAULT 0,
    is_controlled_substance BOOLEAN DEFAULT FALSE,
    dea_schedule VARCHAR(10),
    status medication_status DEFAULT 'active',
    prescribed_by UUID NOT NULL REFERENCES providers(id),
    prescribed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    discontinued_at TIMESTAMPTZ,
    discontinuation_reason TEXT,
    pharmacy_name VARCHAR(200),
    pharmacy_phone VARCHAR(20),
    pharmacy_address TEXT,
    last_filled_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1 NOT NULL
);

-- ============================================================================
-- ENCOUNTERS & DOCUMENTATION
-- ============================================================================

-- Encounters
CREATE TABLE encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id),
    supervisor_id UUID REFERENCES providers(id), -- Mentor if supervised
    encounter_type encounter_type NOT NULL,
    status encounter_status DEFAULT 'scheduled',
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    duration_minutes INTEGER, -- Calculated for billing
    google_meet_link VARCHAR(500),
    google_calendar_event_id VARCHAR(255),
    chief_complaint TEXT,
    is_no_show BOOLEAN DEFAULT FALSE,
    late_cancel BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1 NOT NULL
);

-- SOAP Notes
CREATE TABLE soap_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID UNIQUE NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    status note_status DEFAULT 'draft',
    cpt_codes VARCHAR(50)[], -- Array of CPT codes
    icd10_codes VARCHAR(10)[], -- Array of ICD-10 codes
    time_spent_minutes INTEGER,
    mdm_level VARCHAR(10), -- straightforward, low, moderate, high
    billing_code VARCHAR(10), -- 99212-99215
    modifiers VARCHAR(20)[], -- 95, 93, etc.
    reviewed_by UUID REFERENCES providers(id), -- Mentor review
    reviewed_at TIMESTAMPTZ,
    review_feedback TEXT,
    amended_by UUID REFERENCES providers(id),
    amendment_reason TEXT,
    finalized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1 NOT NULL
);

-- Transcripts (AI Training Data)
CREATE TABLE transcripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID UNIQUE NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    transcript_text TEXT NOT NULL,
    ai_analysis JSONB, -- Gemini output
    safety_score DECIMAL(5,2),
    empathy_score DECIMAL(5,2),
    documentation_quality_score DECIMAL(5,2),
    red_flags JSONB, -- Array of detected concerns
    suggestions JSONB, -- AI recommendations
    mentor_labeled BOOLEAN DEFAULT FALSE,
    mentor_corrections JSONB, -- Mentor overrides for AI training
    used_for_training BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- GLP-1 / METABOLIC HEALTH
-- ============================================================================

-- GLP-1 Programs
CREATE TABLE glp1_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id),
    agent glp1_agent NOT NULL,
    status glp1_status DEFAULT 'baseline',
    start_date DATE NOT NULL,
    end_date DATE,
    baseline_weight DECIMAL(5,2),
    baseline_bmi DECIMAL(4,2),
    baseline_a1c DECIMAL(4,2),
    target_weight DECIMAL(5,2),
    current_dose VARCHAR(50),
    titration_schedule JSONB, -- Structured dose progression
    contraindications_checked BOOLEAN DEFAULT FALSE,
    thyroid_history TEXT,
    pancreatitis_history BOOLEAN DEFAULT FALSE,
    gallbladder_issues BOOLEAN DEFAULT FALSE,
    renal_function_baseline VARCHAR(50),
    weekly_check_ins INTEGER DEFAULT 0,
    total_weight_lost DECIMAL(5,2) DEFAULT 0.00,
    adherence_percentage DECIMAL(5,2) DEFAULT 0.00,
    side_effects_reported TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1 NOT NULL
);

-- GLP-1 Progress Tracking
CREATE TABLE glp1_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES glp1_programs(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    check_in_date DATE NOT NULL,
    weight DECIMAL(5,2),
    bmi DECIMAL(4,2),
    side_effects TEXT,
    adherence_rating INTEGER, -- 1-10 scale
    mood_rating INTEGER, -- 1-10 scale
    energy_rating INTEGER, -- 1-10 scale
    notes TEXT,
    dose_adjustment VARCHAR(50),
    provider_reviewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CONSENT & COMPLIANCE
-- ============================================================================

-- Consents
CREATE TABLE consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consent_type consent_type NOT NULL,
    status consent_status DEFAULT 'pending',
    version_number VARCHAR(10) NOT NULL, -- Track consent form versions
    consent_text TEXT NOT NULL,
    signed_at TIMESTAMPTZ,
    signature_data TEXT, -- Base64 or reference
    ip_address INET,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- PDMP Checks (Prescription Drug Monitoring Program)
CREATE TABLE pdmp_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    checked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    state VARCHAR(2) NOT NULL,
    report_data JSONB, -- Store E-FORCSE data
    red_flags JSONB,
    requires_review BOOLEAN DEFAULT FALSE,
    reviewed_by UUID REFERENCES providers(id),
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PAYMENTS & BILLING
-- ============================================================================

-- Payments (Stripe)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    encounter_id UUID REFERENCES encounters(id),
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    amount_cents INTEGER NOT NULL,
    status payment_status DEFAULT 'pending',
    payment_method VARCHAR(50), -- card, ach, etc.
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    refund_amount_cents INTEGER,
    failure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insurance Claims (Future)
CREATE TABLE insurance_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    encounter_id UUID NOT NULL REFERENCES encounters(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    payer_name VARCHAR(200),
    payer_id VARCHAR(100),
    claim_number VARCHAR(100) UNIQUE,
    status claim_status DEFAULT 'draft',
    date_of_service DATE NOT NULL,
    cpt_codes VARCHAR(50)[] NOT NULL,
    icd10_codes VARCHAR(10)[] NOT NULL,
    billed_amount_cents INTEGER NOT NULL,
    allowed_amount_cents INTEGER,
    paid_amount_cents INTEGER,
    patient_responsibility_cents INTEGER,
    submitted_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    denial_reason TEXT,
    clearinghouse VARCHAR(100), -- Availity, Waystar, etc.
    edi_837_data JSONB,
    edi_835_data JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Provider Payouts
CREATE TABLE provider_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES providers(id),
    payout_period_start DATE NOT NULL,
    payout_period_end DATE NOT NULL,
    total_encounters INTEGER DEFAULT 0,
    total_amount_cents INTEGER NOT NULL,
    stripe_payout_id VARCHAR(255),
    status payment_status DEFAULT 'pending',
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- GAMIFICATION & ENGAGEMENT
-- ============================================================================

-- Badges
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- patient, provider, mentor
    icon_url VARCHAR(500),
    points_value INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User Badges (Join Table)
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id)
);

-- Streaks (Patient Engagement)
CREATE TABLE streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    streak_date DATE NOT NULL,
    activity_type VARCHAR(50), -- check_in, medication, glp1_log
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, streak_date, activity_type)
);

-- ============================================================================
-- AUDIT & COMPLIANCE
-- ============================================================================

-- Audit Log (Immutable)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_role user_role,
    action VARCHAR(100) NOT NULL, -- e.g., 'patient_viewed', 'note_amended', 'login'
    resource_type VARCHAR(100), -- e.g., 'soap_note', 'patient', 'medication'
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    session_id UUID
);

-- System Retention Policy Tracking
CREATE TABLE retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID UNIQUE NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    date_of_birth DATE NOT NULL,
    is_minor_at_creation BOOLEAN DEFAULT FALSE,
    retention_until DATE NOT NULL, -- 7 years from last contact OR age 25 if minor
    last_encounter_date DATE,
    scheduled_deletion_date DATE,
    deletion_executed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MESSAGING (In-App HIPAA Chat)
-- ============================================================================

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL, -- Group messages by conversation
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    attachment_url VARCHAR(500),
    attachment_type VARCHAR(50),
    is_encrypted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SYSTEM CONFIGURATION
-- ============================================================================

-- System Settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES admins(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Patients
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_last_name ON patients(last_name);
CREATE INDEX idx_patients_dob ON patients(date_of_birth);

-- Providers
CREATE INDEX idx_providers_user_id ON providers(user_id);
CREATE INDEX idx_providers_npi ON providers(npi);
CREATE INDEX idx_providers_supervisor_id ON providers(supervisor_id);

-- Encounters
CREATE INDEX idx_encounters_patient_id ON encounters(patient_id);
CREATE INDEX idx_encounters_provider_id ON encounters(provider_id);
CREATE INDEX idx_encounters_scheduled_start ON encounters(scheduled_start);
CREATE INDEX idx_encounters_status ON encounters(status);

-- SOAP Notes
CREATE INDEX idx_soap_notes_encounter_id ON soap_notes(encounter_id);
CREATE INDEX idx_soap_notes_provider_id ON soap_notes(provider_id);
CREATE INDEX idx_soap_notes_status ON soap_notes(status);

-- Medications
CREATE INDEX idx_medications_patient_id ON medications(patient_id);
CREATE INDEX idx_medications_status ON medications(status);
CREATE INDEX idx_medications_is_controlled ON medications(is_controlled_substance);

-- Diagnoses
CREATE INDEX idx_diagnoses_patient_id ON diagnoses(patient_id);
CREATE INDEX idx_diagnoses_status ON diagnoses(status);
CREATE INDEX idx_diagnoses_icd10_code ON diagnoses(icd10_code);

-- Transcripts
CREATE INDEX idx_transcripts_encounter_id ON transcripts(encounter_id);
CREATE INDEX idx_transcripts_provider_id ON transcripts(provider_id);
CREATE INDEX idx_transcripts_mentor_labeled ON transcripts(mentor_labeled);

-- Audit Logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Payments
CREATE INDEX idx_payments_patient_id ON payments(patient_id);
CREATE INDEX idx_payments_encounter_id ON payments(encounter_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Claims
CREATE INDEX idx_insurance_claims_patient_id ON insurance_claims(patient_id);
CREATE INDEX idx_insurance_claims_provider_id ON insurance_claims(provider_id);
CREATE INDEX idx_insurance_claims_status ON insurance_claims(status);
CREATE INDEX idx_insurance_claims_date_of_service ON insurance_claims(date_of_service);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all versioned tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clinical_profiles_updated_at BEFORE UPDATE ON clinical_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diagnoses_updated_at BEFORE UPDATE ON diagnoses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_encounters_updated_at BEFORE UPDATE ON encounters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_soap_notes_updated_at BEFORE UPDATE ON soap_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_glp1_programs_updated_at BEFORE UPDATE ON glp1_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) TEMPLATES
-- ============================================================================
-- Note: RLS policies should be configured based on application auth strategy
-- Example policies provided for reference:

-- Enable RLS
-- ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clinical_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE soap_notes ENABLE ROW LEVEL SECURITY;

-- Example policy: Patients can only view their own data
-- CREATE POLICY patients_view_own ON patients
--   FOR SELECT
--   USING (user_id = current_setting('app.current_user_id')::UUID);

-- Example policy: Providers can view their assigned patients
-- CREATE POLICY providers_view_patients ON patients
--   FOR SELECT
--   USING (id IN (
--     SELECT patient_id FROM encounters WHERE provider_id = current_setting('app.current_user_id')::UUID
--   ));

-- ============================================================================
-- SEED DATA (Initial Configuration)
-- ============================================================================

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('retention_default_years', '7', 'Default retention period for adult patient records'),
  ('retention_minor_age_limit', '25', 'Age until which minor records must be retained'),
  ('gamification_enabled', 'true', 'Enable/disable gamification features'),
  ('max_encounter_duration_minutes', '60', 'Maximum billable encounter duration'),
  ('pdmp_check_required_for_controlled', 'true', 'Require PDMP check before prescribing controlled substances'),
  ('ai_feedback_enabled', 'true', 'Enable Gemini AI feedback loop'),
  ('supported_languages', '["en", "es"]', 'Supported language codes');

-- Insert default badges
INSERT INTO badges (code, name, description, category, points_value) VALUES
  ('first_checkin', 'First Check-In', 'Completed your first daily check-in', 'patient', 10),
  ('week_streak', '7-Day Streak', 'Maintained a 7-day check-in streak', 'patient', 50),
  ('month_streak', '30-Day Streak', 'Maintained a 30-day check-in streak', 'patient', 200),
  ('medication_adherent', 'Medication Champion', '90% medication adherence for 30 days', 'patient', 100),
  ('glp1_starter', 'GLP-1 Journey Begins', 'Started GLP-1 program', 'patient', 25),
  ('glp1_milestone_10lb', '10-Pound Victory', 'Lost 10 pounds on GLP-1', 'patient', 150),
  ('safety_master', 'Safety Expert', 'Maintained 95%+ safety score for 50 encounters', 'provider', 500),
  ('empathy_leader', 'Empathy Leader', 'Achieved 90%+ empathy score for 25 encounters', 'provider', 300),
  ('documentation_pro', 'Documentation Pro', 'Perfect documentation score for 20 consecutive notes', 'provider', 400),
  ('lifestyle_integrator', 'Lifestyle Integrator', 'Successfully managed 10 GLP-1 patients', 'provider', 250),
  ('mentor_master', 'Master Mentor', 'Supervised 5 providers to independent practice', 'provider', 1000);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'Universal authentication table for all portal users';
COMMENT ON TABLE patients IS 'Patient demographic and contact information';
COMMENT ON TABLE providers IS 'PMHNP provider credentials and supervision status';
COMMENT ON TABLE clinical_profiles IS 'Comprehensive psychiatric and medical history (PHI)';
COMMENT ON TABLE encounters IS 'Scheduled and completed patient visits';
COMMENT ON TABLE soap_notes IS 'Clinical documentation with billing codes';
COMMENT ON TABLE transcripts IS 'Session transcripts with AI analysis for training';
COMMENT ON TABLE medications IS 'Active and historical medication orders';
COMMENT ON TABLE diagnoses IS 'ICD-10 diagnoses with status tracking';
COMMENT ON TABLE glp1_programs IS 'GLP-1 weight management program enrollment';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for HIPAA compliance';
COMMENT ON TABLE retention_policies IS 'Data retention tracking (7 years or age 25 for minors)';
COMMENT ON COLUMN soap_notes.mdm_level IS 'Medical Decision Making level for E/M coding';
COMMENT ON COLUMN providers.requires_supervision IS 'Whether provider needs mentor oversight';
COMMENT ON COLUMN transcripts.mentor_labeled IS 'Whether mentor has reviewed and corrected AI analysis';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
