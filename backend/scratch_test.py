import requests
import json

token = "9c81d85a10bce6b7321741d5b1abb9b6663d47f1"
headers = {"Authorization": f"Bearer {token}"}

# Use the imageId we got from the previous log
url = "https://api.logmeal.com/v2/nutrition/recipe/nutritionalInfo"
try:
    response = requests.post(url, headers=headers, json={"imageId": 2110741})
    print("Status:", response.status_code)
    data = response.json()
    print(json.dumps(data, indent=2))
except Exception as e:
    print("Error:", e)
