from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import Session
from pydantic import BaseModel
import requests
import math
import io
from PIL import Image

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

    # Compress image if it exceeds 1MB (LogMeal limit)
    if len(file_bytes) > 1000000:
        image = Image.open(io.BytesIO(file_bytes))
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        
        # Resize to max 1024x1024 while maintaining aspect ratio
        image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=85)
        file_bytes = buffer.getvalue()
        mime_type = "image/jpeg"
        
        # If still too large, compress further
        if len(file_bytes) > 1000000:
            buffer = io.BytesIO()
            image.save(buffer, format="JPEG", quality=60)
            file_bytes = buffer.getvalue()

    headers = {"Authorization": f"Bearer {settings.LOGMEAL_API_KEY}"}
    
    # 1. Call LogMeal Dish Recognition Endpoint
    dish_url = "https://api.logmeal.com/v2/image/recognition/dish"
    primary_dish_name = "Unknown Dish"
    try:
        files_dish = {"image": (file.filename, file_bytes, mime_type)}
        response_dish = requests.post(dish_url, headers=headers, files=files_dish)
        response_dish.raise_for_status()
        dish_data = response_dish.json()
        
        recognition = dish_data.get('recognition_results', [])
        if recognition:
            primary_dish_name = recognition[0].get('name', 'Unknown Dish')
    except Exception as e:
        print(f"LogMeal Dish Recognition Warning: {str(e)}")

    # 2. Call LogMeal Segmentation Endpoint
    seg_url = "https://api.logmeal.com/v2/image/segmentation/complete"
    try:
        files_seg = {"image": (file.filename, file_bytes, mime_type)}
        response_seg = requests.post(seg_url, headers=headers, files=files_seg)
        response_seg.raise_for_status()
        data = response_seg.json()
    except requests.exceptions.HTTPError as e:
        error_msg = f"LogMeal API HTTP Error: {response_seg.status_code} - {response_seg.text}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        # Strict failure as requested
        print(f"LogMeal Exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"LogMeal API Error: {str(e)}")

    # Parse and aggregate ingredients
    dish_names = []
    segments = data.get('segmentation_results', [])
    if not segments:
        raise HTTPException(status_code=400, detail="No food detected in the image.")

    for segment in segments:
        recognition = segment.get('recognition_results', [])
        if recognition:
            dish_names.append(recognition[0].get('name', 'Unknown'))

    # 3. Call LogMeal Nutrition Endpoint using imageId
    total_calories = 0.0
    total_sodium = 0.0
    total_carbs = 0.0
    total_potassium = 0.0
    total_proteins = 0.0
    total_fat = 0.0
    
    image_id = data.get('imageId')
    if image_id:
        nutri_url = "https://api.logmeal.com/v2/nutrition/recipe/nutritionalInfo"
        try:
            response_nutri = requests.post(nutri_url, headers=headers, json={"imageId": image_id})
            response_nutri.raise_for_status()
            nutri_data = response_nutri.json()
            
            # Extract totalNutrients block
            nutritional_info = nutri_data.get('nutritional_info') or {}
            total_nutrients = nutritional_info.get('totalNutrients') or {}
            
            # Map LogMeal scientific keys to our columns safely
            total_calories = total_nutrients.get('ENERC_KCAL', {}).get('quantity', 0.0)
            total_carbs = total_nutrients.get('CHOCDF', {}).get('quantity', 0.0)
            total_proteins = total_nutrients.get('PROCNT', {}).get('quantity', 0.0)
            total_fat = total_nutrients.get('FAT', {}).get('quantity', 0.0)
            total_sodium = total_nutrients.get('NA', {}).get('quantity', 0.0)
            total_potassium = total_nutrients.get('K', {}).get('quantity', 0.0)
            
        except Exception as e:
            print(f"LogMeal Nutrition Fetch Warning: {str(e)}")

    ingredient_names = ", ".join(dish_names) if dish_names else "Unknown Ingredients"
    final_description = f"{primary_dish_name.title()} (Includes: {ingredient_names})"

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
