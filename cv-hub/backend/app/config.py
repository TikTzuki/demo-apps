import os
from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # When empty, these are derived from CVHUB_DATA_DIR (desktop build) or
    # fall back to the Postgres/local-dir defaults used by Docker & dev.
    DATABASE_URL: str = ""
    ANTHROPIC_API_KEY: str = "your-api-key-here"
    ANTHROPIC_API_BASE_URL: str | None = None
    ANTHROPIC_MODEL: str = "claude-sonnet-4-6"
    UPLOAD_DIR: str = ""
    ADMIN_KEY: str = "changeme"
    GOOGLE_SERVICE_ACCOUNT_JSON: str = "/secrets/google-sa.json"
    PUBLIC_BASE_URL: str = ""

    # Set by the desktop sidecar to a writable per-user directory
    # (e.g. ~/Library/Application Support/inc.newera.cvhub). When present,
    # the SQLite database and uploads live inside it.
    CVHUB_DATA_DIR: str = ""

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @model_validator(mode="after")
    def _derive_paths(self) -> "Settings":
        data_dir: Path | None = None
        if self.CVHUB_DATA_DIR:
            data_dir = Path(self.CVHUB_DATA_DIR).expanduser()
            data_dir.mkdir(parents=True, exist_ok=True)

        if not self.DATABASE_URL:
            if data_dir is not None:
                db_path = data_dir / "cvhub.db"
                self.DATABASE_URL = f"sqlite:///{db_path}"
            else:
                self.DATABASE_URL = (
                    "postgresql+psycopg://postgres:postgres@localhost:5432/cv_hub"
                )

        if not self.UPLOAD_DIR:
            self.UPLOAD_DIR = (
                str(data_dir / "uploads") if data_dir is not None else "./uploads"
            )

        return self

    @property
    def upload_path(self) -> Path:
        path = Path(self.UPLOAD_DIR)
        path.mkdir(parents=True, exist_ok=True)
        return path


settings = Settings()
