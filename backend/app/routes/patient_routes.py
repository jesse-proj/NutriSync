from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from app.database import get_session
from app.models import User, UserRole, DietaryTargets, FoodLogs, ClinicalAlerts
from app.auth import get_current_user
from app.config import settings
from groq import Groq

router = APIRouter(prefix="/patients", tags=["Patients"])

def get_current_patient(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as patient")
    return current_user

@router.get("/targets", response_model=DietaryTargets)
def get_patient_targets(current_user: User = Depends(get_current_patient), session: Session = Depends(get_session)):
    statement = select(DietaryTargets).where(DietaryTargets.patient_id == current_user.id)
    targets = session.exec(statement).first()
    if not targets:
        # Return default targets if none set by clinician
        return DietaryTargets(patient_id=current_user.id, clinician_id=0)
    return targets

@router.get("/logs", response_model=List[FoodLogs])
def get_patient_logs(limit: int = 10, current_user: User = Depends(get_current_patient), session: Session = Depends(get_session)):
    statement = select(FoodLogs).where(FoodLogs.patient_id == current_user.id).order_by(FoodLogs.logged_at.desc()).limit(limit)
    logs = session.exec(statement).all()
    return logs

@router.get("/alerts", response_model=List[ClinicalAlerts])
def get_patient_alerts(current_user: User = Depends(get_current_patient), session: Session = Depends(get_session)):
    statement = select(ClinicalAlerts).where(ClinicalAlerts.patient_id == current_user.id).where(ClinicalAlerts.is_resolved == False).order_by(ClinicalAlerts.created_at.desc())
    alerts = session.exec(statement).all()
    return alerts

@router.get("/reports/summary")
def get_patient_report_summary(limit: int = 30, current_user: User = Depends(get_current_patient), session: Session = Depends(get_session)):
    statement = select(FoodLogs).where(FoodLogs.patient_id == current_user.id).order_by(FoodLogs.logged_at.desc()).limit(limit)
    logs = session.exec(statement).all()
    
    if not logs:
        return {"summary": "No meals logged recently."}
    
    total_calories = round(sum(log.calories_kcal for log in logs), 2)
    total_sodium = round(sum(log.sodium_mg for log in logs), 2)
    
    prompt = f"The patient has logged {len(logs)} meals recently. Total calories: {total_calories} kcal, Total sodium: {total_sodium} mg. Write a concise, 2-3 sentence objective clinical summary of their nutritional habits and goal progression for their doctor to review."
    
    try:
        groq_client = Groq(api_key=settings.GROQ_API_KEY)
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a clinical AI assistant summarizing patient data for a doctor. Keep the response objective, clinical, and very concise (2-3 sentences max).",
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.1-8b-instant",
        )
        summary = chat_completion.choices[0].message.content
        return {"summary": summary}
    except Exception as e:
        return {"summary": "Failed to generate AI summary at this time.", "error": str(e)}
