from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.auth import get_current_user, get_password_hash
from app.database import get_session
from app.models import ClinicalAlerts, DietaryTargets, FoodLogs, User, UserRole, PatientClinicianLink
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


class PatientLinkRequest(BaseModel):
    email: str


@router.get("/patients", response_model=List[User])
def get_patients(
    current_user: User = Depends(get_current_clinician),
    session: Session = Depends(get_session),
):
    # Only return patients linked to this clinician
    statement = select(User).join(
        PatientClinicianLink, User.id == PatientClinicianLink.patient_id
    ).where(
        PatientClinicianLink.clinician_id == current_user.id,
        User.role == UserRole.PATIENT
    )
    patients = session.exec(statement).all()
    return patients


@router.post("/patients", response_model=User, status_code=status.HTTP_201_CREATED)
def link_patient(
    link_data: PatientLinkRequest,
    current_user: User = Depends(get_current_clinician),
    session: Session = Depends(get_session),
):
    # Find patient by email
    statement = select(User).where(User.email == link_data.email, User.role == UserRole.PATIENT)
    patient = session.exec(statement).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient with this email not found.",
        )

    # Check if already linked
    link_stmt = select(PatientClinicianLink).where(
        PatientClinicianLink.patient_id == patient.id,
        PatientClinicianLink.clinician_id == current_user.id
    )
    existing_link = session.exec(link_stmt).first()
    if existing_link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient is already linked to your account.",
        )

    # Check if an invite is already pending
    pending_alert_stmt = select(ClinicalAlerts).where(
        ClinicalAlerts.patient_id == patient.id,
        ClinicalAlerts.alert_type == f"CLINICIAN_LINK:{current_user.id}",
        ClinicalAlerts.is_resolved == False
    )
    if session.exec(pending_alert_stmt).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An invite is already pending for this patient.",
        )

    # Create a notification for the patient
    alert = ClinicalAlerts(
        patient_id=patient.id,
        alert_type=f"CLINICIAN_LINK:{current_user.id}",
        message=f"Clinician {current_user.full_name} is requesting to link to your account."
    )
    session.add(alert)
    session.commit()

    return patient


@router.delete("/patients/{patient_id}")
def unlink_patient(
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

    # Delete the link
    link_stmt = select(PatientClinicianLink).where(
        PatientClinicianLink.patient_id == patient_id,
        PatientClinicianLink.clinician_id == current_user.id
    )
    link = session.exec(link_stmt).first()
    if link:
        session.delete(link)

    # Delete related dietary targets for THIS clinician
    targets_statement = select(DietaryTargets).where(
        DietaryTargets.patient_id == patient_id,
        DietaryTargets.clinician_id == current_user.id
    )
    targets = session.exec(targets_statement).all()
    for target in targets:
        session.delete(target)

    # Create an alert for the patient
    alert = ClinicalAlerts(
        patient_id=patient.id,
        alert_type="CLINICIAN_UNLINK",
        message=f"Clinician {current_user.full_name} has removed you from their dashboard."
    )
    session.add(alert)

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
        .where(~ClinicalAlerts.alert_type.startswith("CLINICIAN_LINK"))
        .where(~ClinicalAlerts.alert_type.startswith("CLINICIAN_UNLINK"))
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
