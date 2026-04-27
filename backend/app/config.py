from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    database_url: str
    secret_key: str
    environment: str = "development"
    cors_origins: List[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @property
    def is_development(self) -> bool:
        return self.environment == "development"


settings = Settings()
