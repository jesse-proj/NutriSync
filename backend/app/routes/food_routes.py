from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session
from pydantic import BaseModel

from app.database import get_session
from app.models import User, UserRole, FoodLogs
from app.auth import get_current_user
from app.services.vision import get_vision_provider
from app.services.nutrition import EdamamNutritionProvider
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

class FoodAnalysisResponse(BaseModel):
    description: str
    sodium_mg: float
    carbs_g: float
    calories_kcal: float
    potassium_mg: float
    protein_g: float
    fat_g: float

@router.post("/analyze-photo", response_model=FoodAnalysisResponse)
async def analyze_food_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_patient)
):
    """Analyze food photo without saving to database"""
    # Read the uploaded image
    file_bytes = await file.read()
    mime_type = file.content_type or "image/jpeg"

    # Step 1: Analyze image using Groq vision provider
    vision = get_vision_provider()
    try:
        segments = vision.analyze(file_bytes, mime_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision API Error: {str(e)}")

    if not segments:
        raise HTTPException(status_code=400, detail="Could not identify food in the image.")

    # Aggregate nutritional info
    dish_names = []
    total_calories = 0.0
    total_sodium = 0.0
    total_carbs = 0.0
    total_potassium = 0.0
    total_proteins = 0.0
    total_fat = 0.0

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

    return FoodAnalysisResponse(
        description=final_description,
        calories_kcal=total_calories,
        carbs_g=total_carbs,
        protein_g=total_proteins,
        fat_g=total_fat,
        sodium_mg=total_sodium,
        potassium_mg=total_potassium
    )

@router.post("/log", response_model=FoodLogResponse)
async def log_food(
    data: FoodAnalysisResponse,
    current_user: User = Depends(get_current_patient),
    session: Session = Depends(get_session)
):
    """Log pre-analyzed food data to database"""
    new_log = FoodLogs(
        patient_id=current_user.id,
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
    
    return new_log

@router.post("/log-photo", response_model=FoodLogResponse)
async def log_food_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_patient),
    session: Session = Depends(get_session)
):
    # Read the uploaded image
    file_bytes = await file.read()
    mime_type = file.content_type or "image/jpeg"

    # Step 1: Analyze image using Groq vision provider
    vision = get_vision_provider()
    try:
        segments = vision.analyze(file_bytes, mime_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision API Error: {str(e)}")

    if not segments:
        raise HTTPException(status_code=400, detail="Could not identify food in the image.")

    # Aggregate nutritional info
    dish_names = []
    total_calories = 0.0
    total_sodium = 0.0
    total_carbs = 0.0
    total_potassium = 0.0
    total_proteins = 0.0
    total_fat = 0.0

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
        calories_kcal=total_calories,
        carbs_g=total_carbs,
        protein_g=total_proteins,
        fat_g=total_fat,
        sodium_mg=total_sodium,
        potassium_mg=total_potassium
    )
    
    session.add(new_log)
    session.commit()
    session.refresh(new_log)
    
    return new_log
