# NutriSync RPM — Optimization TODO

## Phase 1: Dead Code Cleanup

- [x] **T1.1** Prune `requirements.txt` to 12 direct deps
- [x] **T1.2** Remove duplicate `select` import in `food_routes.py`
- [x] **T1.3** Remove unused `FoodLogResponse` model from `food_routes.py`
- [x] **T1.4** Remove ChromaDB dead code from `chat_routes.py`
- [x] **T1.5** Remove Google login button from `LoginPage.tsx`
- [x] **T1.6** Remove card tilt effect from `LandingPage.tsx`
- [x] **T1.7** Remove redundant `os.makedirs` from `food_routes.py`
- [x] **T1.8** Delete scratch/test scripts and images

## Phase 2: Merge Duplicates

- [x] **T2.1** Unify login endpoints in `auth_routes.py`
- [x] **T2.2** Extract shared AI summary to `services/ai_summary.py`
- [x] **T2.3** Inline `get_vision_provider` factory

## Phase 3: Correctness Fixes

- [x] **T3.1** Fix deprecated `datetime.utcnow()` in `clinician_routes.py`
- [x] **T3.2** Fix hardcoded avatar URLs
- [x] **T3.3** Fix misleading compliance claim in footer

## Phase 4: Frontend Component Split

- [x] **T4.1** Extract hooks/components from `PatientDashboard.tsx`
- [x] **T4.2** Extract hooks/components from `ClinicianDashboard.tsx`

## Phase 5: Data Hardening

- [x] **T5.1** Wire Goals page to API
- [x] **T5.2** Wire Profile page to user object

## Phase 6: Dependency Audit

- [x] **T6.1** Lazy-load jspdf in Reports page
