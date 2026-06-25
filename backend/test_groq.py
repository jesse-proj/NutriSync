import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

try:
    groq_client = Groq(api_key=api_key)
    models = groq_client.models.list()
    print("Available models:")
    for m in models.data:
        print(f"- {m.id}")
except Exception as e:
    print("Error:", str(e))
