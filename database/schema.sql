-- =====================================================
-- NeuroBridge Database Schema
-- HIPAA-Compliant PostgreSQL Database
-- =====================================================
-- Purpose: Support AI-enhanced telepsychiatry platform
-- Compliance: HIPAA, 7-year retention, minors to age 25
-- Encryption: All PHI encrypted at rest (application layer)
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE user_role AS ENUM ('patient', 'provider', 'mentor', 'admin', 'owner');
CREATE TYPE visit_type AS ENUM ('initial_eval', 'follow_up', 'med_management', 'glp1_visit', 'crisis');
CREATE TYPE visit_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE consent_type AS ENUM ('telehealth', 'npp', 'roi', 'recording', 'financial', 'late_cancel');
CREATE TYPE prescription_schedule AS ENUM ('unscheduled', 'schedule_ii', 'schedule_iii', 'schedule_iv', 'schedule_v');
CREATE TYPE badge_category AS ENUM ('empathy', 'safety', 'adherence', 'documentation', 'lifestyle', 'education');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    preferred_locale VARCHAR(5) DEFAULT 'en',
    last_login_at TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP -- Soft delete for retention
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- PATIENT PROFILES (PHI - Encrypted Fields)
-- =====================================================

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Demographics (encrypted)
    first_name_encrypted TEXT NOT NULL,
    last_name_encrypted TEXT NOT NULL,
    date_of_birth_encrypted TEXT NOT NULL,
    ssn_encrypted TEXT,
    phone_encrypted TEXT NOT NULL,
    address_encrypted JSONB, -- {street, city, state, zip}

    -- Clinical Info
    primary_diagnosis TEXT[],
    comorbidities TEXT[],
    allergies TEXT[],
    current_medications JSONB[],

    -- Insurance
    insurance_provider TEXT,
    insurance_id_encrypted TEXT,
    insurance_group_encrypted TEXT,

    -- Emergency Contact (encrypted)
    emergency_contact_encrypted JSONB,

    -- Consent & Legal
    minor_until_date DATE, -- NULL if adult, date if minor
    guardian_id UUID REFERENCES users(id),

    -- Gamification
    total_points INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    retention_expires_at TIMESTAMP, -- Calculated based on rules

    UNIQUE(user_id)
);

CREATE INDEX idx_patients_user_id ON patients(user_id);

-- =====================================================
-- PROVIDER PROFILES
-- =====================================================

CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Credentials
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    credential VARCHAR(50) NOT NULL, -- PMHNP, MD, etc.
    license_number VARCHAR(50) NOT NULL,
    license_state VARCHAR(2) NOT NULL,
    npi VARCHAR(10) NOT NULL UNIQUE,
    dea_number VARCHAR(20),

    -- Practice Info
    specialty TEXT[],
    board_certifications TEXT[],
    years_experience INTEGER,

    -- Supervising Mentor
    mentor_id UUID REFERENCES providers(id),
    requires_supervision BOOLEAN DEFAULT true,

    -- Gamification
    empathy_score DECIMAL(3,2) DEFAULT 0.0,
    safety_score DECIMAL(3,2) DEFAULT 0.0,
    total_visits_completed INTEGER DEFAULT 0,

    -- Availability
    is_accepting_patients BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id)
);

CREATE INDEX idx_providers_user_id ON providers(user_id);
CREATE INDEX idx_providers_mentor_id ON providers(mentor_id);
CREATE INDEX idx_providers_npi ON providers(npi);

-- =====================================================
-- VISITS (Clinical Encounters)
-- =====================================================

CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Participants
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    supervising_mentor_id UUID REFERENCES providers(id),

    -- Scheduling
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_duration_minutes INTEGER NOT NULL DEFAULT 15,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,

    -- Visit Details
    visit_type visit_type NOT NULL,
    visit_status visit_status DEFAULT 'scheduled',
    chief_complaint TEXT,

    -- Video Conference
    google_meet_url TEXT,
    google_calendar_event_id VARCHAR(255),

    -- Clinical Documentation
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,

    -- Transcription & AI
    transcript TEXT,
    ai_session_id UUID,
    ai_alerts JSONB[], -- [{severity, message, timestamp, action_taken}]

    -- Billing & Compliance
    cpt_codes VARCHAR(10)[],
    mdm_level VARCHAR(10), -- '99212', '99213', etc.
    total_time_minutes INTEGER,
    g2211_applicable BOOLEAN DEFAULT false,
    pdmp_checked_at TIMESTAMP,
    pdmp_result JSONB,

    -- Prescriptions issued during visit
    prescriptions_issued UUID[],

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_visits_provider_id ON visits(provider_id);
CREATE INDEX idx_visits_scheduled_start ON visits(scheduled_start);
CREATE INDEX idx_visits_status ON visits(visit_status);

-- =====================================================
-- PRESCRIPTIONS (DEA-compliant)
-- =====================================================

CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Clinical Context
    visit_id UUID REFERENCES visits(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES providers(id),

    -- Medication Details
    medication_name VARCHAR(255) NOT NULL,
    medication_generic_name VARCHAR(255),
    dosage VARCHAR(100) NOT NULL,
    route VARCHAR(50) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    refills INTEGER NOT NULL DEFAULT 0,
    days_supply INTEGER NOT NULL,

    -- DEA Scheduling
    schedule prescription_schedule NOT NULL DEFAULT 'unscheduled',

    -- Safety
    indication TEXT NOT NULL,
    contraindications_checked BOOLEAN DEFAULT false,
    interaction_warnings JSONB,

    -- eRx
    erx_sent_at TIMESTAMP,
    erx_transaction_id VARCHAR(255),
    erx_status VARCHAR(50), -- pending, sent, error
    erx_pharmacy_ncpdp VARCHAR(20),

    -- Prescriber Notes
    special_instructions TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_provider_id ON prescriptions(provider_id);
CREATE INDEX idx_prescriptions_visit_id ON prescriptions(visit_id);

-- =====================================================
-- LAB RESULTS
-- =====================================================

CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),

    -- Lab Details
    lab_name VARCHAR(255) NOT NULL,
    lab_category VARCHAR(100), -- metabolic, lipid, thyroid, etc.
    result_date DATE NOT NULL,

    -- Results (JSONB for flexibility)
    results JSONB NOT NULL, -- {test_name: {value, unit, range, flag}}

    -- Clinical Context
    ordered_by_provider_id UUID REFERENCES providers(id),
    reviewed_by_provider_id UUID REFERENCES providers(id),
    reviewed_at TIMESTAMP,
    clinical_notes TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lab_results_patient_id ON lab_results(patient_id);
CREATE INDEX idx_lab_results_date ON lab_results(result_date);

-- =====================================================
-- GLP-1 WEIGHT MANAGEMENT TRACKING
-- =====================================================

CREATE TABLE glp1_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES providers(id),

    -- Baseline
    start_date DATE NOT NULL,
    end_date DATE,
    medication VARCHAR(100) NOT NULL, -- semaglutide, liraglutide, etc.

    -- Baseline Metrics
    baseline_weight_kg DECIMAL(5,2) NOT NULL,
    baseline_bmi DECIMAL(4,2) NOT NULL,
    baseline_a1c DECIMAL(4,2),
    baseline_lipids JSONB,

    -- Goals
    target_weight_kg DECIMAL(5,2),
    target_bmi DECIMAL(4,2),

    -- Safety Monitoring
    pancreatitis_history BOOLEAN DEFAULT false,
    gallbladder_history BOOLEAN DEFAULT false,
    thyroid_cancer_history BOOLEAN DEFAULT false,

    -- Status
    is_active BOOLEAN DEFAULT true,
    discontinuation_reason TEXT,
    discontinuation_date DATE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE glp1_weekly_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES glp1_programs(id),
    patient_id UUID NOT NULL REFERENCES patients(id),

    week_number INTEGER NOT NULL,
    checkin_date DATE NOT NULL,

    -- Metrics
    weight_kg DECIMAL(5,2) NOT NULL,
    bmi DECIMAL(4,2) NOT NULL,

    -- Side Effects
    nausea_severity INTEGER, -- 0-10
    vomiting BOOLEAN,
    diarrhea BOOLEAN,
    constipation BOOLEAN,
    abdominal_pain BOOLEAN,
    other_side_effects TEXT,

    -- Adherence
    medication_taken_as_prescribed BOOLEAN,
    missed_doses INTEGER DEFAULT 0,

    -- Lifestyle
    exercise_minutes_week INTEGER,
    dietary_adherence_score INTEGER, -- 0-10

    -- Gamification
    points_earned INTEGER DEFAULT 0,
    badges_unlocked TEXT[],

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_glp1_programs_patient_id ON glp1_programs(patient_id);
CREATE INDEX idx_glp1_checkins_program_id ON glp1_weekly_checkins(program_id);

