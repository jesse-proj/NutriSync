from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from app.database import get_session
from app.models import User, UserRole, DietaryTargets, FoodLogs, ClinicalAlerts
from app.auth import get_current_user

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
