from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session, select
from pydantic import BaseModel

from app.database import get_session
from app.models import User, UserRole, FoodLogs, DietaryTargets, ClinicalAlerts
from app.auth import get_current_user
from app.services.vision import get_vision_provider
from app.services.nutrition import EdamamNutritionProvider
from sqlmodel import select
from datetime import datetime, time, timezone
router = APIRouter(prefix="/food", tags=["Food Logs"])

def get_current_patient(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as patient")
    return current_user

class FoodLogResponse(BaseModel):
    id: int
    name: str
    description: str
    sodium_mg: float
    carbs_g: float
    calories_kcal: float
    potassium_mg: float
    protein_g: float
    fat_g: float

from typing import Optional
import os
import uuid

class FoodAnalysisResponse(BaseModel):
    name: str
    description: str
    sodium_mg: float
    carbs_g: float
    calories_kcal: float
    potassium_mg: float
    protein_g: float
    fat_g: float
    image_url: Optional[str] = None

@router.post("/analyze-photo", response_model=FoodAnalysisResponse)
async def analyze_food_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_patient)
):
    """Analyze food photo, save it to disk, and return nutritional breakdown"""
    # Read the uploaded image
    file_bytes = await file.read()
    mime_type = file.content_type or "image/jpeg"

    # Step 1: Analyze image using Groq vision provider to get text description
    vision = get_vision_provider()
    try:
        vision_data = vision.analyze(file_bytes, mime_type)
        # Handle potential case variations like 'Name' vs 'name'
        vision_data_lower = {k.lower(): v for k, v in vision_data.items()}
        dish_name = vision_data_lower.get("name", "Unknown Meal")
        dish_description = vision_data_lower.get("description", "")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision API Error: {str(e)}")

    if not dish_description or len(dish_description) < 3:
        raise HTTPException(status_code=400, detail="Could not identify food in the image.")

    # Step 2: Retrieve nutritional data from Edamam
    nutrition_service = EdamamNutritionProvider()
    nutrients = nutrition_service.analyze(dish_description)

    # Step 3: Save image to disk
    ext = mime_type.split("/")[-1] if "/" in mime_type else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    os.makedirs("uploads", exist_ok=True)
    filepath = os.path.join("uploads", filename)
    with open(filepath, "wb") as f:
        f.write(file_bytes)
    
    image_url = f"/uploads/{filename}"

    return FoodAnalysisResponse(
        name=dish_name,
        description=dish_description,
        calories_kcal=nutrients.calories,
        carbs_g=nutrients.carbs,
        protein_g=nutrients.protein,
        fat_g=nutrients.fat,
        sodium_mg=nutrients.sodium,
        potassium_mg=nutrients.potassium,
        image_url=image_url
    )

@router.post("/log", response_model=FoodLogResponse)
async def log_food(
    data: FoodAnalysisResponse,
    current_user: User = Depends(get_current_patient),
    session: Session = Depends(get_session)
):
    """Log pre-analyzed food data to database and trigger sodium limit alerts"""
    new_log = FoodLogs(
        patient_id=current_user.id,
        image_url=data.image_url,
        name=data.name,
        description=data.description,
        calories_kcal=data.calories_kcal,
        carbs_g=data.carbs_g,
        protein_g=data.protein_g,
        fat_g=data.fat_g,
        sodium_mg=data.sodium_mg,
        potassium_mg=data.potassium_mg
    )
    
    session.add(new_log)
    session.commit()
    session.refresh(new_log)

    # Auto-generate clinical alerts for exceeded dietary targets based on daily totals
    stmt = select(DietaryTargets).where(DietaryTargets.patient_id == current_user.id)
    targets = session.exec(stmt).first()
    if targets:
        # Fetch all food logs for this patient on the same day as this log
        new_log_date = new_log.logged_at.date()
        stmt_logs = select(FoodLogs).where(FoodLogs.patient_id == current_user.id)
        all_logs = session.exec(stmt_logs).all()
        todays_logs = [log for log in all_logs if log.logged_at.date() == new_log_date]
        
        # Calculate daily cumulative totals
        total_sodium = sum(log.sodium_mg for log in todays_logs)
        total_calories = sum(log.calories_kcal for log in todays_logs)
        total_carbs = sum(log.carbs_g for log in todays_logs)
        
        # Fetch existing alerts generated today to prevent duplicates
        stmt_alerts = select(ClinicalAlerts).where(ClinicalAlerts.patient_id == current_user.id)
        all_alerts = session.exec(stmt_alerts).all()
        todays_alert_types = {
            a.alert_type for a in all_alerts if a.created_at.date() == new_log_date
        }
        
        new_alerts = []
        
        # Check Sodium (Critical threshold > 150%, Warning threshold > 100%)
        if targets.sodium_mg:
            if total_sodium > targets.sodium_mg * 1.5:
                if "CRITICAL_SODIUM" not in todays_alert_types:
                    new_alerts.append(ClinicalAlerts(
                        patient_id=current_user.id,
                        alert_type="CRITICAL_SODIUM",
                        message=f"Daily sodium limit critically exceeded: {total_sodium:.0f}mg consumed today (limit: {targets.sodium_mg:.0f}mg, {int(total_sodium / targets.sodium_mg * 100)}% of target)"
                    ))
            elif total_sodium > targets.sodium_mg:
                if "WARNING_SODIUM" not in todays_alert_types:
                    new_alerts.append(ClinicalAlerts(
                        patient_id=current_user.id,
                        alert_type="WARNING_SODIUM",
                        message=f"Daily sodium limit exceeded: {total_sodium:.0f}mg consumed today (limit: {targets.sodium_mg:.0f}mg, {int(total_sodium / targets.sodium_mg * 100)}% of target)"
                    ))
                    
        # Check Calories (> 100%)
        if targets.calories_kcal and total_calories > targets.calories_kcal:
            if "WARNING_CALORIES" not in todays_alert_types:
                new_alerts.append(ClinicalAlerts(
                    patient_id=current_user.id,
                    alert_type="WARNING_CALORIES",
                    message=f"Daily calorie limit exceeded: {total_calories:.0f}kcal consumed today (limit: {targets.calories_kcal:.0f}kcal, {int(total_calories / targets.calories_kcal * 100)}% of target)"
                ))
                
        # Check Carbs (> 100%)
        if targets.carbs_g and total_carbs > targets.carbs_g:
            if "WARNING_CARBS" not in todays_alert_types:
                new_alerts.append(ClinicalAlerts(
                    patient_id=current_user.id,
                    alert_type="WARNING_CARBS",
                    message=f"Daily carbohydrate limit exceeded: {total_carbs:.0f}g consumed today (limit: {targets.carbs_g:.0f}g, {int(total_carbs / targets.carbs_g * 100)}% of target)"
                ))
                
        for alert in new_alerts:
            session.add(alert)
        if new_alerts:
            session.commit()

    return new_log
