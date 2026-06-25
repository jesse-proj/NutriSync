from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from groq import Groq

from app.database import get_session
from app.models import User, UserRole, DietaryTargets, ClinicalAlerts, FoodLogs
from app.auth import get_current_user, get_password_hash
from app.config import settings

router = APIRouter(prefix="/clinicians", tags=["Clinicians"])

def get_current_clinician(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.CLINICIAN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as clinician")
    return current_user

class DietaryTargetsUpdate(BaseModel):
    sodium_mg: Optional[float] = None
    carbs_g: Optional[float] = None
    calories_kcal: Optional[float] = None
    potassium_mg: Optional[float] = None

class PatientCreate(BaseModel):
    email: str
    full_name: str
    password: str
    consent_given: bool = True

@router.get("/patients", response_model=List[User])
def get_patients(current_user: User = Depends(get_current_clinician), session: Session = Depends(get_session)):
    # For now, return all patients.
    statement = select(User).where(User.role == UserRole.PATIENT)
    patients = session.exec(statement).all()
    return patients

@router.post("/patients", response_model=User, status_code=status.HTTP_201_CREATED)
def create_patient(patient_data: PatientCreate, current_user: User = Depends(get_current_clinician), session: Session = Depends(get_session)):
    # Check if email already registered
    statement = select(User).where(User.email == patient_data.email)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # Create the patient
    hashed_pwd = get_password_hash(patient_data.password)
    new_patient = User(
        email=patient_data.email,
        full_name=patient_data.full_name,
        role=UserRole.PATIENT,
        consent_given=patient_data.consent_given,
        hashed_password=hashed_pwd
    )
    session.add(new_patient)
    session.commit()
    session.refresh(new_patient)

    # Initialize default dietary targets linked to this clinician
    targets = DietaryTargets(patient_id=new_patient.id, clinician_id=current_user.id)
    session.add(targets)
    session.commit()

    return new_patient

@router.delete("/patients/{patient_id}")
def delete_patient(patient_id: int, current_user: User = Depends(get_current_clinician), session: Session = Depends(get_session)):
    # Verify patient exists
    patient = session.get(User, patient_id)
    if not patient or patient.role != UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    # Delete related dietary targets
    targets_statement = select(DietaryTargets).where(DietaryTargets.patient_id == patient_id)
    targets = session.exec(targets_statement).all()
    for target in targets:
        session.delete(target)

    # Delete related food logs
    logs_statement = select(FoodLogs).where(FoodLogs.patient_id == patient_id)
    logs = session.exec(logs_statement).all()
    for log in logs:
        session.delete(log)

    # Delete related clinical alerts
    alerts_statement = select(ClinicalAlerts).where(ClinicalAlerts.patient_id == patient_id)
    alerts = session.exec(alerts_statement).all()
    for alert in alerts:
        session.delete(alert)

    # Delete patient
    session.delete(patient)
    session.commit()
    return {"success": True}

@router.get("/patients/{patient_id}/targets", response_model=DietaryTargets)
def get_patient_targets(patient_id: int, current_user: User = Depends(get_current_clinician), session: Session = Depends(get_session)):
    statement = select(DietaryTargets).where(DietaryTargets.patient_id == patient_id)
    targets = session.exec(statement).first()
    if not targets:
        return DietaryTargets(patient_id=patient_id, clinician_id=current_user.id)
    return targets

@router.put("/patients/{patient_id}/targets", response_model=DietaryTargets)
def update_patient_targets(patient_id: int, targets_update: DietaryTargetsUpdate, current_user: User = Depends(get_current_clinician), session: Session = Depends(get_session)):
    # Verify patient exists
    patient = session.get(User, patient_id)
    if not patient or patient.role != UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    statement = select(DietaryTargets).where(DietaryTargets.patient_id == patient_id)
    db_targets = session.exec(statement).first()
    
    if not db_targets:
        db_targets = DietaryTargets(patient_id=patient_id, clinician_id=current_user.id)
        session.add(db_targets)
    
    update_data = targets_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_targets, key, value)
        
    db_targets.updated_at = datetime.utcnow()
    db_targets.clinician_id = current_user.id
    
    session.add(db_targets)
    session.commit()
    session.refresh(db_targets)
    return db_targets

@router.get("/patients/{patient_id}/logs", response_model=List[FoodLogs])
def get_patient_logs(patient_id: int, current_user: User = Depends(get_current_clinician), session: Session = Depends(get_session)):
    # Verify patient exists
    patient = session.get(User, patient_id)
    if not patient or patient.role != UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    statement = select(FoodLogs).where(FoodLogs.patient_id == patient_id).order_by(FoodLogs.logged_at.desc())
    logs = session.exec(statement).all()
    return logs

@router.get("/patients/{patient_id}/summary")
def get_patient_report_summary(patient_id: int, current_user: User = Depends(get_current_clinician), session: Session = Depends(get_session)):
    # Verify patient exists
    patient = session.get(User, patient_id)
    if not patient or patient.role != UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    statement = select(FoodLogs).where(FoodLogs.patient_id == patient_id).order_by(FoodLogs.logged_at.desc()).limit(30)
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

@router.get("/alerts", response_model=List[ClinicalAlerts])
def get_all_alerts(current_user: User = Depends(get_current_clinician), session: Session = Depends(get_session)):
    # Return all unresolved alerts for patients
    statement = select(ClinicalAlerts).where(ClinicalAlerts.is_resolved == False).order_by(ClinicalAlerts.created_at.desc())
    alerts = session.exec(statement).all()
    return alerts
