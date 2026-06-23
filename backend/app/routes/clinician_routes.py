from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_session
from app.models import User, UserRole, DietaryTargets, ClinicalAlerts
from app.auth import get_current_user

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

@router.get("/patients", response_model=List[User])
def get_patients(current_user: User = Depends(get_current_clinician), session: Session = Depends(get_session)):
    # In a real scenario, there would be an assignment table.
    # For now, return all patients.
    statement = select(User).where(User.role == UserRole.PATIENT)
    patients = session.exec(statement).all()
    return patients

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

@router.get("/alerts", response_model=List[ClinicalAlerts])
def get_all_alerts(current_user: User = Depends(get_current_clinician), session: Session = Depends(get_session)):
    # Return all unresolved alerts for patients
    statement = select(ClinicalAlerts).where(ClinicalAlerts.is_resolved == False).order_by(ClinicalAlerts.created_at.desc())
    alerts = session.exec(statement).all()
    return alerts
