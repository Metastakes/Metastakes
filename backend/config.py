"""
NeuroBridge AI - Configuration Management
Loads environment variables and provides app configuration
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # Application
    APP_NAME: str = "NeuroBridge AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # API
    API_BASE_URL: str = "http://localhost:8000"

    # Database
    DATABASE_URL: str = "postgresql://neurobridge:neurobridge_dev_password@localhost:5432/neurobridge_dev"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_SESSION_TTL: int = 900  # 15 minutes

    # JWT Authentication
    JWT_SECRET: str = "your-super-secret-jwt-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Password Hashing
    BCRYPT_ROUNDS: int = 12

    # Google Cloud Platform
    GCP_PROJECT_ID: Optional[str] = None
    GCP_REGION: str = "us-east1"
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None

    # Vertex AI (Gemini)
    VERTEX_AI_PROJECT: Optional[str] = None
    VERTEX_AI_LOCATION: str = "us-central1"
    GEMINI_MODEL: str = "gemini-1.5-flash-001"
    GEMINI_MAX_TOKENS: int = 8192
    GEMINI_TEMPERATURE: float = 0.7
    AI_FEEDBACK_ENABLED: bool = True

    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None

    # Google Calendar
    GOOGLE_CALENDAR_API_KEY: Optional[str] = None
    GOOGLE_OAUTH_CLIENT_ID: Optional[str] = None
    GOOGLE_OAUTH_CLIENT_SECRET: Optional[str] = None

    # Feature Flags
    ENABLE_GAMIFICATION: bool = True
    ENABLE_GLP1_PROGRAMS: bool = True
    ENABLE_AI_TRANSCRIPTION: bool = True
    ENABLE_MENTOR_PORTAL: bool = True
    ENABLE_INSURANCE_BILLING: bool = False

    # HIPAA Compliance
    ENCRYPTION_KEY: Optional[str] = None
    SESSION_TIMEOUT_MINUTES: int = 15
    AUDIT_LOG_RETENTION_YEARS: int = 7
    DATA_RETENTION_DEFAULT_YEARS: int = 7
    DATA_RETENTION_MINOR_AGE_LIMIT: int = 25

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_MAX_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # Logging
    LOG_LEVEL: str = "info"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
