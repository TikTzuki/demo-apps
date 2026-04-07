from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/cv_hub"
    ANTHROPIC_API_KEY: str = "your-api-key-here"
    ANTHROPIC_API_BASE_URL: str | None = None
    UPLOAD_DIR: str = "./uploads"
    ADMIN_KEY: str = "changeme"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }

    @property
    def upload_path(self) -> Path:
        path = Path(self.UPLOAD_DIR)
        path.mkdir(parents=True, exist_ok=True)
        return path


settings = Settings()
