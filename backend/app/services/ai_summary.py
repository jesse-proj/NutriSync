"""Shared AI summary generation for patient nutrition data."""

from collections.abc import Sequence

from groq import Groq

from app.config import settings
from app.models import FoodLogs


def generate_nutrition_summary(logs: Sequence[FoodLogs]) -> str:
    """Generate a concise clinical summary from food logs using Groq."""
    if not logs:
        return "No meals logged recently."

    total_calories = round(sum(log.calories_kcal for log in logs), 2)
    total_sodium = round(sum(log.sodium_mg for log in logs), 2)

    prompt = (
        f"The patient has logged {len(logs)} meals recently. "
        f"Total calories: {total_calories} kcal, Total sodium: {total_sodium} mg. "
        "Write a concise, 2-3 sentence objective clinical summary of their "
        "nutritional habits and goal progression for their doctor to review."
    )

    try:
        groq_client = Groq(api_key=settings.GROQ_API_KEY)
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a clinical AI assistant summarizing patient data "
                        "for a doctor. Keep the response objective, clinical, and "
                        "very concise (2-3 sentences max)."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            model="llama-3.1-8b-instant",
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Failed to generate AI summary at this time. Error: {str(e)}"
