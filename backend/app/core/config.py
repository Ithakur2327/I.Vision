import os
from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env explicitly, so `uvicorn app.main:app` picks it up
# regardless of which directory you happen to run that command from.
load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")


class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://ivision:ivision@localhost:5432/ivision"
    )
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    QDRANT_API_KEY: str = os.getenv("QDRANT_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    EMBEDDING_DIM: int = 384
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 120

    # Comma-separated list of allowed frontend origins, e.g.
    # "https://app.example.com,https://staging.example.com". Defaults to
    # local dev origins — a wildcard is deliberately not the default since
    # this API sits behind bearer-token auth, not cookies, so there's no
    # reason to accept requests from arbitrary origins in production.
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
        ).split(",")
        if o.strip()
    ]


settings = Settings()