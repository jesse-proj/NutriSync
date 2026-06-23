# Product Requirement Document (PRD)
## Project Name: NutriSync RPM
### Remote Patient Monitoring through Nutritional Intelligence

---

## 1. Executive Summary & Value Proposition

### 1.1 Elevator Pitch
> [!NOTE]
> **NutriSync RPM** is an AI-powered Remote Patient Monitoring platform that bridges the gap between hospital discharge and home recovery for Filipino patients with diet-related chronic diseases—connecting patients and clinicians through intelligent, photo-based nutritional tracking built specifically for the Philippine health context.

### 1.2 The Problem
In the Philippines, diet-related chronic illnesses (such as cardiovascular diseases, Stage II hypertension, Type 2 diabetes, and Chronic Kidney Disease) are leading causes of mortality. When patients are discharged from hospitals, they are given complex dietary prescriptions (e.g., "low sodium, low potassium, renal diet") which fail in practice due to:
* **Low Nutritional Literacy:** Patients cannot translate abstract metrics (e.g., "2g of sodium") into everyday meals (e.g., *tuyo*, *instant noodles*, *adobo*).
* **Western-Centric Databases:** Existing nutritional tools (MyFitnessPal, Lose It!) fail to recognize traditional Filipino dishes, *carinderia* (local eatery) items, and common street foods.
* **Post-Discharge Support Void:** Clinicians lack visibility into patient compliance between visits, leading to readmissions.

### 1.3 The Solution: A Two-Layer Ecosystem
```mermaid
graph TD
    subgraph Patient Layer
        A[Mobile App: Photo Logger] -->|Sends Meal Photo| B(AI Food & Nutrition Engine)
        C[Tagalog RAG Chatbot "NutriGabay"] <-->|Queries Logs & History| D[(Secure Patient Database)]
    end

    subgraph Clinician Layer
        E[Clinician Dashboard] -->|Sets Dietary Thresholds| D
        D -->|Surfaces Compliance Exceptions| E
    end

    B -->|Saves Nutrition Data| D
```

---

## 2. User Personas

### 2.1 The Patient: Juan dela Cruz
* **Demographics:** 58 years old, lives in a suburban barangay in Cavite. Recently discharged after a mild stroke due to hypertension.
* **Technology Profile:** Uses a budget Android smartphone; relies heavily on Facebook Messenger; prefers Tagalog or Taglish.
* **Pain Points:** 
  * Struggles to understand what he can and cannot eat.
  * Finds calorie-counting and gram-tracking apps extremely frustrating and tedious.
  * Cannot afford expensive clinical grade dietitians.

### 2.2 The Clinician: Dr. Maria Santos
* **Demographics:** Cardiologist at a provincial public hospital. Manages 80+ outpatient cases.
* **Technology Profile:** Uses desktop computers at the clinic and an iPad on rounds.
* **Pain Points:**
  * Has no idea if patients are complying with low-sodium/low-fat instructions until they return in critical condition.
  * Suffers from **alert fatigue**—does not want a system that pings her for minor dietary infractions.
  * Needs a quick, clean summary of nutritional compliance.

---

## 3. Product Features & MoSCoW Prioritization

### 3.1 Patient Experience (Mobile-First Web App)

#### Must Have
* **Photo-Based Meal Logging:** Users log meals by taking or uploading a photo. No manual entry of ingredient weights is required.
* **Filipino Food AI Recognition Engine:** Detects local dishes (*adobo*, *sinigang*, *tapsilog*, *tuyo*, *pancit cantón*, *pandesal*) and estimates portion sizes and nutritional values (calories, sodium, carbs, protein, potassium, fat).
* **Tagalog RAG Chatbot ("NutriGabay"):** A conversational interface that answers questions in Tagalog/Taglish using the patient's:
  1. Logged meal history.
  2. Clinician-defined limits (e.g., sodium cap).
  3. Medical history (e.g., hypertension, CKD).
* **Conversational Guardrails & Escalation Warnings:** Standard warnings when queries require clinical decisions (e.g., "I feel chest pain, what should I eat?" will prompt an immediate instruction to seek emergency care).
* **Daily Goal Progress:** Clean visual gauges showing remaining daily allowance for key clinical targets (e.g., Sodium, Carbs, Calories).

#### Should Have
* **Speech-to-Text Logging:** Allows patients to speak their meal descriptions (e.g., "Kumain ako ng dalawang pirasong pandesal at kape na may asukal") as an alternative to photos.
* **Carinderia & Street Food Estimation:** Fine-tuned estimations for standard street food (*kwek-kwek*, *isaw*) and typical *carinderia* side portions.
* **Offline Caching (`localStorage`):** Leverages browser `localStorage` to cache daily nutritional targets, the last 7 days of historical logs, and to queue pending meal text descriptions/metadata logged while offline. Once connection is restored, the queue is synced back to the server automatically.
* **Manual Log Entry Fallback:** A manual entry form (for dish name, estimated serving) that appears when the Vision AI cannot confidently identify the meal, allowing the patient to still record their food intake.

#### Could Have
* **Gamified Compliance badges:** Earning badges for logging 7 days in a row or staying under the sodium limit.

---

### 3.2 Clinician Dashboard (Web Platform)

