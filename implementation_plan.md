# Implementation Plan – Switch to Groq Vision Model

## Overview
Replace the existing LogMeal image-analysis integration with the Groq vision model **`llama-3.2-11b-vision-preview`**. The Groq model will be accessed using the second Groq API key (`GROQ_API_KEY_TWO`) already present in the project's `.env` file.

---

## Tasks

| T-ID | Phase | Description | Acceptance Criteria |
|------|-------|-------------|---------------------|
| T001 | Prep & Secrets | Update `backend/app/config.py` to add a dedicated `GROQ_VISION_API_KEY` field that reads from `GROQ_API_KEY_TWO` in `.env`. This key is reserved for the vision model (`llama-3.2-11b-vision-preview`), keeping it separate from the existing `GROQ_API_KEY` used by the chatbot. | `settings.GROQ_VISION_API_KEY` returns the value from `GROQ_API_KEY_TWO` in `.env`. |
| T002 | Dependency | Add `groq` to `backend/requirements.txt` and install it. | `groq` appears in `requirements.txt` and `pip install -r requirements.txt` succeeds. |
| T003 | Abstraction Layer | Create `backend/app/services/vision.py` with abstract `VisionProvider` base class and concrete `LogMealVisionProvider` wrapping the existing LogMeal logic. | `VisionProvider` ABC exists with `analyze(image_bytes) -> dict`. `LogMealVisionProvider` implements it using current `food_routes.py` logic. |
| T004 | Groq Provider | Implement `GroqVisionProvider` in `backend/app/services/vision.py` that calls `llama-3.2-11b-vision-preview` via the Groq SDK using `settings.GROQ_VISION_API_KEY` (sourced from `GROQ_API_KEY_TWO`). | Provider returns normalized dict with keys: `segments` (list of `{name, nutritional_info}`). Handles HTTP errors and malformed responses gracefully. |
| T005 | Provider Factory | Add `VISION_PROVIDER` env var (default `logmeal`). Create factory function in `backend/app/services/vision.py` that returns the correct provider based on the flag. | `get_vision_provider()` returns `GroqVisionProvider` when `VISION_PROVIDER=groq`, else `LogMealVisionProvider`. |
| T006 | Route Refactor | Refactor `backend/app/routes/food_routes.py` to use the vision provider abstraction instead of inline LogMeal calls. Extract image compression to a shared utility. | `/food/log-photo` endpoint works with both providers. No direct LogMeal imports in routes. |
| T007 | Frontend Compatibility | Verify the JSON response shape matches what the React frontend expects. Update TypeScript interfaces if needed. | Frontend displays food log results correctly with the Groq provider. |
| T008 | Unit Tests | Write tests for `GroqVisionProvider` (mock Groq client), `LogMealVisionProvider`, and the provider factory. | All tests pass. Coverage for `vision.py` ≥ 80%. |
| T009 | Integration Test | Add test that uploads a sample image and asserts valid response when `VISION_PROVIDER=groq`. | Test passes locally and cleans up test data. |
| T010 | Documentation | Update `README.md` with "Vision Provider" section documenting env vars, provider switching, and Groq model details. | README reflects the new architecture with `.env` examples. |
| T011 | Cleanup | Remove LogMeal-specific code from `food_routes.py` and any orphaned imports or comments. | No LogMeal references remain outside `LogMealVisionProvider`. |

---

## Milestones

| Phase | Tasks | Goal |
|-------|-------|------|
| **Phase 1 – Foundations** | T001–T003 | Secrets wired, SDK installed, abstraction layer created with LogMeal provider |
| **Phase 2 – Groq Integration** | T004–T006 | Groq provider implemented and route refactored to use abstraction |
| **Phase 3 – Validation** | T007–T010 | Frontend verified, tests written, documentation updated |
| **Phase 4 – Cleanup** | T011 | Obsolete LogMeal code removed |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  food_routes.py                      │
│         (calls vision.analyze(image_bytes))          │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              VisionProvider (ABC)                    │
│         analyze(image_bytes) -> dict                 │
├─────────────────────┬───────────────────────────────┤
│ LogMealVisionProvider│    GroqVisionProvider         │
│ (existing logic)     │  (llama-3.2-11b-vision)      │
└─────────────────────┴───────────────────────────────┘
                       ▲
                       │
               get_vision_provider()
              (factory reads VISION_PROVIDER env)
```

---

## Response Schema (Normalized)

Both providers return this shape so the route and frontend stay provider-agnostic:

```python
{
    "segments": [
        {
            "name": "Grilled Chicken",
            "nutritional_info": {
                "calories": 165.0,
                "macronutrients": {
                    "carbohydrates": 0.0,
                    "proteins": 31.0,
                    "fat": 3.6
                },
                "micronutrients": {
                    "sodium": 74.0,
                    "potassium": 256.0
                }
            }
        }
    ]
}
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Groq response format differs from LogMeal | Parsing errors in route | Normalize inside `GroqVisionProvider`; map to the schema above |
| Groq rate limits | Failed requests under load | Add retry with exponential backoff in `GroqVisionProvider` |
| `GROQ_API_KEY_TWO` not set in production | Auth failure | Document requirement in README; add startup validation |
| Groq model returns non-JSON text | Parse failure | Use structured output prompt or regex extraction with fallback |

---

## References

- Groq Python SDK: https://docs.groq.com/python-sdk
- Current config: `backend/app/config.py`
- Current LogMeal integration: `backend/app/routes/food_routes.py`
- `.env` key: `GROQ_API_KEY_TWO`

---

*Created for the CreateConquer project – Groq Vision migration.*