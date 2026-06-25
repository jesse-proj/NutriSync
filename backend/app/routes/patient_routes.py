from datetime import datetime, time, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.models import (
    ClinicalAlerts,
    ClinicalReminder,
    DietaryTargets,
    FoodLogs,
    PatientClinicianLink,
    User,
    UserRole,
)
from app.services.ai_summary import generate_nutrition_summary

router = APIRouter(prefix="/patients", tags=["Patients"])


def get_current_patient(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as patient"
        )
    return current_user


@router.get("/targets", response_model=DietaryTargets)
def get_patient_targets(
    current_user: User = Depends(get_current_patient),
    session: Session = Depends(get_session),
):
    statement = select(DietaryTargets).where(
        DietaryTargets.patient_id == current_user.id
    )
    targets = session.exec(statement).first()
    if not targets:
        # Return default targets if none set by clinician
        return DietaryTargets(
            patient_id=current_user.id,
            clinician_id=0,
            sodium_mg=2000,
            carbs_g=250,
            calories_kcal=2000,
            potassium_mg=3500,
            protein_g=120,
            fat_g=70,
        )
    # Fill any null fields with safe defaults
    if targets.sodium_mg is None:
        targets.sodium_mg = 2000
    if targets.carbs_g is None:
        targets.carbs_g = 250
    if targets.calories_kcal is None:
        targets.calories_kcal = 2000
    if targets.potassium_mg is None:
        targets.potassium_mg = 3500
    if targets.protein_g is None:
        targets.protein_g = 120
    if targets.fat_g is None:
        targets.fat_g = 70
    return targets


@router.get("/logs", response_model=List[FoodLogs])
def get_patient_logs(
    request: Request,
    limit: int = 50,
    current_user: User = Depends(get_current_patient),
    session: Session = Depends(get_session),
):
    """Return logs; limit defaults to 50 so the client can do local-date filtering."""
    statement = (
        select(FoodLogs)
        .where(FoodLogs.patient_id == current_user.id)
        .order_by(FoodLogs.logged_at.desc())
        .limit(limit)
    )
    logs = session.exec(statement).all()
    return logs


@router.get("/alerts", response_model=List[ClinicalAlerts])
def get_patient_alerts(
    current_user: User = Depends(get_current_patient),
    session: Session = Depends(get_session),
):
    statement = (
        select(ClinicalAlerts)
        .where(ClinicalAlerts.patient_id == current_user.id)
        .where(ClinicalAlerts.is_resolved == False)
        .order_by(ClinicalAlerts.created_at.desc())
    )
    alerts = session.exec(statement).all()
    return alerts


@router.patch("/alerts/{alert_id}/resolve")
def resolve_patient_alert(
    alert_id: int,
    current_user: User = Depends(get_current_patient),
    session: Session = Depends(get_session),
):
    statement = select(ClinicalAlerts).where(
        ClinicalAlerts.id == alert_id, ClinicalAlerts.patient_id == current_user.id
    )
    alert = session.exec(statement).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found"
        )

    if alert.alert_type.startswith("CLINICIAN_LINK:"):
        clinician_id = int(alert.alert_type.split(":")[1])

        # Link the clinician
        link_stmt = select(PatientClinicianLink).where(
            PatientClinicianLink.patient_id == current_user.id,
            PatientClinicianLink.clinician_id == clinician_id,
        )
        if not session.exec(link_stmt).first():
            new_link = PatientClinicianLink(
                patient_id=current_user.id, clinician_id=clinician_id
            )
            session.add(new_link)

        # Initialize default dietary targets
        target_stmt = select(DietaryTargets).where(
            DietaryTargets.patient_id == current_user.id,
            DietaryTargets.clinician_id == clinician_id,
        )
        if not session.exec(target_stmt).first():
            targets = DietaryTargets(
                patient_id=current_user.id, clinician_id=clinician_id
            )
            session.add(targets)

    alert.is_resolved = True
    session.add(alert)
    session.commit()
    return {"ok": True}


@router.patch("/alerts/{alert_id}/reject")
def reject_patient_alert(
    alert_id: int,
    current_user: User = Depends(get_current_patient),
    session: Session = Depends(get_session),
):
    statement = select(ClinicalAlerts).where(
        ClinicalAlerts.id == alert_id, ClinicalAlerts.patient_id == current_user.id
    )
    alert = session.exec(statement).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found"
        )

    if alert.alert_type.startswith("CLINICIAN_LINK:"):
        clinician_id = int(alert.alert_type.split(":")[1])
        # Unlink the clinician
        link_stmt = select(PatientClinicianLink).where(
            PatientClinicianLink.patient_id == current_user.id,
            PatientClinicianLink.clinician_id == clinician_id,
        )
        link = session.exec(link_stmt).first()
        if link:
            session.delete(link)

        # Delete related dietary targets
        targets_statement = select(DietaryTargets).where(
            DietaryTargets.patient_id == current_user.id,
            DietaryTargets.clinician_id == clinician_id,
        )
        targets = session.exec(targets_statement).all()
        for target in targets:
            session.delete(target)

    alert.is_resolved = True
    session.add(alert)
    session.commit()
    return {"ok": True}


@router.get("/reports/summary")
def get_patient_report_summary(
    limit: int = 30,
    current_user: User = Depends(get_current_patient),
    session: Session = Depends(get_session),
):
    statement = (
        select(FoodLogs)
        .where(FoodLogs.patient_id == current_user.id)
        .order_by(FoodLogs.logged_at.desc())
        .limit(limit)
    )
    logs = session.exec(statement).all()
    summary = generate_nutrition_summary(logs)
    return {"summary": summary}


@router.get("/clinician")
def get_assigned_clinician(
    current_user: User = Depends(get_current_patient),
    session: Session = Depends(get_session),
):
    """Retrieve the profile of the clinician assigned to this patient."""
    statement = select(DietaryTargets).where(
        DietaryTargets.patient_id == current_user.id
    )
    targets = session.exec(statement).first()
    if not targets or not targets.clinician_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No clinician assigned"
        )

    clinician = session.get(User, targets.clinician_id)
    if not clinician:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Clinician not found"
        )
    return {
        "id": clinician.id,
        "full_name": clinician.full_name,
        "email": clinician.email,
    }


@router.get("/reminders")
def get_my_reminders(
    current_user: User = Depends(get_current_patient),
    session: Session = Depends(get_session),
):
    """Get active reminders for the current patient."""
    statement = (
        select(ClinicalReminder)
        .where(
            ClinicalReminder.patient_id == current_user.id,
            ClinicalReminder.is_active == True,
        )
        .order_by(ClinicalReminder.created_at.desc())
    )
    return session.exec(statement).all()
