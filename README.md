# NutriSync RPM
## Remote Patient Monitoring through Nutritional Intelligence for the Philippine Health Context

NutriSync RPM is an AI-powered Remote Patient Monitoring platform designed to bridge the gap between hospital discharge and home recovery for Filipino patients with diet-related chronic diseases.

By connecting patients and clinicians directly, the platform makes remote dietary management actionable, collaborative, and culturally intelligent.

### Project Resources
* **[Product Requirement Document (PRD)](file:///c:/Users/Trevor/Documents/CreateConquer/Create-Conquer/PRD.md):** Detailed product specifications, user personas, MoSCoW prioritization, technical architectures, and roadmap.

### Project Structure
* `/frontend`: React + TypeScript application initialized with Vite, Tailwind CSS, and Shadcn UI.
* `/backend`: Python application powered by FastAPI, set up with Uvicorn, SQLAlchemy, and Pydantic.

---

## Vision Provider Configuration

The food image analysis feature supports multiple vision providers. The provider is selected at runtime via the `VISION_PROVIDER` environment variable.

### Available Providers

| Provider | `VISION_PROVIDER` value | Description |
|----------|------------------------|-------------|
| **LogMeal** | `logmeal` (default) | Uses the LogMeal API for food segmentation and nutritional analysis. |
| **Groq** | `groq` (default) | Uses the `meta-llama/llama-4-scout-17b-16e-instruct` model via the Groq SDK. |

### Environment Variables

Add the following to your `.env` file:

```env
# Vision provider selection: "groq" (default) or "logmeal"
VISION_PROVIDER=groq

# Groq API key for the chatbot (existing usage)
GROQ_API_KEY=your-chatbot-key-here

# Groq API key for the vision model (food image analysis)
GROQ_API_KEY_TWO=your-vision-key-here

# LogMeal API key (only needed if VISION_PROVIDER=logmeal)
LOGMEAL_API_KEY=your-logmeal-key-here
```

### How It Works

1. The factory function `get_vision_provider()` in `backend/app/services/vision.py` reads `VISION_PROVIDER` from the environment.
2. Based on the value, it instantiates either `LogMealVisionProvider` or `GroqVisionProvider`.
3. Both providers implement the `VisionProvider` interface and return data in the same normalized schema.
4. The `/food/log-photo` endpoint calls `vision.analyze(image_bytes)` without knowing which provider is active.

### Response Schema

Both providers return a response in this shape:

```json
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

### Switching Providers

To switch from LogMeal to Groq:

1. Set `VISION_PROVIDER=groq` in your `.env` file.
2. Ensure `GROQ_API_KEY_TWO` contains a valid Groq API key.
3. Restart the backend server.

To switch back, set `VISION_PROVIDER=logmeal` or remove the variable (defaults to `logmeal`).

