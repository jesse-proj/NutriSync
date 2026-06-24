import requests

token = "9c81d85a10bce6b7321741d5b1abb9b6663d47f1"
url = "https://api.logmeal.es/v2/image/segmentation/complete"
headers = {"Authorization": f"Bearer {token}"}

dummy_image_path = "dummy.jpg"
try:
    with open(dummy_image_path, "rb") as f:
        files = {"image": f}
        response = requests.post(url, headers=headers, files=files)
        print("Status:", response.status_code)
        print("Body:", response.text)
except Exception as e:
    print("Error:", e)
