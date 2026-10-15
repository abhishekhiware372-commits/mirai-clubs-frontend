import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MIRAI CLUBS - Club Activities Tracker"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "mirai_clubs_super_secret_production_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/mirai_clubs"
    )
    # Fallback to SQLite if PostgreSQL is unavailable in sandbox/local environment
    USE_SQLITE_FALLBACK: bool = os.getenv("USE_SQLITE_FALLBACK", "true").lower() in ("true", "1")
    SQLITE_URL: str = "sqlite:///./mirai_clubs.db"
    
    # Storage
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", "./uploads")
    CERTIFICATES_DIR: str = os.getenv("CERTIFICATES_DIR", "./generated_certificates")
    
    # Public URL for verification
    PUBLIC_URL: str = os.getenv("PUBLIC_URL", "http://localhost:8000")
    
    class Config:
        case_sensitive = True

settings = Settings()
