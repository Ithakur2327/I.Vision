from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class ChatCreate(BaseModel):
    title: Optional[str] = "New Chat"


class ChatOut(BaseModel):
    id: str
    title: str
    is_pinned: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    content: str


class Citation(BaseModel):
    source_title: str
    chunk_text: str
    score: float


class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    citations: List[Citation] = []
    created_at: datetime

    class Config:
        from_attributes = True


class KnowledgeSourceOut(BaseModel):
    id: str
    type: str
    title: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
