from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_ROOT.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    docnest_env: str = "development"
    docnest_secret_key: str = "dev-only-change-me"
    docnest_master_key: str = ""
    database_url: str = "sqlite:///./docnest.db"
    access_token_expire_minutes: int = 480
    cors_origins: str = "http://localhost:5173"
    storage_dir: str = "./storage"
    max_upload_mb: int = 10
    integrity_mode: str = "database"
    blockchain_enabled: bool = False
    blockchain_rpc_url: str = "http://127.0.0.1:8545"
    blockchain_contract_address: str = ""
    blockchain_private_key: str = ""
    email_notifications_enabled: bool = False
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "docnest@localhost"

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def storage_path(self) -> Path:
        path = Path(self.storage_dir)
        if not path.is_absolute():
            path = BACKEND_ROOT / path
        path.mkdir(parents=True, exist_ok=True)
        (path / "documents").mkdir(exist_ok=True)
        (path / "keys").mkdir(exist_ok=True)
        return path


@lru_cache
def get_settings() -> Settings:
    return Settings()
