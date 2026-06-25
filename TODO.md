# Clinical Macros & Reminders — TODO

## Backend (Steps 1-4) — ✅ DONE

- [x] **T1** Add `FoodLogUpdate` schema + PUT endpoint — REMOVED (no longer needed)
- [x] **T2** Add `ClinicalReminder` model + schemas in `models.py`
- [x] **T3** Add 4 reminder CRUD endpoints in `clinician_routes.py`
- [x] **T4** Add patient reminders GET endpoint in `patient_routes.py`

## Frontend (Steps 5-8)

- [x] **T5** ~~Add macro editing UI~~ — REMOVED per requirements
- [x] **T6** Create `ClinicalReminders.tsx` component
- [x] **T7** Replace hardcoded reminders with dynamic list in PatientDashboard.tsx
- [x] **T8** Wire `<ClinicalReminders>` into ClinicianDashboard.tsx patient detail

## Cleanup Tasks — ✅ DONE

- [x] **T9** Remove macro editing UI from ClinicianDashboard.tsx (edit button + inline form + state + handlers)
- [x] **T10** Remove unused `FoodLogUpdate` schema and PUT endpoint from clinician_routes.py
- [x] **T11** Remove unused imports (Pill, Droplet) from PatientDashboard.tsx
- [x] **T12** Rewrite ClinicianDashboard.tsx to remove all macro editing code cleanly
