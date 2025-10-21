# NeuroBridge AI - API Contracts

**Version:** 1.0.0
**Base URL:** `https://api.neurobridge.ai` (Production) | `http://localhost:8000` (Development)
**Protocol:** HTTPS (TLS 1.3+)
**Authentication:** JWT Bearer Token

---

## Table of Contents

1. [Authentication](#authentication)
2. [Patients API](#patients-api)
3. [Providers API](#providers-api)
4. [Encounters API](#encounters-api)
5. [SOAP Notes API](#soap-notes-api)
6. [Medications API](#medications-api)
7. [AI Services API](#ai-services-api)
8. [GLP-1 Programs API](#glp-1-programs-api)
9. [Gamification API](#gamification-api)
10. [Messaging API](#messaging-api)
11. [Admin API](#admin-api)
12. [Error Codes](#error-codes)

---

## General Conventions

### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept-Language: en | es
X-Request-ID: <unique-request-id>
```

### Response Format
All API responses follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-10-21T14:30:00Z",
    "version": "1.0.0"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "meta": {
    "timestamp": "2025-10-21T14:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### Pagination
Paginated endpoints accept:
- `page` (default: 1)
- `limit` (default: 20, max: 100)

Response includes:
```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "has_next": true,
  "has_prev": false
}
```

---

## Authentication

### POST `/api/auth/login`
Authenticate user and receive JWT tokens.

**Request:**
```json
{
  "email": "provider@example.com",
  "password": "SecurePass123!",
  "mfa_code": "123456"  // Optional, if MFA enabled
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "token_type": "bearer",
    "expires_in": 900,  // seconds (15 min)
    "user": {
      "id": "usr_abc123",
      "email": "provider@example.com",
      "role": "provider",
      "status": "active"
    }
  }
}
```

**Errors:**
- `401 UNAUTHORIZED` - Invalid credentials
- `403 FORBIDDEN` - Account suspended
- `428 PRECONDITION_REQUIRED` - MFA code required

---

### POST `/api/auth/refresh`
Refresh expired access token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "expires_in": 900
  }
}
```

---

### POST `/api/auth/logout`
Invalidate current session.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## Patients API

### GET `/api/patients/me`
Get authenticated patient's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "pat_abc123",
    "user_id": "usr_xyz789",
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-01-15",
    "phone": "+15551234567",
    "language_preference": "en",
    "timezone": "America/New_York",
    "address": {
      "line1": "123 Main St",
      "line2": "Apt 4B",
      "city": "Miami",
      "state": "FL",
      "zip_code": "33101"
    },
    "gamification": {
      "points": 1250,
      "current_streak_days": 12,
      "longest_streak_days": 45
    },
    "insurance": {
      "payer": "Florida Blue",
      "member_id": "FB123456789",
      "group_number": "GRP001"
    }
  }
}
```

---

### PATCH `/api/patients/me`
Update patient profile (limited fields).

**Request:**
```json
{
  "phone": "+15559876543",
  "language_preference": "es",
  "address": {
    "line1": "456 Oak Ave",
    "city": "Tampa",
    "state": "FL",
    "zip_code": "33602"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "pat_abc123",
    "updated_at": "2025-10-21T14:35:00Z"
  }
}
```

---

### POST `/api/patients/check-in`
Submit daily check-in (PHQ-9, GAD-7, custom scales).

**Request:**
```json
{
  "phq9_score": 8,
  "gad7_score": 12,
  "mood_rating": 6,
  "energy_rating": 5,
  "sleep_quality": "fair",
  "medication_adherence": true,
  "side_effects": "Mild headache in morning",
  "notes": "Feeling better this week"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "streak_id": "str_def456",
    "points_earned": 10,
    "new_total_points": 1260,
    "current_streak_days": 13,
    "badge_earned": {
      "code": "week_streak",
      "name": "7-Day Streak",
      "points_value": 50
    }
  }
}
```

---

### GET `/api/patients/badges`
Get patient's earned badges.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "badges": [
      {
        "id": "bdg_001",
        "code": "first_checkin",
        "name": "First Check-In",
        "description": "Completed your first daily check-in",
        "icon_url": "https://cdn.neurobridge.ai/badges/first_checkin.svg",
        "earned_at": "2025-09-01T10:00:00Z"
      },
      {
        "id": "bdg_002",
        "code": "week_streak",
        "name": "7-Day Streak",
        "earned_at": "2025-09-08T08:30:00Z"
      }
    ],
    "total_badges": 2,
    "total_points": 60
  }
}
```

---

## Providers API

### GET `/api/providers/me`
Get authenticated provider's profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "prv_abc123",
    "user_id": "usr_xyz789",
    "first_name": "Sarah",
    "last_name": "Johnson",
    "credentials": "PMHNP-BC",
    "npi": "1234567890",
    "dea_number": "FJ1234567",
    "dea_expiration_date": "2026-03-15",
    "specialty": "Psychiatric Mental Health",
    "is_mentor": false,
    "requires_supervision": true,
    "supervisor": {
      "id": "prv_mentor01",
      "name": "Dr. Emily Chen, PMHNP-BC"
    },
    "performance": {
      "safety_score": 92.5,
      "empathy_score": 88.3,
      "documentation_score": 95.1
    },
    "gamification_points": 3450
  }
}
```

---

### GET `/api/providers/schedule`
Get provider's schedule for specified date range.

**Query Params:**
- `start_date` (required): ISO date (e.g., `2025-10-21`)
- `end_date` (required): ISO date

**Response (200):**
```json
{
  "success": true,
  "data": {
    "encounters": [
      {
        "id": "enc_001",
        "patient_id": "pat_abc123",
        "patient_name": "John D.",  // Last name initial for privacy
        "encounter_type": "follow_up",
        "status": "scheduled",
        "scheduled_start": "2025-10-21T09:00:00Z",
        "scheduled_end": "2025-10-21T09:30:00Z",
        "google_meet_link": "https://meet.google.com/abc-defg-hij",
        "chief_complaint": "Medication follow-up"
      }
    ]
  }
}
```

---

### GET `/api/providers/patients/:patient_id`
Get detailed patient information (for assigned patients only).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "patient": {
      "id": "pat_abc123",
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "1990-01-15",
      "age": 35
    },
    "clinical_profile": {
      "chief_complaint": "Depression and anxiety",
      "psychiatric_history": "...",
      "allergies": "Penicillin",
      "suicide_risk_level": "low"
    },
    "active_diagnoses": [
      {
        "icd10_code": "F33.1",
        "description": "Major depressive disorder, recurrent, moderate",
        "diagnosed_at": "2024-05-12T00:00:00Z"
      }
    ],
    "active_medications": [
      {
        "medication_name": "Sertraline",
        "dosage": "100mg",
        "frequency": "Once daily",
        "prescribed_at": "2024-05-12T00:00:00Z"
      }
    ],
    "recent_encounters": [...]
  }
}
```

---

## Encounters API

### POST `/api/encounters`
Book new appointment.

**Request:**
```json
{
  "patient_id": "pat_abc123",
  "provider_id": "prv_xyz789",
  "encounter_type": "follow_up",
  "scheduled_start": "2025-10-25T14:00:00Z",
  "scheduled_end": "2025-10-25T14:30:00Z",
  "chief_complaint": "Medication adjustment needed"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "enc_new123",
    "status": "scheduled",
    "google_meet_link": "https://meet.google.com/xyz-abcd-efg",
    "google_calendar_event_id": "evt_calendar123",
    "confirmation_sent": true
  }
}
```

---

### POST `/api/encounters/:id/start`
Mark encounter as started (begins transcript capture if enabled).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "enc_001",
    "status": "in_progress",
    "actual_start": "2025-10-21T09:02:30Z",
    "transcript_session_id": "ts_abc123"
  }
}
```

---

### POST `/api/encounters/:id/end`
Mark encounter as completed.

**Request:**
```json
{
  "duration_minutes": 25
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "enc_001",
    "status": "completed",
    "actual_end": "2025-10-21T09:27:30Z",
    "duration_minutes": 25,
    "ai_analysis_pending": true
  }
}
```

---

### PATCH `/api/encounters/:id/cancel`
Cancel scheduled encounter.

**Request:**
```json
{
  "cancellation_reason": "Patient conflict",
  "late_cancel": false
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "enc_001",
    "status": "cancelled",
    "late_cancel_fee_applied": false
  }
}
```

---

## SOAP Notes API

### POST `/api/soap-notes`
Create new SOAP note for encounter.

**Request:**
```json
{
  "encounter_id": "enc_001",
  "subjective": "Patient reports improved mood...",
  "objective": "Calm, cooperative, good eye contact...",
  "assessment": "Major depressive disorder, recurrent, moderate (F33.1)...",
  "plan": "Continue sertraline 100mg daily. Follow up in 4 weeks...",
  "icd10_codes": ["F33.1", "F41.1"],
  "cpt_codes": ["99214"],
  "modifiers": ["95"],
  "time_spent_minutes": 25,
  "mdm_level": "moderate"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "note_abc123",
    "status": "draft",
    "billing_code": "99214",
    "estimated_reimbursement_cents": 11000,
    "requires_supervisor_review": true
  }
}
```

---

### GET `/api/soap-notes/:id`
Get SOAP note details.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "note_abc123",
    "encounter_id": "enc_001",
    "subjective": "...",
    "objective": "...",
    "assessment": "...",
    "plan": "...",
    "status": "approved",
    "cpt_codes": ["99214"],
    "icd10_codes": ["F33.1"],
    "time_spent_minutes": 25,
    "reviewed_by": {
      "id": "prv_mentor01",
      "name": "Dr. Emily Chen",
      "reviewed_at": "2025-10-21T10:15:00Z"
    },
    "finalized_at": "2025-10-21T10:20:00Z"
  }
}
```

