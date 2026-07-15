import os
from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env explicitly. Without this, env vars are only picked up
# when Docker Compose injects them directly — running via `uvicorn` locally
# (no Docker) would silently fall back to the Docker-only defaults below.
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")


class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://ivision:ivision@postgres:5432/ivision"
    )
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://qdrant:6333")
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/app/uploads")
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DIM: int = 384
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 120


settings = Settings()