#### Must Have
* **Patient Compliance Dashboard:** A high-level overview displaying a list of active patients, their specific diagnoses (Hypertension, Diabetes, CKD), and compliance levels.
* **Threshold Adjustment Control:** Simple controls to remotely set and update daily nutritional targets (e.g., reducing sodium limit from 2,000mg to 1,500mg, or carbs from 200g to 180g).
* **Exception-Based Alerting:** Flags patients who have:
  * Exceeded their clinical targets (e.g., sodium ceiling) three times in a single week.
  * Stopped logging for more than 48 hours.
  * Shown a deteriorating nutritional compliance trend.
* **Historical Compliance Graphs:** Visual trends of sodium, carb, and calorie consumption over 7, 30, and 90 days.

#### Should Have
* **EHR Integration hooks:** Standard APIs to push summaries to electronic health record systems common in the Philippines (e.g., CHITS, iClinicSys).

---

## 4. Technical Architecture & Data Flow

### 4.1 System Components
* **Frontend:** React + TypeScript (Vite) + Tailwind CSS + Shadcn UI. Fully responsive for mobile (Patients) and desktop (Clinicians).
* **Backend:** Python + FastAPI. Fast, modern API framework with automatic OpenAPI documentation.
* **Database:** PostgreSQL (for relational data: users, patient profiles, clinical targets, clinical alerts) + Vector Store (for RAG document chunks like clinical guidelines).
* **AI Core:**
  1. **Vision-to-Nutrition API:** Leverages multimodal LLM capabilities (e.g., Gemini Flash / Vision APIs) to analyze food photos, identify dishes, and extract estimated macronutrient/micronutrient values.
  2. **Tagalog RAG Engine:** Orchestrates patient history, recent logs, clinical limits, and basic nutritional guidelines to generate context-aware, localized answers.

### 4.2 Data Privacy & Compliance (DPA 2012)
Because the platform processes sensitive personal health information (PHI), it must strictly comply with the **Philippine Data Privacy Act of 2012 (RA 10173)**:
* **Consent management:** Explicit opt-in from patients during onboarding.
* **Encryption:** AES-256 encryption for data-at-rest and HTTPS/TLS for data-in-transit.
* **Role-Based Access Control (RBAC):** Clinicians can only see patients registered under their care or clinical department. Patients can only access their own profiles and histories.
* **Audit Logging:** System logs all views and updates of medical history/dietary thresholds.

---

## 5. Key Workflows

### 5.1 Patient Logs a Meal (Happy Path)
1. Patient takes a photo of *Sinigang na Baboy* with rice.
2. The image is uploaded to the backend via secure API.
3. The Vision AI Engine recognizes:
   * 1 serving of Sinigang na Baboy (Estimated: 800mg Sodium, 25g Protein, 12g Fat).
   * 1.5 cups of white rice (Estimated: 67g Carbs, 300 kcal).
4. The system logs these values against the patient's daily limits.
5. The UI updates the remaining sodium, carbohydrate, and calorie gauges.

### 5.2 RAG Chatbot Consultation ("NutriGabay")
1. Patient asks: *"Pwede pa ba ako kumain ng saging?"* (Can I still eat a banana?)
2. The RAG engine fetches:
   * Patient's clinical limits: Stage II CKD (Low Potassium constraint: Max 2000mg/day).
   * Patient's consumed potassium today: 1600mg logged.
   * Nutritional profile of 1 banana: ~400mg potassium.
3. The chatbot synthesizes this: *"Mang Juan, may limitasyon po kayo sa potassium dahil sa inyong sakit sa bato. Naka-1600mg na po kayo ngayon at ang saging ay may dagdag na 400mg. Mas mabuti pong iwasan muna ito ngayon o kumain lamang ng kalahati."*

### 5.3 Clinician Goal Setting
1. Dr. Santos reviews Juan's recent blood test showing elevated HbA1c.
2. From her dashboard, she navigates to Juan's profile.
3. She edits the Carbohydrate Target from 250g to 180g.
4. The backend saves the change and pushes a notification to the patient app.
5. The patient's app immediately displays the updated carbohydrate gauge (180g limit) and updates the RAG engine context.

---

## 6. Implementation Roadmap & Next Steps

```
Phase 1: Foundation (Vite + FastAPI + DB Schema)
   └── Establish API models, user authentication, and schema for clinical limits.

Phase 2: AI Integrations (Vision + Tagalog RAG)
   └── Build the photo nutrition parsing engine and conversational health assistant.

Phase 3: Clinician Dashboard (Patient Monitoring & Configs)
   └── Create the patient compliance monitoring list, threshold editor, and alerting system.

Phase 4: Optimization, Security & EHR Hooks
   └── Implement RBAC, DPA 2012 compliance auditing, and exportable reports.
```

---

## 7. Open Issues & Risks

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Incorrect AI Nutritional Estimates** | High | Visual disclaimer on the patient app; RAG chatbot strictly refuses to diagnose; clinician dashboard indicates values are "AI Estimates". |
| **Low/No Internet in Remote Areas** | Medium | Use browser `localStorage` to cache patient targets, logs, and queue offline entries, syncing them automatically when back in coverage. |
| **Patient Logging Compliance Drop-off** | High | Clinician dashboard surfaces "Silence Alerts" so clinical staff can trigger a phone call follow-up. |
