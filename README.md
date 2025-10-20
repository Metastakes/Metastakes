# NeuroBridge

> HIPAA-compliant, AI-enhanced telepsychiatry and metabolic-health platform

**NeuroBridge** is a world-class platform for training Psychiatric Mental Health Nurse Practitioners (PMHNPs) while improving patient outcomes through AI-guided medication management, structured decision support, and gamified engagement.

---

## 🎯 Core Mission

- **Make mental health and metabolic medicine less confusing** through systematic, evidence-based prescribing
- **Empower providers** to rapidly create personalized medication regimens using patient-specific data
- **Utilize Google Gemini (Vertex AI)** as the internal live-training AI loop
- **Deliver gamified care** for both patients and providers

---

## 🏗️ Architecture

### Monorepo Structure

```
neurobridge/
├── apps/
│   ├── backend/              # NestJS API (primary backend)
│   ├── web-patient/          # Next.js 14 PWA (Patient Portal)
│   ├── web-provider/         # Next.js 14 (Provider Portal)
│   ├── web-mentor/           # Next.js 14 (Mentor Portal)
│   └── web-admin/            # Next.js 14 (Admin Portal)
├── packages/
│   ├── shared/               # Shared TypeScript types & utilities
│   ├── ui/                   # Shared Tailwind component library
│   ├── ai/                   # Vertex AI Gemini integration
│   ├── compliance/           # PDMP, eRx, consent management
│   └── gamification/         # Gamification engine
├── database/                 # PostgreSQL schemas & migrations
└── infrastructure/           # Docker, K8s, Terraform configs
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, PWA |
| **Backend** | NestJS, TypeScript, Node.js 20+ |
| **Database** | PostgreSQL 15+ (encrypted at rest) |
| **Caching** | Redis (sessions, rate limiting) |
| **AI** | Google Vertex AI (Gemini 1.5 Pro/Flash) |
| **Real-time** | Socket.IO (WebSocket) |
| **Deployment** | Docker, Kubernetes, GCP |
| **Monorepo** | Turborepo + pnpm |

---

## 🔒 Compliance & Security

### HIPAA Compliance

✅ **Encryption at Rest**: AES-256-GCM for all PHI
✅ **Encryption in Transit**: TLS 1.3
✅ **Audit Logging**: All API requests logged (7-year retention)
✅ **Access Control**: Role-Based Access Control (RBAC)
✅ **Data Retention**: 7 years (adults), until age 25 (minors)
✅ **BAA Coverage**: All GCP services under Business Associate Agreement

### Florida-Specific Compliance

- **PDMP (E-FORCSE)**: Required before Schedule II-V prescriptions
- **eRx**: Mandatory for controlled substances
- **DEA Telemedicine**: Extension monitoring (currently → 12/31/2025)
- **Telehealth Consent**: Required before first visit

---

## 🏥 Clinical Features

### Medication-Based Psychiatry Visits

- **Duration**: 15–30 min (video)
- **CPT Codes**: 99212–99215 + optional G2211
- **AI Guidance**: Real-time safety alerts, next-question suggestions, empathy scoring
- **SOAP Notes**: AI-assisted clinical documentation
- **Billing**: Automatic CPT code recommendation based on time & MDM

### GLP-1 & Weight Management

- **Medications**: Semaglutide, liraglutide, dulaglutide, tirzepatide
- **Baseline Labs**: BMI, A1c, lipids, renal, thyroid
- **Safety Monitoring**: Pancreatitis, gallbladder, thyroid cancer history
- **Weekly Check-ins**: Weight, side effects, adherence tracking
- **Gamification**: "5% Club" badges, consistency streaks, priority scheduling

---

## 🎮 Gamification System

### For Patients

- **Points**: Earn points for visits, check-ins, streaks, education completion
- **Badges**: Adherence, lifestyle, education, milestone achievements
- **Streaks**: Daily/weekly engagement tracking
- **Rewards**: Faster scheduling, educational content unlocks

### For Providers

- **Empathy Score**: AI-tracked during visits
- **Safety Score**: Compliance with medication safety protocols
- **Documentation Accuracy**: Auto-evaluated against best practices
- **Training Badges**: Mentor-verified skill achievements

### For Mentors

- **Supervision Quality**: Provider improvement metrics
- **AI Alignment Score**: How well mentor labels train the AI

---

## 🤖 AI Integration (Google Gemini)

### Live Training Loop

```
Patient Visit Start
     ↓
Transcript Stream → Gemini API
     ↓
Real-time Suggestions:
  • Safety Alerts (drug interactions, contraindications)
  • Next Question Hints (diagnostic interviewing)
  • Empathy Scoring (therapeutic alliance)
  • CPT/Billing Guidance (time tracking, MDM level)
     ↓
Provider HUD Display
     ↓
Mentor Review & Labeling
     ↓
Nightly Prompt Tuning (fine-tuning dataset)
```

### AI Safety Guardrails

- **Drug Interactions**: Cross-reference current meds + new prescriptions
- **Contraindications**: Allergy checks, medical history validation
- **Dosing Limits**: Max dose warnings
- **PDMP Integration**: Auto-flag controlled substance concerns
- **Psychotherapy Time**: Recommend therapy referral if >10 min psychotherapy discussion

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 20.x or higher
- **pnpm**: 8.x or higher
- **PostgreSQL**: 15.x or higher
- **Redis**: 7.x or higher
- **GCP Account**: With Vertex AI enabled

### Installation

```bash
# Clone repository
git clone https://github.com/Metastakes/Neurobridge-AI-Mental-Health-Platform.git
cd Metastakes

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials
# CRITICAL: Set DATABASE_URL, GCP_PROJECT_ID, ENCRYPTION_KEY, etc.

# Run database migrations
cd database
pnpm run migrate

# Start development servers (all apps)
cd ..
pnpm dev
```

### Development URLs

- **Backend API**: http://localhost:3100
- **API Docs (Swagger)**: http://localhost:3100/api/docs
- **Patient Portal**: http://localhost:3000
- **Provider Portal**: http://localhost:3001
- **Mentor Portal**: http://localhost:3002
- **Admin Portal**: http://localhost:3003

---

## 📦 Package Scripts

```bash
# Development
pnpm dev                  # Start all apps in watch mode
pnpm build                # Build all apps for production
pnpm test                 # Run all tests
pnpm lint                 # Lint all code
pnpm typecheck            # TypeScript type checking

# Database
pnpm db:migrate           # Run migrations
pnpm db:migrate:down      # Rollback migration
pnpm db:seed              # Seed development data
```

---

## 👤 Author

**Kevin Lazar**
📧 Klazar1987@gmail.com
🔗 [@Metastakes](https://github.com/Metastakes)

---

**Built with ❤️ for safer, smarter mental health care.**
