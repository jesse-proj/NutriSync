# test_delete_patient.py
from sqlmodel import Session, select
from app.database import engine
from app.models import User, UserRole, DietaryTargets, FoodLogs, ClinicalAlerts

def test_delete():
    with Session(engine) as session:
        # Create a dummy patient
        patient = User(email="temp_delete@test.com", full_name="Temp Delete", role=UserRole.PATIENT, hashed_password="pwd")
        session.add(patient)
        session.commit()
        session.refresh(patient)
        
        patient_id = patient.id
        
        # Add targets, logs, alerts
        target = DietaryTargets(patient_id=patient_id, clinician_id=1)
        log = FoodLogs(patient_id=patient_id, description="apple")
        alert = ClinicalAlerts(patient_id=patient_id, alert_type="TEST", message="Test alert")
        
        session.add(target)
        session.add(log)
        session.add(alert)
        session.commit()
        
        # Simulate delete logic from routes
        # Delete related targets
        for t in session.exec(select(DietaryTargets).where(DietaryTargets.patient_id == patient_id)).all():
            session.delete(t)
        # Delete related logs
        for l in session.exec(select(FoodLogs).where(FoodLogs.patient_id == patient_id)).all():
            session.delete(l)
        # Delete related alerts
        for a in session.exec(select(ClinicalAlerts).where(ClinicalAlerts.patient_id == patient_id)).all():
            session.delete(a)
        # Delete user
        user = session.get(User, patient_id)
        assert user is not None
        session.delete(user)
        session.commit()
        
        # Verify deleted
        assert session.get(User, patient_id) is None
        assert len(session.exec(select(DietaryTargets).where(DietaryTargets.patient_id == patient_id)).all()) == 0
        assert len(session.exec(select(FoodLogs).where(FoodLogs.patient_id == patient_id)).all()) == 0
        assert len(session.exec(select(ClinicalAlerts).where(ClinicalAlerts.patient_id == patient_id)).all()) == 0
        
        print("Delete verification test passed successfully!")

if __name__ == "__main__":
    test_delete()
