from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session
from pydantic import BaseModel
import requests
import math

from app.database import get_session
from app.models import User, UserRole, FoodLogs
from app.auth import get_current_user
from app.config import settings

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

    # Call LogMeal Segmentation Endpoint
    url = "https://api.logmeal.es/v2/image/segmentation/complete"
    headers = {"Authorization": f"Bearer {settings.LOGMEAL_API_KEY}"}
    files = {"image": (file.filename, file_bytes, mime_type)}

    try:
        response = requests.post(url, headers=headers, files=files)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        # Strict failure as requested
        raise HTTPException(status_code=500, detail=f"LogMeal API Error: {str(e)}")

    # Parse and aggregate macronutrients
    dish_names = []
    total_calories = 0.0
    total_sodium = 0.0
    total_carbs = 0.0
    total_potassium = 0.0
    total_proteins = 0.0
    total_fat = 0.0

    segments = data.get('segmentation_results', [])
    if not segments:
        raise HTTPException(status_code=400, detail="No food detected in the image.")

    for segment in segments:
        # Get the highest confidence recognition name
        recognition = segment.get('recognition_results', [])
        if recognition:
            dish_names.append(recognition[0].get('name', 'Unknown'))
        
        # Aggregate nutritional info
        nutrients = segment.get('nutritional_info', {})
        total_calories += nutrients.get('calories', 0.0)
        total_carbs += nutrients.get('macronutrients', {}).get('carbohydrates', 0.0)
        total_proteins += nutrients.get('macronutrients', {}).get('proteins', 0.0)
        total_fat += nutrients.get('macronutrients', {}).get('fat', 0.0)
        
        # LogMeal provides micronutrients in a separate dict or at the root level depending on the exact response structure.
        # Assuming typical structure for micronutrients if available, otherwise NaN
        micronutrients = nutrients.get('micronutrients', {})
        
        sodium_val = micronutrients.get('sodium')
        total_sodium += sodium_val if sodium_val is not None else 0.0
        
        potassium_val = micronutrients.get('potassium')
        total_potassium += potassium_val if potassium_val is not None else 0.0

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
