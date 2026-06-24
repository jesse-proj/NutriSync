import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    # JWT authentication settings
    # In production, this MUST be a strong, randomly generated secret key.
    SECRET_KEY: str = "dev-secret-key-nutrisync-rpm-1234567890-secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database configuration
    DATABASE_URL: str = "sqlite:///./nutrisync.db"

    # CORS Configuration for decoupled React frontend
    # Comma-separated list in env vars, converted to a list of strings
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Groq API
    GROQ_API_KEY: str = ""

    # LogMeal API
    LOGMEAL_API_KEY: str = ""

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
