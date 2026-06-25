from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from groq import Groq
from pydantic import BaseModel
from sqlmodel import Session, select

from app.auth import get_current_user
from app.config import settings
from app.database import get_session
from app.models import DietaryTargets, FoodLogs, User, UserRole

router = APIRouter(prefix="/chat", tags=["NutriGabay Chatbot"])


def get_current_patient(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as patient"
        )
    return current_user


groq_client = Groq(api_key=settings.GROQ_API_KEY)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@router.post("/", response_model=ChatResponse)
def chat_with_nutrigabay(
    request: ChatRequest,
    current_user: User = Depends(get_current_patient),
    session: Session = Depends(get_session),
):
    # 1. Fetch Patient Dietary Targets
    statement_targets = select(DietaryTargets).where(
        DietaryTargets.patient_id == current_user.id
    )
    targets = session.exec(statement_targets).first()

    # 2. Fetch Recent Food Logs (Today's logs)
    statement_logs = (
        select(FoodLogs)
        .where(FoodLogs.patient_id == current_user.id)
        .order_by(FoodLogs.logged_at.desc())
        .limit(10)
    )
    recent_logs = session.exec(statement_logs).all()

    # Calculate today's consumed macros from recent logs (simplified sum)
    consumed_sodium = sum([log.sodium_mg for log in recent_logs])
    consumed_carbs = sum([log.carbs_g for log in recent_logs])
    consumed_calories = sum([log.calories_kcal for log in recent_logs])

    target_context = ""
    if targets:
        target_context = f"Daily Limits: Sodium: {targets.sodium_mg}mg, Carbs: {targets.carbs_g}g, Calories: {targets.calories_kcal}kcal."
    else:
        target_context = "No specific limits set yet."

    log_context = f"Consumed recently (from last 10 logs): Sodium: {consumed_sodium}mg, Carbs: {consumed_carbs}g, Calories: {consumed_calories}kcal."

    system_prompt = f"""
    You are 'NutriGabay', an empathetic Tagalog/Taglish AI assistant for Filipino patients with diet-related chronic diseases.
    Your goal is to answer their dietary questions based on their specific limits and recent logs.

    Patient Context:
    {target_context}
    {log_context}

    Rules:
    1. Reply in friendly Tagalog or Taglish.
    2. Give specific, practical advice regarding their limits.
    3. If they mention symptoms of a medical emergency (e.g., chest pain, extreme dizziness, severe numbness), IMMEDIATELY tell them to seek emergency medical care and do not give dietary advice.
    4. Keep answers concise.
    """

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": request.message,
                },
            ],
            model="llama-3.3-70b-versatile",
        )
        reply = chat_completion.choices[0].message.content
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API Error: {str(e)}")
