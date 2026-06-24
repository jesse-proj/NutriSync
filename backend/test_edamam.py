import requests
import json

APP_ID = "0a230298"
APP_KEY = "d1ac001773a1dd5365f6ffad576df2e2"
TEXT = "1 bowl of chicken noodle soup"

url = "https://api.edamam.com/api/nutrition-data"
params = {
    "app_id": APP_ID,
    "app_key": APP_KEY,
    "ingr": TEXT
}

print(f"Testing Edamam API with text: '{TEXT}'...")

response = requests.get(url, params=params)

if response.status_code == 200:
    data = response.json()
    print("\n=== SUCCESS ===")
    print(f"Calories: {data.get('calories')}")
    print(f"Total Weight: {data.get('totalWeight')}g")
    
    print("\nDiet Labels:", data.get("dietLabels", []))
    health_labels = data.get("healthLabels", [])
    print(f"Health Labels ({len(health_labels)} total):", health_labels[:5], "...")
    
    nutrients = data.get("totalNutrients", {})
    print("\nMacronutrients:")
    for key in ["PROCNT", "FAT", "CHOCDF"]:
        nutrient = nutrients.get(key, {})
        if nutrient:
            print(f"  {nutrient.get('label')}: {nutrient.get('quantity', 0):.1f}{nutrient.get('unit', '')}")
    
    print("\n--- Snippet of Raw JSON Response ---")
    
    # We'll just print a subset of the JSON so it doesn't flood the terminal
    subset = {
        "calories": data.get("calories"),
        "totalWeight": data.get("totalWeight"),
        "ingredients": data.get("ingredients", [])
    }
    print(json.dumps(subset, indent=2))
else:
    print(f"Error {response.status_code}: {response.text}")
