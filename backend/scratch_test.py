import requests
import json

token = "9c81d85a10bce6b7321741d5b1abb9b6663d47f1"
url = "https://api.logmeal.es/v2/image/segmentation/complete"
headers = {"Authorization": f"Bearer {token}"}

# Download a real food image (pizza)
image_url = "https://upload.wikimedia.org/wikipedia/commons/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg"
img_data = requests.get(image_url).content

with open("test_food.jpg", "wb") as f:
    f.write(img_data)

try:
    with open("test_food.jpg", "rb") as f:
        files = {"image": f}
        response = requests.post(url, headers=headers, files=files)
        print("Status:", response.status_code)
        
        data = response.json()
        print(json.dumps(data, indent=2))
        
except Exception as e:
    print("Error:", e)
