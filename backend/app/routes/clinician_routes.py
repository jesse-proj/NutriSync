from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.auth import get_current_user, get_password_hash
from app.database import get_session
from app.models import (
    ClinicalAlerts,
    ClinicalReminder,
    ClinicalReminderCreate,
    ClinicalReminderType,
    ClinicalReminderUpdate,
    DietaryTargets,
    FoodLogs,
    User,
    UserRole,
)
from app.services.ai_summary import generate_nutrition_summary

router = APIRouter(prefix="/clinicians", tags=["Clinicians"])


def get_current_clinician(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.CLINICIAN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as clinician"
        )
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
def get_patients(
    current_user: User = Depends(get_current_clinician),
    session: Session = Depends(get_session),
):
    # For now, return all patients.
    statement = select(User).where(User.role == UserRole.PATIENT)
    patients = session.exec(statement).all()
    return patients


@router.post("/patients", response_model=User, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_data: PatientCreate,
    current_user: User = Depends(get_current_clinician),
    session: Session = Depends(get_session),
):
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
        hashed_password=hashed_pwd,
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
def delete_patient(
    patient_id: int,
    current_user: User = Depends(get_current_clinician),
    session: Session = Depends(get_session),
):
    # Verify patient exists
    patient = session.get(User, patient_id)
    if not patient or patient.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    # Delete related dietary targets
    targets_statement = select(DietaryTargets).where(
        DietaryTargets.patient_id == patient_id
    )
    targets = session.exec(targets_statement).all()
    for target in targets:
        session.delete(target)

    # Delete related food logs
    logs_statement = select(FoodLogs).where(FoodLogs.patient_id == patient_id)
    logs = session.exec(logs_statement).all()
    for log in logs:
        session.delete(log)

    # Delete related clinical alerts
    alerts_statement = select(ClinicalAlerts).where(
        ClinicalAlerts.patient_id == patient_id
    )
    alerts = session.exec(alerts_statement).all()
    for alert in alerts:
        session.delete(alert)

    # Delete patient
    session.delete(patient)
    session.commit()
    return {"success": True}


@router.get("/patients/{patient_id}/targets", response_model=DietaryTargets)
def get_patient_targets(
    patient_id: int,
    current_user: User = Depends(get_current_clinician),
    session: Session = Depends(get_session),
):
    statement = select(DietaryTargets).where(DietaryTargets.patient_id == patient_id)
    targets = session.exec(statement).first()
    if not targets:
        return DietaryTargets(patient_id=patient_id, clinician_id=current_user.id)
    return targets


@router.put("/patients/{patient_id}/targets", response_model=DietaryTargets)
def update_patient_targets(
    patient_id: int,
    targets_update: DietaryTargetsUpdate,
    current_user: User = Depends(get_current_clinician),
    session: Session = Depends(get_session),
):
    # Verify patient exists
    patient = session.get(User, patient_id)
    if not patient or patient.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    statement = select(DietaryTargets).where(DietaryTargets.patient_id == patient_id)
    db_targets = session.exec(statement).first()

    if not db_targets:
        db_targets = DietaryTargets(patient_id=patient_id, clinician_id=current_user.id)
        session.add(db_targets)

    update_data = targets_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_targets, key, value)

    db_targets.updated_at = datetime.now(timezone.utc)
    db_targets.clinician_id = current_user.id

    session.add(db_targets)
    session.commit()
    session.refresh(db_targets)
    return db_targets


@router.get("/patients/{patient_id}/logs", response_model=List[FoodLogs])
def get_patient_logs(
    patient_id: int,
    current_user: User = Depends(get_current_clinician),
    session: Session = Depends(get_session),
):
    # Verify patient exists
    patient = session.get(User, patient_id)
    if not patient or patient.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    statement = (
        select(FoodLogs)
        .where(FoodLogs.patient_id == patient_id)
        .order_by(FoodLogs.logged_at.desc())
    )
    logs = session.exec(statement).all()
    return logs


