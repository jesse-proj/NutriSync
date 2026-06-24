import io
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

    def analyze(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> str:
        """
        Analyze a food image and return a natural language description.
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
                                "Analyze this food image. Provide a concise, natural language description of the "
                                "dishes and ingredients shown, including an estimated portion size. "
                                "For example: '1 bowl of pork sinigang', '200g of grilled salmon with 1 cup of white rice'. "
                                "Return ONLY the text description without any markdown, explanations, or JSON formatting."
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
            max_tokens=256,
        )

        return response.choices[0].message.content.strip()

def get_vision_provider() -> GroqVisionProvider:
    """Factory: returns the Groq vision provider for text descriptions."""
    return GroqVisionProvider()