---

### PATCH `/api/soap-notes/:id/amend`
Amend finalized note (mentor only).

**Request:**
```json
{
  "amendment_reason": "Clarify medication dosage",
  "assessment": "Updated assessment text...",
  "plan": "Updated plan text..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "note_abc123",
    "status": "amended",
    "amended_by": "prv_mentor01",
    "amendment_reason": "Clarify medication dosage"
  }
}
```

---

## Medications API

### POST `/api/medications`
Prescribe new medication.

**Request:**
```json
{
  "patient_id": "pat_abc123",
  "medication_name": "Bupropion XL",
  "generic_name": "Bupropion",
  "dosage": "150mg",
  "frequency": "Once daily in morning",
  "route": "PO",
  "quantity": 30,
  "refills": 2,
  "is_controlled_substance": false,
  "pharmacy_name": "CVS Pharmacy #1234",
  "notes": "Take with food if stomach upset occurs"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "med_abc123",
    "status": "active",
    "prescribed_at": "2025-10-21T09:15:00Z",
    "pdmp_check_required": false,
    "interaction_warnings": [
      "May lower seizure threshold - verify no seizure history"
    ],
    "erx_status": "pending"  // Future: sent to pharmacy
  }
}
```

**Errors:**
- `409 CONFLICT` - Contraindication detected (e.g., allergy)
- `428 PRECONDITION_REQUIRED` - PDMP check required for controlled substance

