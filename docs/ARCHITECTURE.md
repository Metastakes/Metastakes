# NeuroBridge AI - System Architecture

**Version:** 1.0.0
**Last Updated:** 2025-10-21
**Status:** Foundation Design

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [High-Level Architecture](#high-level-architecture)
4. [Portal Architecture](#portal-architecture)
5. [AI Feedback Loop](#ai-feedback-loop)
6. [Data Flow Patterns](#data-flow-patterns)
7. [Integration Architecture](#integration-architecture)
8. [Security & Compliance](#security--compliance)
9. [Scalability Design](#scalability-design)
10. [Deployment Architecture](#deployment-architecture)

---

## System Overview

### Mission
Build a HIPAA-compliant, AI-driven telepsychiatry platform that trains world-class PMHNPs through real-time feedback, gamified engagement, and evidence-based clinical decision support.

### Core Principles
- **Safety First**: AI guardrails, PDMP integration, multi-layer validation
- **Simplicity**: ≤3 clicks from dashboard to any action
- **Scalability**: Modular microservices, plug-and-play integrations
- **Engagement**: Gamification across all portals

### Success Metrics
- **Provider Training**: Time to independent practice < 6 months
- **Patient Adherence**: >80% medication adherence rate
- **Clinical Safety**: Zero adverse events from system errors
- **User Satisfaction**: NPS >50 across all portals

---

## Technology Stack

### Frontend
```
Framework:       Next.js 14.x (App Router)
Language:        TypeScript 5.x
Styling:         TailwindCSS 3.x
UI Components:   Shadcn/ui + Radix UI
State:           Zustand + React Query
Forms:           React Hook Form + Zod
i18n:            next-intl (EN/ES)
PWA:             next-pwa
Charts:          Recharts + Victory
```

### Backend
```
Primary API:     FastAPI 0.110+ (Python 3.11+)
Alternative:     NestJS (if Node preferred)
Validation:      Pydantic 2.x
ORM:             SQLAlchemy 2.x + Alembic
Task Queue:      Celery + Redis
Real-time:       WebSockets (FastAPI) or Socket.io
```

### Database & Cache
```
Primary DB:      PostgreSQL 15+ (Supabase/Neon)
Cache:           Redis 7.x
Search:          PostgreSQL Full-Text (future: Elasticsearch)
```

### Infrastructure
```
Hosting:         Google Cloud Platform (BAA-covered)
Compute:         Cloud Run (serverless) or GKE
Storage:         Cloud Storage (encrypted PHI)
CDN:             Cloud CDN
Monitoring:      Cloud Logging + Error Reporting
Secrets:         Secret Manager
```

### AI & ML
```
Model:           Google Gemini 1.5 Pro/Flash
Platform:        Vertex AI (BAA-compliant)
Training:        Nightly batch jobs with mentor-labeled data
Embedding:       text-embedding-004 (future semantic search)
```

### Integrations
```
Payments:        Stripe (Connect for provider payouts)
Video:           Google Meet (Calendar API)
Scheduling:      Google Calendar API
Billing:         Availity → Eligible → Waystar (phased)
Credentialing:   CAQH ProView API
eRx:             Future (DrFirst, Surescripts)
PDMP:            E-FORCSE (Florida)
Analytics:       PostHog (privacy-safe)
```

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Patient  │  │ Provider │  │  Mentor  │  │  Admin   │       │
│  │  Portal  │  │  Portal  │  │  Portal  │  │  Portal  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │             │               │
│       └─────────────┴─────────────┴─────────────┘               │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │ HTTPS/WSS
┌──────────────────────────┼───────────────────────────────────────┐
│                    API GATEWAY LAYER                              │
│                  (Cloud Load Balancer)                            │
│                 - Rate Limiting                                   │
│                 - WAF Rules                                       │
│                 - SSL Termination                                 │
└──────────────────────────┼───────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│                  APPLICATION LAYER                                │
│  ┌────────────────────────────────────────────────────┐          │
│  │           FastAPI Application (Cloud Run)          │          │
│  │                                                     │          │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │          │
│  │  │   Auth   │ │ Clinical │ │ Billing  │           │          │
│  │  │  Service │ │  Service │ │ Service  │           │          │
│  │  └──────────┘ └──────────┘ └──────────┘           │          │
│  │                                                     │          │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │          │
│  │  │   AI     │ │  GLP-1   │ │ Gamif.   │           │          │
│  │  │  Service │ │  Service │ │ Service  │           │          │
│  │  └──────────┘ └──────────┘ └──────────┘           │          │
│  └────────────────────────────────────────────────────┘          │
│                           │                                       │
│  ┌────────────────────────┼───────────────────────────┐          │
│  │         Background Workers (Celery)                │          │
│  │  - AI Analysis         - Email/SMS                 │          │
│  │  - Nightly Training    - Report Generation         │          │
│  │  - Claims Submission   - Retention Enforcement     │          │
│  └────────────────────────────────────────────────────┘          │
└──────────────────────────┼───────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│                     DATA LAYER                                    │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │
│  │   PostgreSQL   │  │     Redis      │  │  Cloud Storage │     │
│  │   (Primary)    │  │   (Cache)      │  │  (PHI Files)   │     │
│  │                │  │                │  │                │     │
│  │ - Row-Level    │  │ - Sessions     │  │ - Consents     │     │
│  │   Security     │  │ - Rate Limits  │  │ - Transcripts  │     │
│  │ - Audit Log    │  │ - Pub/Sub      │  │ - Attachments  │     │
│  │ - Versioning   │  │                │  │                │     │
│  └────────────────┘  └────────────────┘  └────────────────┘     │
└───────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────────┐
│                 EXTERNAL INTEGRATIONS                             │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Gemini  │  │  Stripe  │  │  Google  │  │ Availity │        │
│  │ Vertex   │  │ Payments │  │ Calendar │  │ Billing  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ E-FORCSE │  │   CAQH   │  │ Eligible │  │ Waystar  │        │
│  │   PDMP   │  │ ProView  │  │   API    │  │   EDI    │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└───────────────────────────────────────────────────────────────────┘
```

---

## Portal Architecture

### Patient Portal

**Purpose**: Gamified self-service for appointments, check-ins, and medication tracking

**Core Features**:
- Dashboard with streak counter and next appointment
- Symptom check-ins (PHQ-9, GAD-7, custom scales)
- Medication tracker with reminders
- GLP-1 progress logging (weight, side effects, photos)
- Badge showcase and point leaderboard
- Secure messaging with provider
- Appointment scheduling (Google Calendar integration)
- Educational content (med guides, side effects)
- Payment history and insurance info
- Spanish/English toggle

**Key Routes**:
```
/patient/dashboard
/patient/check-in
/patient/medications
/patient/glp1
/patient/appointments
/patient/messages
/patient/profile
/patient/badges
```

**State Management**:
- User session (Zustand)
- Clinical data (React Query with 5-min cache)
- Real-time chat (WebSocket)

---

### Provider Portal

**Purpose**: AI-assisted clinical workspace for medication management and documentation

**Core Features**:
- Today's schedule with patient quick-view
- Pre-encounter prep (last note, meds, PDMP status)
- Live encounter workspace:
  - Real-time transcript (if enabled)
  - Gemini AI suggestions sidebar
  - Quick-add medications with interaction checking
  - ICD-10 search with recent favorites
  - CPT calculator (time vs. MDM)
  - PDMP one-click check for controlled substances
- SOAP note editor with templates
- GLP-1 clinical pathways and titration guide
- Mentor feedback inbox
- Performance dashboard (safety, empathy, documentation scores)
- Badge progress tracker

**Key Routes**:
```
/provider/dashboard
/provider/schedule
/provider/encounter/:id
/provider/patients/:id
/provider/notes
/provider/glp1-programs
/provider/feedback
/provider/analytics
/provider/education
```

**AI Integration**:
- Real-time: Gemini suggests next questions during encounter
- Post-encounter: Full transcript analysis with safety flags
- Weekly: Trend analysis of prescribing patterns

---

### Mentor Portal

**Purpose**: Supervise PMHNPs, review sessions, and improve AI training data

**Core Features**:
- Supervisee list with pending reviews
- Session transcript viewer with AI analysis overlay
- Note review workflow (approve/amend/return)
- AI feedback correction interface:
  - Override AI safety scores
  - Label missed red flags
  - Rate suggestion quality
- Supervisee analytics dashboard
- Scheduled 1:1 meeting tracker
- Training resource library

**Key Routes**:
```
/mentor/dashboard
/mentor/supervisees
/mentor/review/:encounter_id
/mentor/analytics/:provider_id
/mentor/feedback-queue
/mentor/meetings
```

**AI Training Loop**:
1. Mentor reviews transcript + AI output
2. Corrects any errors via UI
3. Labels saved to `transcripts.mentor_corrections`
4. Nightly job exports corrections to Vertex AI
5. Model fine-tuned weekly with validated data

---

### Admin Portal

**Purpose**: Master control for system config, user management, and compliance

**Core Features**:
- User directory (lock/unlock, role changes)
- System settings editor (retention, gamification rules)
- Insurance panel configuration
- Compliance monitoring dashboard
- Audit log viewer with advanced filters
- Retention policy enforcement
- Billing configuration (cash-pay vs. insurance mode)
- Analytics overview (census, revenue, safety metrics)

**Key Routes**:
```
/admin/dashboard
/admin/users
/admin/settings
/admin/compliance
/admin/audit-logs
/admin/billing-config
/admin/analytics
```

**Critical Settings**:
- `retention_default_years`: 7
- `retention_minor_age_limit`: 25
- `pdmp_check_required_for_controlled`: true
- `ai_feedback_enabled`: true
- `max_encounter_duration_minutes`: 60

---

## AI Feedback Loop

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ENCOUNTER HAPPENS                         │
│  Provider conducts session → Transcript captured (optional)  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              REAL-TIME AI ANALYSIS (Gemini)                  │
│                                                               │
│  Input:  Transcript text (no video/audio stored)             │
│  Model:  Gemini 1.5 Flash (low latency)                      │
│                                                               │
│  Output (JSON):                                               │
│    {                                                          │
│      "safety_score": 85,                                      │
│      "empathy_score": 78,                                     │
│      "red_flags": ["Patient mentioned SI ideation"],          │
│      "suggestions": [                                         │
│        "Consider asking about plan/intent",                   │
│        "Review previous safety plan"                          │
│      ],                                                       │
│      "medication_concerns": [                                 │
│        "Bupropion + seizure history = contraindication"       │
│      ],                                                       │
│      "documentation_hints": [                                 │
│        "Document suicide risk assessment"                     │
│      ]                                                        │
│    }                                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              STORE IN TRANSCRIPTS TABLE                      │
│  - transcript_text                                            │
│  - ai_analysis (JSONB)                                        │
│  - mentor_labeled = FALSE                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 MENTOR REVIEWS                               │
│  - Reads transcript + AI output                              │
│  - Corrects any errors:                                      │
│    • Override safety score                                   │
│    • Add missed red flags                                    │
│    • Remove false positives                                  │
│  - Saves corrections to mentor_corrections (JSONB)           │
│  - Sets mentor_labeled = TRUE                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              NIGHTLY TRAINING JOB                            │
│                                                               │
│  1. SELECT * FROM transcripts                                │
│     WHERE mentor_labeled = TRUE                              │
│       AND used_for_training = FALSE                          │
│                                                               │
│  2. Format as training examples:                             │
│     {                                                         │
│       "input": transcript_text,                              │
│       "output": mentor_corrections (ground truth)            │
│     }                                                         │
│                                                               │
│  3. Export to Vertex AI Training Dataset                     │
│                                                               │
│  4. UPDATE transcripts SET used_for_training = TRUE          │
│                                                               │
│  5. Weekly: Fine-tune model with new labeled data            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            IMPROVED AI DEPLOYED                              │
│  - Next day: New model version in production                 │
│  - Monitors: Compare safety_score distribution               │
│  - Rollback: If >10% degradation vs. mentor labels           │
└─────────────────────────────────────────────────────────────┘
```

### Gemini Prompt Engineering

**System Prompt** (stored in `system_settings`):
```
You are a psychiatric clinical decision support system.

Your role is to analyze patient-provider conversations and provide:
1. Safety assessment (suicide/homicide risk, medication contraindications)
2. Empathy evaluation (active listening, validation, rapport)
3. Documentation guidance (ensure MDM elements captured)
4. Clinical suggestions (differential diagnoses, next questions)

Guidelines:
- Always prioritize safety over all other concerns
- Flag any mention of SI/HI/psychosis immediately
- Check medication interactions using provided patient medication list
- Suggest evidence-based treatments per APA guidelines
- Be concise; providers have limited time
- Never make definitive diagnoses; only suggest considerations

Output as JSON following this schema:
{
  "safety_score": 0-100,
  "empathy_score": 0-100,
  "red_flags": ["array of critical safety concerns"],
  "suggestions": ["array of clinical suggestions"],
  "medication_concerns": ["array of interaction/contraindication warnings"],
  "documentation_hints": ["array of billing/compliance reminders"]
}
```

**Context Injection**:
- Current medication list
- Active diagnoses
- Recent PDMP report summary
- Last encounter chief complaint
- Allergies

**Privacy**:
- Only transcript text sent to Gemini (no audio/video)
- PHI de-identified for model training (dates, names → placeholders)
- All data covered under GCP BAA

---

## Data Flow Patterns

### 1. Patient Check-In Flow

```
Patient Portal                  API                    Database
     │                          │                          │
     │─────check-in POST────────▶                          │
     │  {phq9_score: 12,        │                          │
     │   mood: "anxious"}       │                          │
     │                          │                          │
     │                          │────INSERT streak─────────▶
     │                          │                          │
     │                          │────UPDATE patient────────▶
     │                          │  (points, streak)        │
     │                          │                          │
     │                          │◀──check badge triggers───│
     │                          │                          │
     │◀────response─────────────│                          │
     │  {points: +10,           │                          │
     │   new_badge: "7day"}     │                          │
     │                          │                          │
     │────UI update─────────────▶                          │
     │  (confetti animation)    │                          │
```

### 2. Encounter Workflow

```
Provider Portal         API              Gemini AI         Database
     │                   │                    │                │
     │──start encounter──▶                    │                │
     │                   │──INSERT encounter──▶                │
     │                   │  (status: in_prog) │                │
     │                   │                    │                │
     │◀──transcript stream via WebSocket──────│                │
     │                   │                    │                │
     │──end encounter────▶                    │                │
     │                   │──full transcript───▶                │
     │                   │                    │                │
     │                   │◀────AI analysis────│                │
     │                   │  (JSON feedback)   │                │
     │                   │                    │                │
     │                   │──INSERT transcript─────────────────▶│
     │                   │                    │                │
     │◀──AI suggestions──│                    │                │
     │  (UI sidebar)     │                    │                │
     │                   │                    │                │
     │──save SOAP note───▶                    │                │
     │                   │──INSERT soap_note──────────────────▶│
     │                   │                    │                │
     │                   │──UPDATE encounter──────────────────▶│
     │                   │  (status: completed)                │
```

### 3. Medication Prescribing Flow

```
Provider Portal         API            PDMP/Database       eRx (Future)
     │                   │                    │                  │
     │──prescribe med────▶                    │                  │
     │  (controlled)     │                    │                  │
     │                   │                    │                  │
     │                   │──check PDMP────────▶                  │
     │                   │  (if controlled)   │                  │
     │                   │                    │                  │
     │                   │◀───PDMP report─────│                  │
     │                   │                    │                  │
     │◀──PDMP summary────│                    │                  │
     │  (red flags UI)   │                    │                  │
     │                   │                    │                  │
     │──confirm/proceed──▶                    │                  │
     │                   │                    │                  │
     │                   │──INSERT medication─────────────────▶  │
     │                   │                                       │
     │                   │──send to eRx──────────────────────────▶
     │                   │                                       │
     │◀──prescription ID─│                                       │
```

### 4. Mentor Review Flow

```
Mentor Portal          API              Database           Vertex AI
     │                  │                    │                  │
     │──get pending─────▶                    │                  │
     │                  │──SELECT transcripts│                  │
     │                  │  WHERE mentor_     │                  │
     │                  │  labeled = FALSE   │                  │
     │                  │                    │                  │
     │◀──transcript+AI──│                    │                  │
     │                  │                    │                  │
     │──submit review───▶                    │                  │
     │  {corrections:   │                    │                  │
     │   {...}}         │                    │                  │
     │                  │                    │                  │
     │                  │──UPDATE transcript─▶                  │
     │                  │  (mentor_corrections,                 │
     │                  │   mentor_labeled = TRUE)              │
     │                  │                    │                  │
     │                  │─────────[nightly job]─────────────────▶
     │                  │                    │  (training data) │
```

---

## Integration Architecture

### Payment Processing (Stripe)

**Cash-Pay Patient Flow**:
1. Patient books appointment → Stripe Payment Intent created
2. Payment captured at booking (or day-before if cancellation policy)
3. `payments` table updated with status
4. Provider payout calculated weekly via `provider_payouts` table
5. Stripe Connect transfer to provider bank account

**Provider Payout Calculation**:
```python
# Bi-weekly payout job
encounters = get_completed_encounters(provider_id, period_start, period_end)
total = 0
for enc in encounters:
    if enc.payment_status == 'paid':
        # Provider gets 70% of encounter fee (example split)
        total += enc.payment_amount * 0.70

create_payout(provider_id, total, period_start, period_end)
```

### Google Calendar / Meet Integration

**Appointment Scheduling**:
1. Patient selects available slot from provider's calendar
2. API creates Google Calendar event with:
   - Patient + Provider emails
   - Auto-generated Google Meet link
   - HIPAA-compliant description (no PHI)
3. Event ID stored in `encounters.google_calendar_event_id`
4. Email reminders via Calendar (24hr, 1hr before)

**Cancellation Handling**:
- Cancel via API → Delete Google Calendar event
- Late cancel (< 24hr) → Flag `encounters.late_cancel = TRUE`
- Charge late cancel fee per `financial_agreement` consent

### Insurance Billing (Phase 2+)

**Eligibility Check (Eligible API)**:
```
Patient Portal → Check insurance → Eligible API (270/271)
├─ Valid coverage → Store in patients.insurance_*
└─ Invalid/No coverage → Offer cash-pay

Provider Portal → Pre-encounter check → Display coverage status
```

**Claims Submission (Availity → Waystar)**:
```
SOAP Note Finalized
  ↓
Generate EDI 837 (via Waystar API)
  ├─ Patient demographics
  ├─ Provider NPI + Tax ID
  ├─ CPT codes (99212-99215 + G2211)
  ├─ ICD-10 codes (primary + secondary)
  ├─ Modifiers (95 for telehealth)
  └─ Date of service
  ↓
Submit to clearinghouse (Availity)
  ↓
Receive 835 remittance (1-3 weeks)
  ↓
Update insurance_claims table
  ├─ Status: paid/denied
  ├─ Allowed amount
  ├─ Patient responsibility
  └─ Trigger patient billing if balance > 0
```

### PDMP Integration (E-FORCSE)

**Trigger Points**:
- Provider clicks "Prescribe Controlled Substance"
- Automatic check if >30 days since last PDMP query

**Flow**:
1. API calls E-FORCSE with patient DOB + name
2. Parse response for:
   - Active controlled substance Rxs
   - Multiple prescribers (red flag)
   - Dangerous combinations (benzos + opioids)
3. Store in `pdmp_checks` table
4. Display summary in Provider Portal
5. Require provider acknowledgment before proceeding

### CAQH ProView (Credentialing)

**Provider Onboarding**:
1. Provider enters NPI + CAQH ID in profile
2. Background job queries CAQH ProView API
3. Validates:
   - Active licenses
   - Malpractice insurance
   - Board certification
   - DEA registration
4. Flags expiring credentials 60 days in advance
5. Auto-reminder emails for re-attestation

---

## Security & Compliance

### HIPAA Compliance

**Technical Safeguards**:
- Encryption at rest: AES-256 (PostgreSQL TDE + Cloud Storage)
- Encryption in transit: TLS 1.3
- Access control: Row-Level Security (RLS) on all PHI tables
- Audit logging: Immutable `audit_logs` table (7-year retention)
- Session management: JWT with 15-min expiration, refresh tokens
- MFA: Required for providers, mentors, admins

**Administrative Safeguards**:
- Business Associate Agreements (BAAs):
  - Google Cloud Platform
  - Stripe (for payment processing)
  - Any future subcontractors
- Annual risk assessments
- Workforce training on HIPAA (documented)
- Incident response plan

**Physical Safeguards**:
- GCP data centers (SOC 2 Type II certified)
- No local PHI storage on client devices (cache encrypted)

### Data Retention Policy

**Implementation**:
```sql
-- Nightly job calculates retention deadlines
UPDATE retention_policies
SET retention_until = CASE
    WHEN is_minor_at_creation THEN
        -- Retain until age 25
        date_of_birth + INTERVAL '25 years'
    ELSE
        -- Retain 7 years from last encounter
        last_encounter_date + INTERVAL '7 years'
END;

-- Flag records ready for deletion
UPDATE retention_policies
SET scheduled_deletion_date = CURRENT_DATE + INTERVAL '30 days'
WHERE retention_until < CURRENT_DATE
  AND deletion_executed_at IS NULL;

-- Manual review before final deletion
-- Admin approves via portal, then hard delete executed
```

**Deletion Scope**:
- Patient record + clinical_profile
- All encounters, notes, transcripts
- Medications, diagnoses (historical only)
- Messages, payments (financial records retained per law)
- Audit logs (retained separately for 7 years)

### Authentication & Authorization

**Role-Based Access Control (RBAC)**:

| Resource               | Patient | Provider | Mentor | Admin |
|------------------------|---------|----------|--------|-------|
| Own profile (read)     | ✓       | ✓        | ✓      | ✓     |
| Own profile (write)    | ✓       | ✓        | ✓      | ✓     |
| Other patient data     | ✗       | ✓*       | ✓*     | ✓     |
| SOAP notes (read)      | ✗       | ✓*       | ✓*     | ✓     |
| SOAP notes (write)     | ✗       | ✓*       | ✗      | ✗     |
| SOAP notes (amend)     | ✗       | ✗        | ✓*     | ✗     |
| Prescribe medications  | ✗       | ✓        | ✓      | ✗     |
| View transcripts       | ✗       | ✓*       | ✓*     | ✗     |
| Label AI training data | ✗       | ✗        | ✓      | ✗     |
| System settings        | ✗       | ✗        | ✗      | ✓     |
| Audit logs             | ✗       | ✗        | ✗      | ✓     |

*Only for assigned patients (via `encounters` relationship)

**Implementation**:
- PostgreSQL RLS policies enforce row-level permissions
- API middleware validates JWT role claim
- Frontend hides unauthorized UI elements (defense in depth)

### Audit Logging

**Logged Events**:
- Login/logout (with IP + user agent)
- PHI access (patient view, note opened)
- Clinical actions (diagnosis added, medication prescribed)
- Administrative changes (user locked, settings modified)
- Failed access attempts (for intrusion detection)

**Audit Log Query Example**:
```sql
SELECT
    timestamp,
    user_id,
    action,
    resource_type,
    resource_id
FROM audit_logs
WHERE resource_type = 'patient'
  AND resource_id = 'patient-uuid-here'
ORDER BY timestamp DESC;
```

---

## Scalability Design

### Horizontal Scaling Strategy

**Stateless API Servers**:
- Cloud Run auto-scales based on request volume (0 to N instances)
- No server-side sessions; all state in JWT or Redis cache
- Database connection pooling (SQLAlchemy + PgBouncer)

**Database Scaling**:
- Primary: PostgreSQL 15 (Supabase/Neon with built-in read replicas)
- Read replicas for analytics queries (avoid blocking writes)
- Partitioning strategy for large tables:
  - `audit_logs`: Partition by month (automatic archival)
  - `messages`: Partition by conversation_id hash
  - `transcripts`: Partition by created_at (monthly)

**Caching Strategy**:
- Redis for:
  - User sessions (15-min TTL)
  - Rate limiting (per-user, per-endpoint)
  - Frequently accessed reference data (ICD-10 codes, CPT codes)
  - Real-time pub/sub for WebSocket scaling

**CDN Offloading**:
- Static assets (JS, CSS, images) served via Cloud CDN
- Patient education PDFs cached at edge
- API responses for public data (e.g., available appointment slots)

### Performance Targets

| Metric                     | Target      | Monitoring           |
|----------------------------|-------------|----------------------|
| API response time (p95)    | < 200ms     | Cloud Monitoring     |
| Database query time (p95)  | < 50ms      | pg_stat_statements   |
| Page load (First Paint)    | < 1.5s      | Lighthouse CI        |
| WebSocket latency          | < 100ms     | Custom metrics       |
| Gemini AI response time    | < 3s        | Vertex AI logs       |
| Concurrent users           | 10,000+     | Load testing (k6)    |

### Failure Resilience

**Database**:
- Automated backups (daily snapshots + PITR)
- Cross-region replication (disaster recovery)
- Connection retry logic with exponential backoff

**API**:
- Circuit breaker pattern for external APIs (Stripe, Gemini)
- Graceful degradation (e.g., AI suggestions optional)
- Health check endpoints (`/health`, `/ready`)

**Background Jobs**:
- Celery task retries (3 attempts with backoff)
- Dead letter queue for failed jobs
- Monitoring via Flower dashboard

---

## Deployment Architecture

### Environments

```
┌─────────────────────────────────────────────────────────────┐
│                      PRODUCTION                              │
│  - GCP Project: neurobridge-prod                            │
│  - Database: Supabase Production (Multi-AZ)                 │
│  - Domain: app.neurobridge.ai                               │
│  - Secrets: Secret Manager (prod keys)                      │
│  - Monitoring: Full logging + alerting                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      STAGING                                 │
│  - GCP Project: neurobridge-staging                         │
│  - Database: Supabase Staging (Single-AZ)                   │
│  - Domain: staging.neurobridge.ai                           │
│  - Secrets: Secret Manager (test keys)                      │
│  - Purpose: Pre-release testing, demos                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   DEVELOPMENT (LOCAL)                        │
│  - Docker Compose: PostgreSQL + Redis + FastAPI             │
│  - Domain: localhost:3000 (Next.js) / localhost:8000 (API)  │
│  - Secrets: .env.local (never committed)                    │
│  - Purpose: Developer workstations                          │
└─────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml

on:
  push:
    branches: [main, staging]

jobs:
  test:
    - Run pytest (backend)
    - Run Jest (frontend)
    - Run Playwright E2E tests
    - SonarCloud code quality scan

  build:
    - Build Next.js (output: standalone)
    - Build FastAPI container (Docker)
    - Push images to Artifact Registry

  deploy:
    if: branch == 'main'
    - Deploy to Cloud Run (production)
    - Run database migrations (Alembic)
    - Smoke tests (health checks)
    - Notify Slack
```

### Infrastructure as Code (Terraform)

```
terraform/
├── modules/
│   ├── cloud_run/          # API service
│   ├── cloud_storage/      # PHI files
│   ├── secret_manager/     # Credentials
│   ├── vpc/                # Networking
│   └── monitoring/         # Alerts
├── environments/
│   ├── prod/
│   │   └── main.tf
│   └── staging/
│       └── main.tf
└── backend.tf              # Terraform state (GCS)
```

---

## Appendices

### A. API Endpoint Summary

*(See separate API_CONTRACTS.md for full specifications)*

**Authentication**:
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `POST /auth/mfa/verify`

**Patients**:
- `GET /patients/me`
- `PATCH /patients/me`
- `POST /patients/check-in`
- `GET /patients/badges`

**Providers**:
- `GET /providers/me`
- `GET /providers/schedule`
- `GET /providers/patients/:id`
- `POST /encounters/:id/start`
- `POST /encounters/:id/end`
- `POST /soap-notes`

**Encounters**:
- `POST /encounters` (book appointment)
- `GET /encounters/:id`
- `PATCH /encounters/:id/cancel`

**AI**:
- `POST /ai/analyze-transcript`
- `GET /ai/suggestions/:encounter_id`

**Admin**:
- `GET /admin/users`
- `PATCH /admin/users/:id/status`
- `GET /admin/audit-logs`
- `PATCH /admin/settings/:key`

### B. Tech Stack Alternatives Considered

| Component      | Chosen           | Alternatives Considered       | Rationale                        |
|----------------|------------------|-------------------------------|----------------------------------|
| Frontend       | Next.js 14       | Remix, SvelteKit              | Best DX, SEO, and ecosystem      |
| Backend        | FastAPI          | NestJS, Django                | Python for AI/ML integration     |
| Database       | PostgreSQL       | MongoDB, MySQL                | ACID compliance, JSON support    |
| Hosting        | GCP              | AWS, Azure                    | Vertex AI native, BAA available  |
| Payments       | Stripe           | Square, Braintree             | Best API, Connect for payouts    |
| AI             | Gemini           | GPT-4, Claude                 | Vertex AI integration, BAA       |

### C. Glossary

- **BAA**: Business Associate Agreement (HIPAA requirement)
- **CPT**: Current Procedural Terminology (billing codes)
- **DEA**: Drug Enforcement Administration
- **EDI**: Electronic Data Interchange (insurance billing format)
- **ICD-10**: International Classification of Diseases, 10th Revision
- **MDM**: Medical Decision Making (E/M component)
- **NPI**: National Provider Identifier
- **PDMP**: Prescription Drug Monitoring Program
- **PHI**: Protected Health Information
- **PMHNP**: Psychiatric Mental Health Nurse Practitioner
- **RLS**: Row-Level Security (PostgreSQL feature)
- **SOAP**: Subjective, Objective, Assessment, Plan (note format)

---

**Document Status**: Foundation Complete
**Next Steps**: Implement core authentication service, then patient portal MVP
**Maintainer**: Kevin Lazar / NeuroBridge AI Team
