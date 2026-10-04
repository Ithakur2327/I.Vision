from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.limiter import limiter
from app.db.session import Base, engine
from app.models import models  # noqa: F401 ensures models are registered
from app.api.routes import auth, chat, knowledge, integrations, search, settings as settings_routes

app = FastAPI(title="i.vision API", version="0.1.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ivision-backend"}


app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(knowledge.router)
app.include_router(integrations.router)
app.include_router(search.router)
app.include_router(settings_routes.router)