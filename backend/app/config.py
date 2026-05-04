"""MindCare AI — Backend configuration via Pydantic BaseSettings."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "MindCare AI API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql://mindcare:mindcare@localhost:5432/mindcare_db"

    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET_KEY: str = "mindcare-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 hours

    GEMINI_API_KEY: str = ""

    ADMIN_PASSWORD: str = ""

    CORS_ORIGINS: list[str] = ["http://localhost:3000", "https://mindcare-ai.vercel.app"]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