---

### PATCH `/api/medications/:id/discontinue`
Discontinue active medication.

**Request:**
```json
{
  "discontinuation_reason": "Side effects (nausea)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "med_abc123",
    "status": "discontinued",
    "discontinued_at": "2025-10-21T09:20:00Z"
  }
}
```

---

### GET `/api/medications/interactions`
Check drug interactions for proposed medication.

**Query Params:**
- `patient_id` (required)
- `new_medication` (required): Medication name

**Response (200):**
```json
{
  "success": true,
  "data": {
    "safe": false,
    "interactions": [
      {
        "severity": "major",
        "existing_medication": "Phenelzine",
        "interaction": "MAOIs + Bupropion = increased seizure risk",
        "recommendation": "Contraindicated. Do not prescribe together."
      }
    ],
    "contraindications": [
      {
        "type": "allergy",
        "allergen": "Bupropion",
        "reaction": "Rash"
      }
    ]
  }
}
```

---

## AI Services API

### POST `/api/ai/analyze-transcript`
Analyze encounter transcript with Gemini AI.

**Request:**
```json
{
  "encounter_id": "enc_001",
  "transcript_text": "Provider: How have you been feeling?..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transcript_id": "ts_abc123",
    "ai_analysis": {
      "safety_score": 85,
      "empathy_score": 78,
      "documentation_quality_score": 92,
      "red_flags": [
        "Patient mentioned suicidal ideation - ensure safety plan documented"
      ],
      "suggestions": [
        "Consider asking about plan/intent/means",
        "Review previous safety plan from 2024-08-15"
      ],
      "medication_concerns": [],
      "documentation_hints": [
        "Document suicide risk assessment in detail for billing compliance"
      ]
    }
  }
}
```

