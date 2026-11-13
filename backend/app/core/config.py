import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sellsy - AI-Powered E-commerce Intelligence"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Server Port
    PORT: int = int(os.getenv("PORT", 8000))
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sellsy_super_secret_production_key_change_in_prod_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    # Defaults to SQLite locally if DATABASE_URL is not set or if postgres is unavailable
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sellsy.db")
    
    # AI - Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    
    # Shopify Integration Credentials
    SHOPIFY_API_KEY: str = os.getenv("SHOPIFY_API_KEY", "")
    SHOPIFY_API_SECRET: str = os.getenv("SHOPIFY_API_SECRET", "")
    SHOPIFY_SCOPES: str = "read_products,read_orders,read_customers,read_analytics"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://sellsy.vercel.app"
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str], None]) -> List[str]:
        raw = os.getenv("CORS_ORIGINS") or os.getenv("BACKEND_CORS_ORIGINS") or v
        if isinstance(raw, str):
            if raw.strip().startswith("["):
                import json
                try:
                    return json.loads(raw)
                except Exception:
                    pass
            return [i.strip() for i in raw.split(",") if i.strip()]
        elif isinstance(raw, (list, tuple)):
            return list(raw)
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "https://sellsy.vercel.app"
        ]

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )

settings = Settings()