-- =====================================================
-- CONSENT MANAGEMENT
-- =====================================================

CREATE TABLE consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    consent_type consent_type NOT NULL,

    -- Version Control
    consent_version VARCHAR(20) NOT NULL,
    consent_text TEXT NOT NULL,

    -- Signature
    signed_at TIMESTAMP NOT NULL,
    signature_method VARCHAR(50) NOT NULL, -- esign, verbal, written
    ip_address INET,

    -- Status
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMP,
    revocation_reason TEXT,

    -- Retention
    expires_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_consents_patient_id ON consents(patient_id);
CREATE INDEX idx_consents_type ON consents(consent_type);

-- =====================================================
-- PDMP (Prescription Drug Monitoring Program) CHECKS
-- =====================================================

CREATE TABLE pdmp_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    visit_id UUID REFERENCES visits(id),

    -- Query Details
    checked_at TIMESTAMP DEFAULT NOW(),
    state VARCHAR(2) NOT NULL DEFAULT 'FL',

    -- Results
    result_data JSONB NOT NULL,
    prescriptions_found INTEGER,
    providers_found INTEGER,
    pharmacies_found INTEGER,

    -- Red Flags
    red_flags TEXT[],
    risk_score INTEGER, -- 0-100

    -- Action
    provider_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP,
    clinical_notes TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pdmp_checks_patient_id ON pdmp_checks(patient_id);
CREATE INDEX idx_pdmp_checks_provider_id ON pdmp_checks(provider_id);

-- =====================================================
-- GAMIFICATION SYSTEM
-- =====================================================

CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL, -- empathy_master, safety_champion, etc.
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category badge_category NOT NULL,
    icon_url TEXT,
    points_value INTEGER NOT NULL DEFAULT 0,

    -- Unlock Criteria
    criteria JSONB NOT NULL, -- {metric: threshold}

    -- Localization
    name_es VARCHAR(255),
    description_es TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    badge_id UUID NOT NULL REFERENCES badges(id),

    earned_at TIMESTAMP DEFAULT NOW(),
    context JSONB, -- What triggered the badge

    UNIQUE(user_id, badge_id)
);

CREATE TABLE point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),

    points INTEGER NOT NULL, -- Can be positive or negative
    reason VARCHAR(255) NOT NULL,
    context JSONB,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);

-- =====================================================
-- AI TRAINING & FEEDBACK LOOP
-- =====================================================

CREATE TABLE ai_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES visits(id),
    provider_id UUID NOT NULL REFERENCES providers(id),

    -- Model Details
    model_version VARCHAR(50) NOT NULL,
    prompt_version VARCHAR(50) NOT NULL,

    -- Inputs
    input_data JSONB NOT NULL,

    -- AI Outputs
    suggestions JSONB[], -- Real-time suggestions during visit
    safety_alerts JSONB[],
    empathy_scores JSONB[], -- Time-series empathy tracking
    next_question_hints TEXT[],

    -- Mentor Feedback (for training)
    mentor_reviewed BOOLEAN DEFAULT false,
    mentor_review_data JSONB,
    mentor_labels JSONB, -- Ground truth labels for fine-tuning

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_sessions_visit_id ON ai_sessions(visit_id);
CREATE INDEX idx_ai_sessions_provider_id ON ai_sessions(provider_id);

