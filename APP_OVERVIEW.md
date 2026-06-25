# NutriSync RPM — Application Overview

> Remote Patient Monitoring through Nutritional Intelligence

## What It Is

NutriSync RPM is an AI-powered remote patient monitoring platform for Filipino patients with diet-related chronic diseases. It connects patients and clinicians through photo-based nutritional tracking built for the Philippine health context.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React + TypeScript + Vite + Tailwind + Shadcn)│
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ Patient App  │ │ Clinician App│ │ Shared Components│ │
│  │ - Dashboard  │ │ - Dashboard  │ │ - MealCard       │ │
│  │ - Meal Logs  │ │ - Patients   │ │ - PatientList    │ │
│  │ - Chatbot    │ │ - Targets    │ │ - ClinicalRemind │ │
│  │ - Reports    │ │ - Alerts     │ │ - TargetEditor   │ │
│  └──────────────┘ └──────────────┘ └──────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │ REST API + WebSocket
┌───────────────────────────┴─────────────────────────────┐
│  Backend (Python + FastAPI + SQLModel + SQLite)         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Auth     │ │ Patient  │ │Clinician │ │ Chat       │ │
│  │ Routes   │ │ Routes   │ │ Routes   │ │ Routes     │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
│  ┌──────────────────────────────────────────────────┐   │
│  │ AI Services: Groq Vision + Edamam Nutrition      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI, Lucide icons |
| Backend | Python 3, FastAPI, SQLModel, SQLite |
| AI | Groq (vision + chat), Edamam (nutrition analysis) |
| Auth | JWT (HS256), OAuth2 password flow |
| Real-time | WebSocket (direct chat) |

## User Roles

### Patient
- Photo-based meal logging with Filipino food AI recognition
- Daily goal progress tracking (calories, sodium, carbs, protein, fat)
- AI chatbot ("NutriGabay") for dietary questions in Tagalog/Taglish
- Meal history with macro breakdowns
- Clinical reminders from their clinician

### Clinician
- Patient directory with search
- Link patients via email invitation
- Set and adjust dietary targets (sodium, carbs, calories, potassium, protein, fat)
- View patient food logs and AI summaries
- Exception-based alerts for dietary violations
- Direct messaging with patients

## Key Features

### Meal Logging
- Upload a photo → AI identifies Filipino dishes → estimates macros
- Supports: adobo, sinigang, tapsilog, tuyo, pancit canton, pandesal, etc.
- Saves to daily log with running totals

### Patient Dashboard
- Circular calorie ring + linear progress bars for sodium, carbs, protein, fat
- Sodium warning at 60% of daily limit
- AI chatbot with context from recent logs + clinical limits
- Meal history with expandable macro details

### Clinician Dashboard
- Patient list with compliance status
- Patient detail pane: food logs, targets, AI summary
- Target editor with all 6 macro nutrients
- Exception-based alerting (3 violations/week, 48h inactivity, declining trend)

### Reports
- 7-day compliance bar charts (calories, sodium, carbs)
- AI-generated nutritional summary
- PDF export (data table)

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register (patient or clinician) |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/patients/targets` | Get patient's dietary targets |
| GET | `/api/patients/logs` | Get patient's food logs |
| POST | `/api/patients/logs` | Upload meal photo for analysis |
| GET | `/api/patients/alerts` | Get patient alerts |
| PATCH | `/api/patients/alerts/{id}/resolve` | Accept/reject clinician link |
| GET | `/api/patients/reminders` | Get active reminders |
| GET | `/api/patients/reports/summary` | AI nutritional summary |
| GET | `/api/clinicians/patients` | List linked patients |
| POST | `/api/clinicians/patients` | Link patient (by email) |
| DELETE | `/api/clinicians/patients/{id}` | Unlink patient |
| PUT | `/api/clinicians/patients/{id}/targets` | Set dietary targets |
| GET | `/api/clinicians/patients/{id}/logs` | View patient logs |
| GET | `/api/clinicians/patients/{id}/summary` | AI clinical summary |
| GET | `/api/clinicians/alerts` | Get unresolved alerts |
| WS | `/api/chat/direct/ws` | Direct chat (WebSocket) |

## Database Schema

```
users
├── id, email, full_name, role, hashed_password
├── consent_given (DPA 2012)
├── profession, prc_number, date_of_birth
├── prc_id_image_url, credentials_verified

dietary_targets
├── patient_id, clinician_id
├── sodium_mg, carbs_g, calories_kcal
├── potassium_mg, protein_g, fat_g

food_logs
├── patient_id, image_url, name, description
├── sodium_mg, carbs_g, calories_kcal
├── potassium_mg, protein_g, fat_g, logged_at

patient_clinician_links
├── patient_id, clinician_id, linked_at

clinical_alerts
├── patient_id, alert_type, message
├── is_resolved, created_at

clinical_reminders
├── patient_id, clinician_id, reminder_type
├── title, description, schedule
├── is_active, created_at, updated_at

chat_messages
├── sender_id, receiver_id, message
├── is_read, created_at
```

## Project Structure

```
Create-Conquer/
├── frontend/
│   ├── src/
│   │   ├── api/client.ts          # API client + auth header
│   │   ├── assets/                # Images
│   │   ├── components/            # Shared UI components
│   │   ├── context/AuthContext.tsx
│   │   ├── hooks/                 # Custom hooks (useDoctorChat)
│   │   ├── screens/               # Page-level components
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── PatientDashboard.tsx
│   │   │   ├── ClinicianDashboard.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── ...
│   │   └── lib/utils.ts
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI app + CORS
│   │   ├── config.py              # Settings (env-based)
│   │   ├── database.py            # Engine + migrations
│   │   ├── auth.py                # JWT encode/decode + guards
│   │   ├── models.py              # SQLModel tables
│   │   ├── services/              # AI integrations
│   │   └── routes/                # API route modules
│   └── uploads/                   # Meal photos + PRC IDs
├── PRD.md
└── APP_OVERVIEW.md
```

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m app.main
# API runs at http://127.0.0.1:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | JWT signing key |
| `DATABASE_URL` | Database connection (default: SQLite) |
| `CORS_ORIGINS` | Allowed frontend origins |
| `GROQ_API_KEY` | Groq chat/vision API key |
| `GROQ_API_KEY_TWO` | Groq vision (secondary) |
| `EDAMAM_APP_ID` | Edamam nutrition API ID |
| `EDAMAM_APP_KEY` | Edamam nutrition API key |

## Current Status

### Implemented
- [x] JWT authentication (register/login/me)
- [x] Role-based routing (patient vs clinician)
- [x] Photo-based meal logging with AI nutrition analysis
- [x] Patient dashboard with macro tracking
- [x] Clinician dashboard with patient management
- [x] Dietary target setting (all 6 macros)
- [x] Patient-clinician linking via email
- [x] Clinical alerts (link/unlink, violations)
- [x] Clinical reminders
- [x] Direct messaging (WebSocket)
- [x] AI chatbot (Groq)
- [x] 7-day compliance reports
- [x] PDF export (table only)
- [x] Clinician credential fields (prototype auto-verified)

### Known Gaps
- [ ] Speech-to-text meal logging
- [ ] Manual meal entry fallback
- [ ] Offline caching + sync
- [ ] 30/90-day compliance graphs
- [ ] Inactivity alerts (48h)
- [ ] Gamified badges
- [ ] EHR integration (CHITS, iClinicSys)
- [ ] Profile editing
- [ ] PDF chart images
- [ ] Admin verification portal for clinicians
