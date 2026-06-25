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
    """Log pre-analyzed food data to database"""
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
    
    return new_log
