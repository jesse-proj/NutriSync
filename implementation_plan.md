# NutriSync RPM — Optimization Implementation Plan

> Derived from ponytail-review + ponytail-audit findings. Ordered by effort-to-impact ratio.
> Each phase is independently shippable. Stop after any phase and the app still works.

---

## Ponytail-Audit Findings (ranked)

`delete:` 132-line `requirements.txt` bloat — 12 direct deps, 130+ transitive/unused lines. Keep only what's imported. [backend/requirements.txt]

`delete:` 5 scratch scripts + 2 test images — `scratch_dns.py`, `scratch_test.py`, `test_groq.py`, `test_edamam.py`, `test_delete_patient.py`, `dummy.jpg`, `test.jpg`. Not imported by app. [backend/]

`delete:` `FoodLogResponse` Pydantic model — defined in `food_routes.py` L19-29, never referenced. [backend/app/routes/food_routes.py]

`delete:` `get_vision_provider()` factory — returns `GroqVisionProvider()` always, `VISION_PROVIDER` env var never read. Inline it. [backend/app/services/vision.py, __init__.py, food_routes.py]

`delete:` `import chromadb` + commented-out client — dead speculative feature. [backend/app/routes/chat_routes.py]

`delete:` Duplicate `from sqlmodel import select` — already imported on line 2. [backend/app/routes/food_routes.py]

`delete:` Google login button — calls `alert('not yet available')`. [frontend/src/screens/LoginPage.tsx]

`delete:` Card tilt mouse-tracking effect — 20 lines of JS fighting CSS. Use `:hover`. [frontend/src/screens/LandingPage.tsx]

`delete:` `os.makedirs("uploads")` per-request — already done at startup. [backend/app/routes/food_routes.py]

`shrink:` AI summary generation duplicated in `patient_routes.py` + `clinician_routes.py`. Extract to `services/ai_summary.py`. ~30 lines → ~20 lines, one source of truth.

`shrink:` `login_json` + `login_form` near-identical. Extract `_authenticate()` helper. ~25 lines saved.

`shrink:` `datetime.utcnow()` deprecated. Replace with `datetime.now(timezone.utc)`. [backend/app/routes/clinician_routes.py]

`yagni:` `PatientDashboard.tsx` (1179 lines) — two chat systems, food upload, water/pill tracking, dashboard stats. Split into hooks + components.

`yagni:` `ClinicianDashboard.tsx` (992 lines) — patient CRUD, targets, AI summary, WebSocket chat, alerts. Split into hooks + components.

`native:` Hardcoded Google CDN avatar URLs in `PatientNavbar.tsx` + `Profile.tsx`. Use initial-based fallback or user-uploaded image.

`native:` Misleading "HIPAA Compliant | DPA 2012 Certified" footer claim — not actually certified. Replace with generic copyright.

`shrink:` `getAlertStyle()` + `getTypeStyle()` in `UrgentTasks.tsx` return icon components + class strings. Replace with lookup map. ~30→15 lines.

`yagni:` `Goals.tsx` hardcoded state (weight, sodium, walking) with no API backing. Wire to real data or show empty state.

`yagni:` `jspdf` + `jspdf-autotable` (~500KB) for one button. Lazy-load the import.

`yagni:` `services/__init__.py` re-exports `get_vision_provider` — will be removed with 2.3.

`net: -200 lines, -130 deps possible.`

---

## Phase 1: Dead Code Cleanup (30 min)

**Goal:** Remove code that does nothing. Zero behavior change.

### 1.1 Prune `requirements.txt`

The codebase directly imports exactly **12 packages**. Everything else in `requirements.txt` is transitive noise from a bloated `pip freeze` export, not a curated dep list.

**Audit method:** Grepped every `.py` file under `backend/app/` and `backend/main.py` for `import` / `from` statements. Only 12 third-party packages are imported.

**Direct imports (keep these):**

| # | Package | Imported by |
|---|---------|------------|
| 1 | `fastapi` | `main.py`, every route module |
| 2 | `uvicorn` | `backend/main.py` |
| 3 | `sqlmodel` | `models.py`, `database.py`, every route |
| 4 | `pydantic` | `config.py`, `models.py`, `nutrition.py`, routes |
| 5 | `pydantic-settings` | `config.py` |
| 6 | `groq` | `vision.py`, `chat_routes.py`, `patient_routes.py`, `clinician_routes.py` |
| 7 | `bcrypt` | `auth.py` |
| 8 | `PyJWT` | `auth.py`, `direct_chat_routes.py` |
| 9 | `requests` | `nutrition.py` |
| 10 | `Pillow` | `vision.py` |
| 11 | `python-multipart` | FastAPI `UploadFile` internals |
| 12 | `email-validator` | via `pydantic.EmailStr` in `auth_routes.py` |