-- =====================================================
-- AUDIT LOG (HIPAA Compliance)
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Who
    user_id UUID REFERENCES users(id),
    user_role user_role,

    -- What
    action VARCHAR(100) NOT NULL, -- read, create, update, delete, login, etc.
    resource_type VARCHAR(100) NOT NULL, -- patient, visit, prescription, etc.
    resource_id UUID,

    -- When & Where
    timestamp TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,

    -- Details
    changes JSONB, -- Before/after for updates
    reason TEXT, -- Clinical justification for access

    -- Retention: 7 years minimum
    retention_expires_at TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- =====================================================
-- SESSION MANAGEMENT (Redis-backed, this is PostgreSQL fallback)
-- =====================================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),

    refresh_token_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,

    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- =====================================================
-- AUTOMATED RETENTION POLICY (Trigger Function)
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_retention_date(
    is_minor BOOLEAN,
    minor_until DATE,
    base_date TIMESTAMP
) RETURNS TIMESTAMP AS $$
BEGIN
    IF is_minor THEN
        RETURN (minor_until + INTERVAL '7 years')::TIMESTAMP;
    ELSE
        RETURN (base_date + INTERVAL '7 years')::TIMESTAMP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate retention dates
CREATE OR REPLACE FUNCTION set_retention_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.retention_expires_at := calculate_retention_date(
        NEW.minor_until_date IS NOT NULL,
        NEW.minor_until_date,
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_patient_retention
    BEFORE INSERT OR UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION set_retention_date();

-- =====================================================
-- UPDATED_AT TRIGGERS (Auto-update timestamps)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_providers_updated_at BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_visits_updated_at BEFORE UPDATE ON visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- VIEWS (Performance Optimization)
-- =====================================================

-- Provider dashboard view
CREATE VIEW provider_dashboard AS
SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.credential,
    p.empathy_score,
    p.safety_score,
    p.total_visits_completed,
    COUNT(DISTINCT v.id) FILTER (WHERE v.scheduled_start >= NOW() - INTERVAL '30 days') as visits_last_30_days,
    COUNT(DISTINCT ub.badge_id) as total_badges
FROM providers p
LEFT JOIN visits v ON p.id = v.provider_id
LEFT JOIN user_badges ub ON p.user_id = ub.user_id
GROUP BY p.id;

-- Patient engagement view
CREATE VIEW patient_engagement AS
SELECT
    p.id,
    p.user_id,
    p.total_points,
    p.current_streak_days,
    COUNT(DISTINCT v.id) as total_visits,
    COUNT(DISTINCT ub.badge_id) as total_badges,
    MAX(v.actual_start) as last_visit_date
FROM patients p
LEFT JOIN visits v ON p.id = v.patient_id
LEFT JOIN user_badges ub ON p.user_id = ub.user_id
GROUP BY p.id;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX idx_visits_provider_date ON visits(provider_id, scheduled_start DESC);
CREATE INDEX idx_visits_patient_date ON visits(patient_id, scheduled_start DESC);
CREATE INDEX idx_prescriptions_patient_created ON prescriptions(patient_id, created_at DESC);

-- Full-text search indexes (for clinical notes)
CREATE INDEX idx_visits_chief_complaint_fts ON visits USING gin(to_tsvector('english', chief_complaint));
CREATE INDEX idx_visits_assessment_fts ON visits USING gin(to_tsvector('english', assessment));

-- =====================================================
-- ROW-LEVEL SECURITY (RLS) SETUP
-- =====================================================
-- Enable RLS on sensitive tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

-- Note: Policies will be defined in application layer for flexibility
-- RLS provides defense-in-depth against SQL injection

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE patients IS 'Patient demographic and clinical data. PHI encrypted at application layer.';
COMMENT ON TABLE visits IS 'Clinical encounters with AI-assisted documentation and billing.';
COMMENT ON TABLE prescriptions IS 'DEA-compliant electronic prescriptions with eRx integration.';
COMMENT ON TABLE pdmp_checks IS 'Required PDMP checks before Schedule II-V prescriptions (Florida law).';
COMMENT ON TABLE audit_logs IS 'HIPAA-required audit trail. Retention: 7 years minimum.';
COMMENT ON COLUMN patients.retention_expires_at IS 'Auto-calculated: 7 years from last contact, or age 25 for minors.';