---

### GET `/api/ai/suggestions/:encounter_id`
Get real-time AI suggestions during encounter.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "type": "clinical",
        "priority": "high",
        "message": "Patient mentioned sleep issues - consider PHQ-9 question 3 score"
      },
      {
        "type": "documentation",
        "priority": "medium",
        "message": "Current conversation suggests moderate MDM level (99214)"
      }
    ],
    "updated_at": "2025-10-21T09:10:00Z"
  }
}
```

---

## GLP-1 Programs API

### POST `/api/glp1-programs`
Enroll patient in GLP-1 program.

**Request:**
```json
{
  "patient_id": "pat_abc123",
  "agent": "semaglutide",
  "baseline_weight": 220.5,
  "baseline_bmi": 32.4,
  "baseline_a1c": 6.2,
  "target_weight": 180.0,
  "contraindications_checked": true,
  "thyroid_history": "No personal or family history of medullary thyroid carcinoma",
  "pancreatitis_history": false,
  "gallbladder_issues": false,
  "renal_function_baseline": "Normal (eGFR 90+)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "glp1_abc123",
    "status": "baseline",
    "start_date": "2025-10-21",
    "titration_schedule": {
      "week_1_4": "0.25mg weekly",
      "week_5_8": "0.5mg weekly",
      "week_9_plus": "1.0mg weekly (maintenance)"
    }
  }
}
```

---

### POST `/api/glp1-programs/:id/progress`
Log weekly progress check-in.

**Request:**
```json
{
  "check_in_date": "2025-10-28",
  "weight": 217.2,
  "side_effects": "Mild nausea after injection, resolved within 2 hours",
  "adherence_rating": 9,
  "mood_rating": 8,
  "energy_rating": 7,
  "notes": "Feeling great! No major side effects."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "progress_id": "prg_xyz789",
    "weight_change": -3.3,
    "bmi": 31.9,
    "total_weight_lost": 3.3,
    "points_earned": 25,
    "badge_earned": {
      "code": "glp1_starter",
      "name": "GLP-1 Journey Begins"
    }
  }
}
```

---

## Gamification API

### GET `/api/gamification/leaderboard`
Get regional leaderboard (anonymized).

**Query Params:**
- `category`: `patient` | `provider`
- `region`: State code (e.g., `FL`)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "display_name": "Patient FL-001",  // Anonymized
        "points": 5420,
        "streak_days": 87
      },
      {
        "rank": 2,
        "display_name": "Patient FL-002",
        "points": 4850,
        "streak_days": 62
      }
    ],
    "your_rank": 15,
    "your_points": 1260
  }
}
```

---

## Messaging API

### POST `/api/messages`
Send secure message.

**Request:**
```json
{
  "recipient_id": "usr_provider123",
  "message_text": "Question about my medication timing",
  "conversation_id": "conv_abc123"  // Optional, for threading
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "msg_xyz789",
    "conversation_id": "conv_abc123",
    "sent_at": "2025-10-21T09:30:00Z",
    "is_encrypted": true
  }
}
```

---

### GET `/api/messages`
Get message inbox.

**Query Params:**
- `conversation_id`: Filter by conversation (optional)
- `unread_only`: Boolean (optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_001",
        "sender": {
          "id": "usr_provider123",
          "name": "Dr. Sarah Johnson"
        },
        "message_text": "You can take it in the morning with breakfast",
        "is_read": false,
        "created_at": "2025-10-21T09:35:00Z"
      }
    ],
    "unread_count": 1
  }
}
```

---

## Admin API

### GET `/api/admin/users`
List all users (admin only).

**Query Params:**
- `role`: Filter by user role
- `status`: Filter by status
- `page`, `limit`: Pagination

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "usr_001",
        "email": "patient@example.com",
        "role": "patient",
        "status": "active",
        "last_login_at": "2025-10-21T08:00:00Z"
      }
    ],
    "total": 1543,
    "page": 1,
    "limit": 20
  }
}
```

