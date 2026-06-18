"""Application configuration and settings."""

import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# Load .env file
env_path = Path(__file__).parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings(BaseSettings):
    """Application settings from environment variables."""
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")
    
    # Application
    APP_NAME: str = "AI & SaaS Project Tracker"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+psycopg://gestionale:secret@localhost:5432/gestionaledb")
    
    # Redis/Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
    
    # Auth
    SECRET_KEY: str = "qx-sk-2026-dev-9f8e7d6c5b4a"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALGORITHM: str = "HS256"
    ADMIN_USERNAME: str = "quixel"
    ADMIN_PASSWORD: str = "Qx#2026!DevKey"
    ADMIN_EMAIL: str = "admin@quixel.com"

    # Encryption
    ENCRYPTION_KEY: str = "qx-enc-2026-dev-3a2b1c4d5e6f"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:4100",
        "http://localhost:8000",
        "https://quixel-gestionale.vercel.app",
        "https://frontend-git-*.vercel.app",
        "https://frontend-*.vercel.app",
    ]

    # External API Keys (Optional)
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    GITHUB_WEBHOOK_SECRET: Optional[str] = None

    SUPABASE_ACCESS_TOKEN: Optional[str] = None
    SUPABASE_WEBHOOK_SECRET: Optional[str] = None

    VERCEL_ACCESS_TOKEN: Optional[str] = None
    VERCEL_WEBHOOK_SECRET: Optional[str] = None

    # AI Provider API Keys (Optional - can be added via UI)
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_AI_API_KEY: Optional[str] = None
    MISTRAL_API_KEY: Optional[str] = None
    COHERE_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    TOGETHER_API_KEY: Optional[str] = None

    # Rate Limiting (not yet implemented)
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_PERIOD: int = 60  # seconds

    # Alert Thresholds
    CREDIT_LOW_THRESHOLD_PERCENT: float = 20.0  # Alert when credits < 20%
    CREDIT_CRITICAL_THRESHOLD_PERCENT: float = 10.0  # Critical when < 10%
    
# Global settings instance
settings = Settings()
