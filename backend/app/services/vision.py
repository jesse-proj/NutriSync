import io
import json
import base64
from typing import Optional
from PIL import Image
from groq import Groq

from app.config import settings


class GroqVisionProvider:
    """Vision provider using Groq's llama-4-scout vision model to output natural text."""

    MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY_TWO)

    def compress_image(self, image_bytes: bytes, max_size: int = 1_000_000) -> tuple[bytes, str]:
        """Compress image if it exceeds max_size. Returns (bytes, mime_type)."""
        if len(image_bytes) <= max_size:
            return image_bytes, "image/jpeg"

        image = Image.open(io.BytesIO(image_bytes))
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)

        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=85)
        result = buffer.getvalue()

        if len(result) > max_size:
            buffer = io.BytesIO()
            image.save(buffer, format="JPEG", quality=60)
            result = buffer.getvalue()

        return result, "image/jpeg"

    def analyze(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> list[dict]:
        """
        Analyze a food image and return a list of food segments with nutritional info.
        Each segment: {"name": str, "nutritional_info": {"calories": float, "macronutrients": {"carbohydrates": float, "proteins": float, "fat": float}, "micronutrients": {"sodium": float, "potassium": float}}}
        """
        image_bytes, mime_type = self.compress_image(image_bytes)
        b64_image = base64.b64encode(image_bytes).decode("utf-8")

        response = self.client.chat.completions.create(
            model=self.MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Analyze this food image. Identify each dish/ingredient and estimate its nutritional content.\n"
                                "Return a JSON array of objects with this structure:\n"
                                '[{"name": "1 bowl of pork sinigang", "nutritional_info": {"calories": 350, "macronutrients": {"carbohydrates": 45, "proteins": 25, "fat": 12}, "micronutrients": {"sodium": 800, "potassium": 600}}]\n'
                                "Return ONLY the JSON array, no markdown, no explanations."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{b64_image}",
                            },
                        },
                    ],
                }
            ],
            temperature=0.0,
            max_tokens=512,
        )

        raw = response.choices[0].message.content.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()
        return json.loads(raw)

def get_vision_provider() -> GroqVisionProvider:
    """Factory: returns the Groq vision provider for text descriptions."""
    return GroqVisionProvider()
