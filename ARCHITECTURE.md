# NeuroBridge Architecture

## Table of Contents

1. [System Overview](#system-overview)
2. [Design Principles](#design-principles)
3. [Technology Stack](#technology-stack)
4. [Data Architecture](#data-architecture)
5. [Security Architecture](#security-architecture)
6. [AI Architecture](#ai-architecture)
7. [API Design](#api-design)
8. [Deployment Architecture](#deployment-architecture)
9. [Performance Optimization](#performance-optimization)
10. [Compliance & Regulatory](#compliance--regulatory)

---

## System Overview

NeuroBridge is a **HIPAA-compliant, AI-enhanced telepsychiatry platform** built using modern cloud-native architecture.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │ Patient   │  │ Provider  │  │  Mentor   │  │  Admin    │   │
│  │  Portal   │  │  Portal   │  │  Portal   │  │  Portal   │   │
│  │ (Next.js) │  │ (Next.js) │  │ (Next.js) │  │ (Next.js) │   │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘   │
└────────┼───────────────┼───────────────┼───────────────┼─────────┘
         │               │               │               │
         └───────────────┴───────────────┴───────────────┘
                                 │
                          [Load Balancer]
                                 │
┌────────────────────────────────┼──────────────────────────────────┐
│                        API GATEWAY LAYER                          │
│                    (NestJS Backend API)                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Authentication │ Rate Limiting │ Audit Logging │ CORS    │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬──────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
┌────────▼────────┐   ┌─────────▼────────┐   ┌────────▼────────┐
│   APPLICATION   │   │   INTEGRATION    │   │    AI ENGINE    │
│     LAYER       │   │      LAYER       │   │                 │
│                 │   │                  │   │  Vertex AI      │
│ • Visits        │   │ • PDMP (E-FORCSE)│   │  (Gemini)       │
│ • Prescriptions │   │ • eRx (Surescripts)  │                 │
│ • Patients      │   │ • Google Calendar│   │ • Live Loop     │
│ • Providers     │   │ • Google Meet    │   │ • Safety Alerts │
│ • Gamification  │   │ • Notifications  │   │ • Suggestions   │
│ • Labs          │   │                  │   │ • Training      │
└─────────────────┘   └──────────────────┘   └─────────────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────┐
│                        DATA LAYER                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │   PostgreSQL   │  │     Redis      │  │   GCP Storage  │    │
│  │ (Primary DB)   │  │  (Cache/       │  │  (PHI Backup)  │    │
│  │                │  │   Sessions)    │  │                │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
└───────────────────────────────────────────────────────────────────┘
```

---

## Design Principles

### 1. **Safety First**

- AI-driven medication safety checks (drug interactions, contraindications)
- PDMP integration required for controlled substances
- Multi-layer validation (frontend → backend → database)

### 2. **Simplicity**

- Clean separation of concerns (monorepo structure)
- Type-safe APIs (TypeScript across entire stack)
- Standardized response formats

### 3. **Scalability**

- Horizontal scaling via stateless API servers
- Redis for distributed session management
- Database read replicas for analytics
- CDN for static assets

### 4. **Engagement**

- Gamification engine with points, badges, streaks
- Real-time notifications (WebSocket)
- PWA for offline-first patient portal

---

## Technology Stack

### Frontend

| Technology | Purpose | Rationale |
|-----------|---------|-----------|
| **Next.js 14** | React framework | Server-side rendering, App Router, optimized builds |
| **TypeScript** | Type safety | Prevents runtime errors, improves DX |
| **Tailwind CSS** | Styling | Utility-first, highly customizable, small bundle |
| **Zod** | Runtime validation | Type-safe schema validation |
| **Socket.IO Client** | Real-time | Live visit updates, AI alerts |

### Backend

| Technology | Purpose | Rationale |
|-----------|---------|-----------|
| **NestJS** | Node.js framework | Modular architecture, TypeScript-first, enterprise-grade |
| **TypeScript** | Type safety | Same as frontend |
| **PostgreSQL** | Primary database | ACID compliance, JSONB support, mature |
| **Redis** | Cache & sessions | In-memory speed, pub/sub for real-time |
| **Passport.js** | Authentication | JWT + OAuth2 (Google) |

### AI & Integrations

| Technology | Purpose | Rationale |
|-----------|---------|-----------|
| **Vertex AI (Gemini)** | AI engine | BAA-covered, multimodal, safety-tuned |
| **E-FORCSE API** | PDMP | Florida law requirement |
| **Surescripts** | eRx | Industry standard for e-prescribing |
| **Google Meet** | Video conferencing | Integrated with Google Workspace |

### DevOps

| Technology | Purpose | Rationale |
|-----------|---------|-----------|
| **Docker** | Containerization | Consistent environments |
| **Kubernetes** | Orchestration | Auto-scaling, self-healing |
| **GCP** | Cloud provider | BAA-available, Vertex AI native |
| **Turborepo** | Monorepo builds | Fast, cached builds |

---

## Data Architecture

### Database Schema Design

#### Core Entities

```sql
users (authentication & roles)
  ├── patients (demographics + PHI, encrypted)
  ├── providers (credentials, NPI, DEA)
  └── sessions (JWT refresh tokens)

visits (clinical encounters)
  ├── prescriptions (DEA-compliant, eRx)
  ├── lab_results (metabolic panels, A1c, lipids)
  ├── ai_sessions (AI suggestions, mentor feedback)
  └── pdmp_checks (required for controlled substances)

glp1_programs (weight management)
  └── glp1_weekly_checkins (weight, side effects, adherence)

gamification
  ├── badges (achievements)
  ├── user_badges (awarded badges)
  └── point_transactions (points earned/spent)

compliance
  ├── consents (version-controlled, e-signature)
  └── audit_logs (HIPAA-required access logs)
```

#### Encryption Strategy

**Application-Layer Encryption** (AES-256-GCM):

- Patient names, DOB, SSN, phone, address
- Insurance IDs
- Emergency contact info

**Database-Layer Encryption** (TDE):

- Entire PostgreSQL database encrypted at rest

**In-Transit Encryption**:

- TLS 1.3 for all API calls
- mTLS for service-to-service communication

#### Retention Policy

| Data Type | Retention Period | Rationale |
|-----------|------------------|-----------|
| Adult patient records | 7 years from last contact | HIPAA minimum |
| Minor patient records | Until age 25 | Florida law |
| Audit logs | 7 years | HIPAA requirement |
| AI training data | 7 years (de-identified) | Model improvement |

**Implementation**: PostgreSQL trigger auto-calculates `retention_expires_at` on insert/update.

---

## Security Architecture

### Defense-in-Depth Layers

#### Layer 1: Network Security

- VPC with private subnets
- Cloud Armor (WAF) for DDoS protection
- IP allowlisting for admin portal

#### Layer 2: Application Security

- JWT with short expiration (15 min access, 7 day refresh)
- Rate limiting (100 req / 15 min per IP)
- CORS restrictions (whitelisted origins only)
- Helmet.js security headers
- SQL injection protection (parameterized queries)

#### Layer 3: Data Security

- PHI encryption at rest (AES-256-GCM)
- TLS 1.3 in transit
- Field-level encryption for sensitive data
- No PHI in logs (sanitized error messages)

#### Layer 4: Access Control

**Role-Based Access Control (RBAC)**:

```typescript
enum UserRole {
  PATIENT   // Can view own data only
  PROVIDER  // Can view assigned patients, create visits/prescriptions
  MENTOR    // Can view supervised providers, review AI sessions
  ADMIN     // Can manage users, view reports
  OWNER     // Full system access
}
```

**Row-Level Security (RLS)** enabled on sensitive tables.

#### Layer 5: Audit & Monitoring

- All API requests logged (who, what, when, where)
- Failed login attempts tracked (lockout after 5 attempts)
- Anomaly detection (unusual access patterns)
- SIEM integration (Security Information and Event Management)

---

## AI Architecture

### Live Training Loop

```typescript
// Visit starts
1. Provider opens visit
   ↓
2. Real-time transcript capture (Google Meet API)
   ↓
3. Stream to Vertex AI Gemini API
   ↓
4. AI processes context:
   - Patient history (meds, allergies, diagnoses)
   - Current transcript
   - Clinical guidelines (embedded knowledge)
   ↓
5. AI returns JSON suggestions:
   {
     "safetyAlerts": [
       {
         "severity": "critical",
         "message": "Drug interaction: Prozac + Tramadol → Serotonin syndrome risk",
         "action": "Recommend alternative analgesic"
       }
     ],
     "nextQuestions": ["Have you experienced any suicidal ideation?"],
     "empathyScore": 0.85,
     "cptRecommendation": "99214",
     "mdmLevel": "moderate"
   }
   ↓
6. Display in Provider HUD (real-time)
   ↓
7. Provider accepts/rejects suggestions
   ↓
8. Post-visit: Mentor reviews AI performance
   ↓
9. Mentor labels:
   - "Good suggestion" / "Missed diagnosis" / "False positive"
   ↓
10. Nightly batch: Update AI prompt/fine-tune model
```

### AI Safety Guardrails

#### Medication Safety

```typescript
// Before prescribing
1. Check allergies (database)
2. Check current medications (interactions via DrugBank API)
3. Check PDMP (controlled substances)
4. Check contraindications (diagnosis history)
5. Check dosing limits (age, weight, renal function)
```

#### Psychotherapy Time Threshold

```typescript
if (therapyDiscussionMinutes > 10) {
  // Suggest therapy referral
  // Prevent miscoding with psychotherapy add-ons (90833, 90836, 90838)
  alert("Consider therapy referral for patient. Do not bill psychotherapy add-ons for med management visits.")
}
```

---

## API Design

### RESTful API Standards

**Base URL**: `https://api.neurobridge.health/api/v1`

**Versioning**: URI-based (`/v1`, `/v2`)

**Response Format**:

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: Date;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

**Authentication**:

```
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

**Rate Limiting**:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698765432
```

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | User login (email + password) |
| `/auth/register/patient` | POST | Patient self-registration |
| `/auth/refresh` | POST | Refresh access token |
| `/visits` | GET, POST | List/create visits |
| `/visits/:id` | GET, PATCH | View/update visit |
| `/prescriptions` | POST | Create prescription (PDMP check required) |
| `/pdmp/check` | POST | Check PDMP before prescribing |
| `/glp1/programs` | POST | Enroll in GLP-1 program |
| `/glp1/checkins` | POST | Weekly weight check-in |
| `/gamification/badges` | GET | List user badges |
| `/ai/sessions` | POST | Start AI session for visit |

---

## Deployment Architecture

### GCP Infrastructure

```
┌─────────────────────────────────────────────────────────┐
│                     Cloud Load Balancer                  │
│                  (SSL/TLS Termination)                   │
└─────────────────────┬───────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
┌────────▼─────────┐     ┌─────────▼────────┐
│  GKE Cluster     │     │   Cloud CDN      │
│  (API Servers)   │     │  (Static Assets) │
│                  │     └──────────────────┘
│ • Auto-scaling   │
│ • Health checks  │
│ • Rolling updates│
└──────────────────┘
         │
         ├──────────────────────────────┐
         │                              │
┌────────▼─────────┐          ┌─────────▼────────┐
│  Cloud SQL       │          │  Memorystore     │
│  (PostgreSQL)    │          │  (Redis)         │
│                  │          └──────────────────┘
│ • Multi-AZ       │
│ • Automated      │
│   backups        │
│ • Encryption     │
└──────────────────┘
```

### Kubernetes Deployment

```yaml
# api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: neurobridge-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: neurobridge-api
  template:
    metadata:
      labels:
        app: neurobridge-api
    spec:
      containers:
      - name: api
        image: gcr.io/neurobridge/api:latest
        ports:
        - containerPort: 3100
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3100
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3100
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## Performance Optimization

### Backend Optimizations

1. **Database Connection Pooling**
   - Min: 2 connections
   - Max: 10 connections
   - Prevents connection exhaustion

2. **Redis Caching**
   - Session data (15 min TTL)
   - Frequently accessed patient data (5 min TTL)
   - Badge definitions (1 hour TTL)

3. **Database Indexes**
   - Composite indexes on `(patient_id, scheduled_start)` for visits
   - Full-text search indexes on clinical notes
   - Partial indexes for active records only

4. **Query Optimization**
   - Use views for complex joins (e.g., `provider_dashboard`)
   - Pagination for large result sets
   - Lazy loading for related entities

### Frontend Optimizations

1. **Code Splitting**
   - Route-based splitting (Next.js automatic)
   - Dynamic imports for heavy components

2. **Image Optimization**
   - Next.js Image component (WebP, lazy load)
   - Responsive images (srcset)

3. **PWA Features**
   - Service worker for offline support
   - Pre-cache critical assets
   - Background sync for check-ins

---

## Compliance & Regulatory

### HIPAA Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Access Control** | RBAC + row-level security |
| **Audit Controls** | All API requests logged |
| **Integrity** | Checksums on encrypted data |
| **Person/Entity Authentication** | JWT + 2FA for providers |
| **Transmission Security** | TLS 1.3 |

### Florida-Specific Requirements

| Requirement | Implementation |
|-------------|----------------|
| **PDMP Check** | E-FORCSE API integration (required before Schedule II-V) |
| **eRx** | Surescripts integration (controlled substances) |
| **Telehealth Consent** | Versioned consent with e-signature |
| **Prescriber Requirements** | NPI + DEA number verification |

### DEA Telemedicine Extension

**Current Status**: Extended through 12/31/2025

**Monitoring**: Automated banner in provider portal updates based on `DEA_TELEMEDICINE_EXTENSION_DATE` env var.

---

## Future Enhancements

1. **Mobile Apps** (React Native)
   - iOS + Android for patients
   - Biometric authentication
   - Push notifications

2. **Advanced Analytics**
   - Provider performance dashboards
   - Patient outcome tracking (PHQ-9, GAD-7 trends)
   - Medication adherence analytics

3. **Telemedicine Expansion**
   - Multi-state licensing support
   - Interstate PDMP queries
   - Compact license verification

4. **AI Enhancements**
   - Voice-to-text transcription (real-time)
   - Automated ICD-10 coding
   - Predictive treatment response modeling

---

**Document Version**: 1.0
**Last Updated**: 2025-10-20
**Maintained By**: Kevin Lazar (Klazar1987@gmail.com)
