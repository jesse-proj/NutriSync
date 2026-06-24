import requests
from pydantic import BaseModel
from fastapi import HTTPException
from app.config import settings

class NutritionResult(BaseModel):
    calories: float = 0.0
    carbs: float = 0.0
    protein: float = 0.0
    fat: float = 0.0
    sodium: float = 0.0
    potassium: float = 0.0

class EdamamNutritionProvider:
    """Service to parse natural language food descriptions into nutritional data using Edamam."""
    
    def __init__(self):
        self.app_id = settings.EDAMAM_APP_ID
        self.app_key = settings.EDAMAM_APP_KEY
        self.url = "https://api.edamam.com/api/nutrition-data"

    def analyze(self, description: str) -> NutritionResult:
        if not description or not description.strip():
            return NutritionResult()

        params = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "ingr": description
        }

        try:
            response = requests.get(self.url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Nutrition API Error: {str(e)}")

        result = NutritionResult()
        
        ingredients = data.get("ingredients", [])
        if not ingredients:
            # Maybe the API failed to parse it completely
            return result

        # Iterate through parsed ingredients to sum up the nutrients
        for ing in ingredients:
            parsed_list = ing.get("parsed", [])
            for parsed_item in parsed_list:
                nutrients = parsed_item.get("nutrients", {})
                
                result.calories += nutrients.get("ENERC_KCAL", {}).get("quantity", 0.0)
                result.carbs += nutrients.get("CHOCDF", {}).get("quantity", 0.0)
                result.protein += nutrients.get("PROCNT", {}).get("quantity", 0.0)
                result.fat += nutrients.get("FAT", {}).get("quantity", 0.0)
                result.sodium += nutrients.get("NA", {}).get("quantity", 0.0)
                result.potassium += nutrients.get("K", {}).get("quantity", 0.0)

        return result
