from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import Base, engine
from app.models import models  # noqa: F401 ensures models are registered
from app.api.routes import auth, chat, knowledge, integrations, search

app = FastAPI(title="i.vision API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