**Confirmed NOT imported anywhere in source code** (sample of the 130+ lines to delete):

- `chromadb` — only in a commented-out block in `chat_routes.py` (Phase 1.4 removes it)
- `langchain-core`, `langchain-protocol`, `langchain-text-splitters`, `langsmith` — zero imports
- `Flask`, `flask-cors`, `Werkzeug`, `Jinja2`, `itsdangerous`, `blinker`, `click` — zero imports
- `kubernetes` — zero imports
- `onnxruntime` — zero imports
- `pytesseract` — zero imports
- `PyMuPDF`, `pylatexenc` — zero imports
- `sentry-sdk` — zero imports
- `opentelemetry-*` (6 packages) — zero imports
- `huggingface_hub`, `tokenizers` — zero imports
- `numpy` — zero imports
- `pybase64`, `PyPika`, `pynvim`, `pytesseract` — zero imports
- `rich`, `typer`, `tenacity`, `tqdm` — zero imports
- `jsonpatch`, `jsonpointer`, `jsonschema`, `mmh3`, `msgpack`, `orjson` — zero imports
- `pyasn1`, `referencing`, `rignore`, `rpds-py`, `shellingham` — zero imports
- `watchfiles`, `websocket-client`, `websockets`, `xxhash`, `zstandard` — transitive of uvicorn/fastapi, not directly imported
- `python-dotenv` — only used in `test_groq.py` (scratch script); the app uses `pydantic-settings` for `.env` loading
- `PyYAML` — zero imports

**Also delete (scratch/test artifacts, not imported by app):**

- `backend/scratch_dns.py`
- `backend/scratch_test.py`
- `backend/test_groq.py`
- `backend/test_edamam.py`
- `backend/test_delete_patient.py`
- `backend/dummy.jpg`
- `backend/test.jpg`

**Result:** `requirements.txt` goes from 144 lines to 12 lines.

### 1.2 Remove duplicate `select` import
- **File:** `backend/app/routes/food_routes.py`
- **Action:** Delete line 10 (`from sqlmodel import select` already on line 2)

### 1.3 Remove unused `FoodLogResponse` model
- **File:** `backend/app/routes/food_routes.py`
- **Action:** Delete lines 19-29 (model defined but never referenced)

### 1.4 Remove ChromaDB dead code
- **File:** `backend/app/routes/chat_routes.py`
- **Action:** Delete lines 22-24 (commented-out chromadb import + client)

### 1.5 Remove Google login button
- **File:** `frontend/src/screens/LoginPage.tsx`
- **Action:** Delete the Google button block (L174-181) and the `GoogleIcon` import

### 1.6 Remove card tilt effect
- **File:** `frontend/src/screens/LandingPage.tsx`
- **Action:** Delete `handleMouseMove`, `handleMouseLeave`, `tiltStyle` state and their usage. Use CSS `:hover` transform instead.

### 1.7 Remove redundant `os.makedirs` call
- **File:** `backend/app/routes/food_routes.py`
- **Action:** Delete line 76 (already done at startup in `main.py` L16)

---

## Phase 2: Merge Duplicates (45 min)

**Goal:** One source of truth for shared logic. No new abstractions.

### 2.1 Unify login endpoints
- **File:** `backend/app/routes/auth_routes.py`
- **Action:** Keep only `login_json`. Add a second route decorator on it:
  ```python
  @router.post("/login", ...)
  @router.post("/token", ...)  # Swagger UI form login
  def login(credentials: JSONLoginRequest | OAuth2PasswordRequestForm = Depends(), ...):
  ```
- Use `Union[JSONLoginRequest, str]` or detect form vs JSON via content-type. Simpler: keep two thin handlers that both call `_authenticate(email, password)`.
- **Result:** ~25 lines saved, one auth path.

### 2.2 Extract shared AI summary
- **File:** Create `backend/app/services/ai_summary.py` (new, ~20 lines)
- **Action:** Move the Groq summary generation from `patient_routes.py` L39-70 and `clinician_routes.py` L145-181 into:
  ```python
  def generate_nutrition_summary(logs: list, groq_client) -> str: ...
  ```
