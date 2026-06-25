import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

try:
    groq_client = Groq(api_key=api_key)
    chat_completion = groq_client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": "Test prompt",
            }
        ],
        model="llama3-8b-8192",
    )
    print("Success:", chat_completion.choices[0].message.content)
except Exception as e:
    print("Error:", str(e))
    import traceback
    traceback.print_exc()
