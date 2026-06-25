import os
from typing import List, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # JWT — no default forces explicit configuration
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "sqlite:///./nutrisync.db"

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # API keys — None forces you to check before use
    GROQ_API_KEY: Optional[str] = None
    GROQ_API_KEY_VISION: Optional[str] = None  # Renamed for clarity
    EDAMAM_APP_ID: Optional[str] = None
    EDAMAM_APP_KEY: Optional[str] = None

    @field_validator("ALGORITHM")
    @classmethod
    def validate_algorithm(cls, v: str) -> str:
        if v not in {"HS256", "HS384", "HS512"}:
            raise ValueError(f"Insecure or unsupported algorithm: {v}")
        return v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            result = [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            result = v
        else:
            result = ["http://localhost:5173", "http://127.0.0.1:5173"]

        if "*" in result:
            raise ValueError("Wildcard CORS origin is not permitted")
        return result

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def warn_sqlite_in_prod(cls, v: str) -> str:
        if "sqlite" in v and os.getenv("ENV", "development") == "production":
            raise ValueError("SQLite is not supported in production")
        return v

    model_config = SettingsConfigDict(
        env_file=os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            ".env",
        ),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()