- Both routes call it. No abstraction, just a function.

### 2.3 Inline `get_vision_provider` factory
- **File:** `backend/app/services/vision.py`
- **File:** `backend/app/services/__init__.py`
- **Action:** Delete `get_vision_provider()` from `vision.py`. Update `__init__.py` to only export `GroqVisionProvider` and `EdamamNutritionProvider`. Call site in `food_routes.py` just does `GroqVisionProvider()` directly. The `VISION_PROVIDER` env var is never read — YAGNI until a second provider is actually needed.

---

## Phase 3: Fix Correctivity Issues (15 min)

**Goal:** Correctness bugs found during review. Not over-engineering, just broken.

### 3.1 Fix deprecated `datetime.utcnow()`
- **File:** `backend/app/routes/clinician_routes.py` L126
- **Action:** Replace `datetime.utcnow()` → `datetime.now(timezone.utc)`

### 3.2 Fix hardcoded avatar URLs
- **File:** `frontend/src/components/PatientNavbar.tsx` L71
- **File:** `frontend/src/screens/Profile.tsx` L43
- **Action:** Replace with initial-based fallback avatar or `user.avatar_url` from DB. No external CDN dependency.

### 3.3 Fix misleading compliance claim
- **File:** `frontend/src/components/Footer.tsx` L14
- **Action:** Change `"HIPAA Compliant | DPA 2012 Certified"` → `"© 2026 NutriSync. All rights reserved."`

---

## Phase 4: Frontend Component Split (2 hours)

**Goal:** Break the two monster files into maintainable pieces. No new features.

### 4.1 Extract from `PatientDashboard.tsx` (1179 lines)
- **New file:** `frontend/src/hooks/useDoctorChat.ts` — WebSocket connection, message send/receive, unread count
- **New file:** `frontend/src/components/FoodScanner.tsx` — Upload → analyze → confirm → log flow
- **New file:** `frontend/src/components/DashboardStats.tsx` — Circular progress, macro bars, consumed vs target
- **PatientDashboard.tsx** becomes the shell: imports + renders the above. Target: <200 lines.

### 4.2 Extract from `ClinicianDashboard.tsx` (992 lines)
- **New file:** `frontend/src/hooks/useClinicianChat.ts` — WebSocket for clinician-patient messaging
- **New file:** `frontend/src/components/PatientList.tsx` — Searchable list with unread badges
- **New file:** `frontend/src/components/TargetEditor.tsx` — Edit sodium/carbs/calories/potassium
- **ClinicianDashboard.tsx** becomes the shell. Target: <200 lines.

---

## Phase 5: Data Hardening (30 min)

**Goal:** Replace hardcoded placeholder data with real API-backed state.

### 5.1 Wire Goals page to API
- **File:** `frontend/src/screens/Goals.tsx`
- **Action:** Replace hardcoded `weight`, `sodiumConsumed`, `walkingCompleted` with `useEffect` → `apiFetch('/api/patients/logs?limit=30')` and compute from real data.

### 5.2 Wire Profile page to user object
- **File:** `frontend/src/screens/Profile.tsx`
- **Action:** Replace hardcoded age, location, patient ID with `user.*` from context or a `/api/auth/me` fetch.

---

## Phase 6: Dependency Audit (1 hour, optional)

**Goal:** Evaluate heavy frontend deps.

### 6.1 PDF export
- **Current:** `jspdf` + `jspdf-autotable` (~500KB) for one button
- **Options:**
  - **Keep:** Lazy-load the import (`const { default: jsPDF } = await import('jspdf')`)
  - **Replace:** Server-side endpoint that generates the PDF
  - **Replace:** `window.print()` with a print-specific CSS stylesheet
- **Recommendation:** Lazy-load. One button doesn't justify removing the feature.

---

## Execution Order

```
Phase 1 → Phase 3 → Phase 2 → Phase 5 → Phase 4 → Phase 6 (optional)
   ↓          ↓          ↓          ↓          ↓
 Cleanup   Fixes     Dedup      Real data  Split UI
```

Each phase is a separate commit. Each phase leaves the app fully functional.

---

## What's NOT in this plan

- **No new features.** This is pure maintenance.
- **No testing infrastructure.** The codebase has no test runner configured. Adding tests is a separate initiative.
- **No CI/CD.** Out of scope.
- **No database migrations.** Schema is stable; we're not changing models.
- **No new dependencies.** Everything uses what's already installed.