@router.get("/patients/{patient_id}/summary")
def get_patient_report_summary(
    patient_id: int,
    current_user: User = Depends(get_current_clinician),
    session: Session = Depends(get_session),
):
    # Verify patient exists
    patient = session.get(User, patient_id)
    if not patient or patient.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    statement = (
        select(FoodLogs)
        .where(FoodLogs.patient_id == patient_id)
        .order_by(FoodLogs.logged_at.desc())
        .limit(30)
    )
    logs = session.exec(statement).all()

    summary = generate_nutrition_summary(logs)
    return {"summary": summary}


@router.get("/alerts")
def get_all_alerts(
    current_user: User = Depends(get_current_clinician),
    session: Session = Depends(get_session),
):
    """Return all unresolved alerts enriched with patient names."""
    statement = (
        select(ClinicalAlerts)
        .where(ClinicalAlerts.is_resolved == False)
        .order_by(ClinicalAlerts.created_at.desc())
    )
    alerts = session.exec(statement).all()
    result = []
    for alert in alerts:
        patient = session.get(User, alert.patient_id)
        result.append(
            {
                "id": alert.id,
                "patient_id": alert.patient_id,
                "patient_name": patient.full_name
                if patient
                else f"Patient #{alert.patient_id}",
                "alert_type": alert.alert_type,
                "message": alert.message,
                "is_resolved": alert.is_resolved,
                "created_at": alert.created_at,
            }
        )
    return result


# ── Clinical Reminders ──────────────────────────────────────────────


@router.get("/patients/{patient_id}/reminders")
def get_patient_reminders(
    patient_id: int,
    current_user: User = Depends(get_current_clinician),
    session: Session = Depends(get_session),
):
    statement = (
        select(ClinicalReminder)
        .where(ClinicalReminder.patient_id == patient_id)
        .order_by(ClinicalReminder.created_at.desc())
    )
    return session.exec(statement).all()


@router.post("/patients/{patient_id}/reminders")
def create_reminder(
    patient_id: int,
    data: ClinicalReminderCreate,
    current_user: User = Depends(get_current_clinician),
    session: Session = Depends(get_session),
):
    reminder = ClinicalReminder(
        patient_id=patient_id,
        clinician_id=current_user.id,
        reminder_type=ClinicalReminderType(data.reminder_type),
        title=data.title,
        description=data.description,
        schedule=data.schedule,
    )
    session.add(reminder)
    session.commit()
    session.refresh(reminder)
    return reminder


@router.put("/patients/{patient_id}/reminders/{reminder_id}")
def update_reminder(
    patient_id: int,
    reminder_id: int,
    data: ClinicalReminderUpdate,
    current_user: User = Depends(get_current_clinician),
    session: Session = Depends(get_session),
):
    reminder = session.get(ClinicalReminder, reminder_id)
    if not reminder or reminder.patient_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found"
        )
    update_data = data.dict(exclude_unset=True)
    if "reminder_type" in update_data:
        update_data["reminder_type"] = ClinicalReminderType(
            update_data["reminder_type"]
        )
    for key, value in update_data.items():
        setattr(reminder, key, value)
    reminder.updated_at = datetime.now(timezone.utc)
    session.add(reminder)
    session.commit()
    session.refresh(reminder)
    return reminder


@router.delete("/patients/{patient_id}/reminders/{reminder_id}")
def deactivate_reminder(
    patient_id: int,
    reminder_id: int,
    current_user: User = Depends(get_current_clinician),
    session: Session = Depends(get_session),
):
    reminder = session.get(ClinicalReminder, reminder_id)
    if not reminder or reminder.patient_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found"
        )
    reminder.is_active = False
    reminder.updated_at = datetime.now(timezone.utc)
    session.add(reminder)
    session.commit()
    return {"ok": True}


@router.patch("/alerts/{alert_id}/resolve")
def resolve_alert(
    alert_id: int,
    current_user: User = Depends(get_current_clinician),
    session: Session = Depends(get_session),
):
    """Mark a clinical alert as resolved."""
    alert = session.get(ClinicalAlerts, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found"
        )
    alert.is_resolved = True
    session.add(alert)
    session.commit()
    return {"ok": True}
