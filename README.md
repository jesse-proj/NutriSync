# NutriSync RPM
> Remote Patient Monitoring through Nutritional Intelligence for the Philippine Health Context

NutriSync is an AI-powered Remote Patient Monitoring platform designed to bridge the gap between hospital discharge and home recovery for Filipino patients with diet-related chronic diseases.

By connecting patients and clinicians directly, the platform makes remote dietary management actionable, collaborative, and culturally intelligent, specifically tailored for Filipino cuisine (e.g., adobo, sinigang, pancit).

## Key Features

### For Patients
* **Photo-based Meal Logging**: Upload a photo, and the AI identifies the dish and estimates macronutrients.
* **Nutritional Tracking**: Daily goal progress tracking for calories, sodium, carbs, protein, and fat.
* **AI Chatbot ("NutriGabay")**: Context-aware dietary assistant answering questions in Tagalog/Taglish.

### For Clinicians
* **Patient Management**: Patient directory, invite via email, and view compliance status.
* **Dietary Targets**: Set and adjust macro limits for individual patients.
* **Exception-based Alerting**: Automatic alerts for dietary violations, inactivity, or declining trends.
* **Direct Messaging**: Communicate directly with patients via WebSocket chat.

## Tech Stack

* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI
* **Backend**: Python 3, FastAPI, SQLModel, SQLite
* **AI Services**: Groq (Vision & Chat), Edamam (Nutrition analysis)
* **Real-time**: WebSocket (direct chat)

## Project Structure
* `/frontend`: React SPA with patient and clinician dashboards.
* `/backend`: FastAPI REST API handling auth, logs, targets, and AI integrations.

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
python -m venv env
# Windows: env\Scripts\activate | Mac/Linux: source env/bin/activate
pip install -r requirements.txt
python -m app.main
# API runs at http://127.0.0.1:8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

## Environment Variables

Create a `.env` file in the root or inside the `backend` directory.

```env
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///./nutrisync.db
# CORS Allowed Origins (comma-separated list for decoupled frontend)
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Groq API keys
GROQ_API_KEY=your-chatbot-key-here
GROQ_API_KEY_TWO=your-vision-key-here

# Edamam Nutrition API
EDAMAM_APP_ID=your-edamam-app-id-here
EDAMAM_APP_KEY=your-edamam-app-key-here
```

### Project Resources
* **[Application Overview](APP_OVERVIEW.md):** High-level summary of jrchitecture, schemas, and current implementation status.
