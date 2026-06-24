from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session
from pydantic import BaseModel

from app.database import get_session
from app.models import User, UserRole, FoodLogs
from app.auth import get_current_user
from app.services.vision import get_vision_provider

router = APIRouter(prefix="/food", tags=["Food Logs"])

def get_current_patient(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as patient")
    return current_user

class FoodLogResponse(BaseModel):
    id: int
    description: str
    sodium_mg: float
    carbs_g: float
    calories_kcal: float
    potassium_mg: float
    protein_g: float
    fat_g: float

@router.post("/log-photo", response_model=FoodLogResponse)
async def log_food_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_patient),
    session: Session = Depends(get_session)
):
    # Read the uploaded image
    file_bytes = await file.read()
    mime_type = file.content_type or "image/jpeg"

    # Analyze image using configured vision provider
    vision = get_vision_provider()
    try:
        result = vision.analyze(file_bytes, mime_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision API Error: {str(e)}")

    segments = result.get("segments", [])
    if not segments:
        raw = result.get("raw_content", "None")
        raise HTTPException(status_code=400, detail=f"No food detected in the image. Raw response: {raw}")

    # Aggregate nutritional info
    dish_names = []
    total_calories = 0.0
    total_sodium = 0.0
    total_carbs = 0.0
    total_potassium = 0.0
    total_proteins = 0.0
    total_fat = 0.0

<<<<<<< HEAD
=======

>>>>>>> bd362562f9e0f3efe85b05c0d6a4cfca0b854dfd
    for segment in segments:
        dish_names.append(segment.get("name", "Unknown"))

        nutrients = segment.get("nutritional_info") or {}
        total_calories += nutrients.get("calories") or 0.0

        macronutrients = nutrients.get("macronutrients") or {}
        total_carbs += macronutrients.get("carbohydrates") or 0.0
        total_proteins += macronutrients.get("proteins") or 0.0
        total_fat += macronutrients.get("fat") or 0.0

        micronutrients = nutrients.get("micronutrients") or {}
        total_sodium += micronutrients.get("sodium") or 0.0
        total_potassium += micronutrients.get("potassium") or 0.0

    final_description = ", ".join(dish_names) if dish_names else "Unknown Food"

    # Save to database
    new_log = FoodLogs(
        patient_id=current_user.id,
        description=final_description,
        sodium_mg=total_sodium,
        carbs_g=total_carbs,
        calories_kcal=total_calories,
        potassium_mg=total_potassium,
        protein_g=total_proteins,
        fat_g=total_fat,
    )
    
    session.add(new_log)
    session.commit()
    session.refresh(new_log)
    
    return new_log