---

### PATCH `/api/admin/users/:id/status`
Lock/unlock user account.

**Request:**
```json
{
  "status": "suspended",
  "reason": "Non-payment"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "usr_001",
    "status": "suspended",
    "updated_at": "2025-10-21T10:00:00Z"
  }
}
```

---

### GET `/api/admin/audit-logs`
Query audit logs.

**Query Params:**
- `user_id`: Filter by user
- `action`: Filter by action type
- `resource_type`: Filter by resource
- `start_date`, `end_date`: Date range
- `page`, `limit`: Pagination

**Response (200):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "audit_001",
        "user_id": "usr_provider123",
        "user_role": "provider",
        "action": "patient_viewed",
        "resource_type": "patient",
        "resource_id": "pat_abc123",
        "timestamp": "2025-10-21T09:00:00Z",
        "ip_address": "192.168.1.1"
      }
    ],
    "total": 5420,
    "page": 1
  }
}
```

---

### PATCH `/api/admin/settings/:key`
Update system setting.

**Request:**
```json
{
  "setting_value": {
    "enabled": true,
    "max_duration": 60
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "setting_key": "max_encounter_duration_minutes",
    "setting_value": 60,
    "updated_at": "2025-10-21T10:05:00Z"
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., contraindication) |
| `PRECONDITION_REQUIRED` | 428 | Missing required check (e.g., PDMP) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Temporary outage |

### Example Error Response:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "dosage",
      "issue": "Dosage must be a positive number"
    }
  },
  "meta": {
    "timestamp": "2025-10-21T10:10:00Z",
    "request_id": "req_abc123"
  }
}
```

---

## Rate Limits

| Endpoint Category | Rate Limit |
|-------------------|------------|
| Authentication | 5 req/min |
| Read Operations | 100 req/min |
| Write Operations | 30 req/min |
| AI Analysis | 10 req/min |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634828400
```

---

## WebSocket Events

### Connection URL
`wss://api.neurobridge.ai/ws?token=<jwt_token>`

### Event Types

**Transcript Chunk (Real-time during encounter):**
```json
{
  "type": "transcript_chunk",
  "payload": {
    "encounter_id": "enc_001",
    "speaker": "provider",
    "text": "How have you been feeling this week?",
    "timestamp": "2025-10-21T09:05:30Z"
  }
}
```

**AI Suggestion (During encounter):**
```json
{
  "type": "ai_suggestion",
  "payload": {
    "encounter_id": "enc_001",
    "priority": "high",
    "message": "Patient mentioned SI - ensure safety assessment",
    "timestamp": "2025-10-21T09:06:00Z"
  }
}
```

**New Message:**
```json
{
  "type": "new_message",
  "payload": {
    "message_id": "msg_xyz789",
    "sender_id": "usr_provider123",
    "sender_name": "Dr. Johnson",
    "preview": "You can take it in the morning...",
    "timestamp": "2025-10-21T09:35:00Z"
  }
}
```

**Badge Earned:**
```json
{
  "type": "badge_earned",
  "payload": {
    "badge": {
      "code": "week_streak",
      "name": "7-Day Streak",
      "icon_url": "https://cdn.neurobridge.ai/badges/week_streak.svg"
    },
    "points_earned": 50,
    "timestamp": "2025-10-21T08:00:00Z"
  }
}
```

---

## HIPAA Compliance Notes

1. **Audit Logging**: All PHI access is logged in `audit_logs` table
2. **Encryption**: All data encrypted in transit (TLS 1.3) and at rest (AES-256)
3. **Session Timeout**: 15 minutes of inactivity auto-logs out
4. **MFA**: Required for providers, mentors, and admins
5. **IP Logging**: All requests logged with IP for security audits
6. **Access Control**: Row-Level Security enforced at database level

---

**Document Status**: Foundation Complete
**Next Steps**: Implement authentication service, then patient/provider routers
**Maintainer**: Kevin Lazar / NeuroBridge AI Team
