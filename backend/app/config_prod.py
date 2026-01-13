from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Additional production settings
    debug: bool = False
    cors_allow_origins: str = "*"  # In production, specify exact origins

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()