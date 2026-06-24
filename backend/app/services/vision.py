import os
import io
import base64
import requests
from abc import ABC, abstractmethod
from typing import Optional
from PIL import Image
from groq import Groq

from app.config import settings


class VisionProvider(ABC):
    """Abstract base class for food image analysis providers."""

    @abstractmethod
    def analyze(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
        """
        Analyze a food image and return structured nutritional data.

        Returns:
            dict with key "segments" containing list of:
            {
                "name": str,
                "nutritional_info": {
                    "calories": float,
                    "macronutrients": {"carbohydrates": float, "proteins": float, "fat": float},
                    "micronutrients": {"sodium": float, "potassium": float}
                }
            }
        """
        ...

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


class LogMealVisionProvider(VisionProvider):
    """Vision provider using the LogMeal API."""

    def analyze(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
        image_bytes, mime_type = self.compress_image(image_bytes)

        url = "https://api.logmeal.es/v2/image/segmentation/complete"
        headers = {"Authorization": f"Bearer {settings.LOGMEAL_API_KEY}"}
        files = {"image": ("food.jpg", image_bytes, mime_type)}

        response = requests.post(url, headers=headers, files=files, timeout=30)
        response.raise_for_status()
        data = response.json()

        return self._normalize_response(data)

    def _normalize_response(self, data: dict) -> dict:
        """Convert LogMeal response to the standard schema."""
        segments = []
        for segment in data.get("segmentation_results", []):
            recognition = segment.get("recognition_results", [])
            name = recognition[0].get("name", "Unknown") if recognition else "Unknown"

            nutrients = segment.get("nutritional_info") or {}
            macronutrients = nutrients.get("macronutrients") or {}
            micronutrients = nutrients.get("micronutrients") or {}

            segments.append({
                "name": name,
                "nutritional_info": {
                    "calories": nutrients.get("calories") or 0.0,
                    "macronutrients": {
                        "carbohydrates": macronutrients.get("carbohydrates") or 0.0,
                        "proteins": macronutrients.get("proteins") or 0.0,
                        "fat": macronutrients.get("fat") or 0.0,
                    },
                    "micronutrients": {
                        "sodium": micronutrients.get("sodium") or 0.0,
                        "potassium": micronutrients.get("potassium") or 0.0,
                    },
                },
            })

        return {"segments": segments}


class GroqVisionProvider(VisionProvider):
    """Vision provider using Groq's llama-4-scout vision model."""

    MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY_TWO)

    def analyze(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
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
                                "Analyze this food image. Return ONLY a JSON object with this schema "
                                "(no markdown, no explanation):\n"
                                '{\n  "segments": [\n    {\n      "name": "food name",\n      "nutritional_info": {\n        "calories": 0.0,\n        "macronutrients": {"carbohydrates": 0.0, "proteins": 0.0, "fat": 0.0},\n        "micronutrients": {"sodium": 0.0, "potassium": 0.0}\n      }\n    }\n  ]\n}'
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
            max_tokens=1024,
        )

        content = response.choices[0].message.content
        return self._parse_response(content)

    def _parse_response(self, content: str) -> dict:
        """Parse the Groq model text output into the standard schema."""
        import json
        import re

        text = content.strip()
        
        # Sometimes models forget the final closing brackets, or markdown blocks.
        # We try stripping markdown first
        if text.startswith("```"):
            lines = text.split("\n")
            if len(lines) >= 3:
                text = "\n".join(lines[1:-1]).strip()

        # Try multiple suffix combinations in case the JSON is truncated
        suffixes_to_try = ["", "}", "]}", "}]}"]
        
        # Try parsing the text directly first (with suffixes)
        for suffix in suffixes_to_try:
            try:
                data = json.loads(text + suffix)
                if "segments" in data:
                    return data
            except json.JSONDecodeError:
                continue
                
        # If direct parsing failed, try extracting via regex
        match = re.search(r'(\{.*\})', text, re.DOTALL)
        if match:
            extracted = match.group(1)
            for suffix in suffixes_to_try:
                try:
                    data = json.loads(extracted + suffix)
                    if "segments" in data:
                        return data
                except json.JSONDecodeError:
                    continue

        print(f"Failed to parse Groq response or no segments found.\nRaw content: {content}")
        return {"segments": [], "raw_content": content}


def get_vision_provider() -> VisionProvider:
    """Factory: return the configured vision provider based on VISION_PROVIDER env var."""
    provider = os.getenv("VISION_PROVIDER", "groq").lower()
    if provider == "logmeal":
        return LogMealVisionProvider()
    return GroqVisionProvider()
