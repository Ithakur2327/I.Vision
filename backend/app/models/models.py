import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Text, Boolean, DateTime, ForeignKey, Integer, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


def gen_uuid():
    return str(uuid.uuid4())


class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    status = Column(String, default="active")

    chats = relationship("Chat", back_populates="owner", cascade="all, delete-orphan")
    knowledge_sources = relationship(
        "KnowledgeSource", back_populates="owner", cascade="all, delete-orphan"
    )
    settings = relationship(
        "UserSettings", uselist=False, back_populates="owner", cascade="all, delete-orphan"
    )


class Chat(Base, TimestampMixin):
    __tablename__ = "chats"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    owner_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    title = Column(String, default="New Chat")
    is_pinned = Column(Boolean, default=False)
    status = Column(String, default="active")

    owner = relationship("User", back_populates="chats")
    messages = relationship(
        "Message", back_populates="chat", cascade="all, delete-orphan",
        order_by="Message.created_at"
    )


class Message(Base, TimestampMixin):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    chat_id = Column(UUID(as_uuid=False), ForeignKey("chats.id"), nullable=False)
    role = Column(String, nullable=False)  # user | assistant
    content = Column(Text, nullable=False)
    citations = Column(JSON, default=list)
    status = Column(String, default="complete")

    chat = relationship("Chat", back_populates="messages")


class KnowledgeSource(Base, TimestampMixin):
    __tablename__ = "knowledge_sources"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    owner_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # document | github | youtube | website | leetcode
    title = Column(String, nullable=False)
    tags = Column(JSON, default=list)
    status = Column(String, default="pending")  # pending | processing | ready | failed

    owner = relationship("User", back_populates="knowledge_sources")
    documents = relationship(
        "Document", back_populates="source", cascade="all, delete-orphan"
    )
    embeddings = relationship(
        "EmbeddingMetadata", back_populates="source", cascade="all, delete-orphan"
    )


class Document(Base, TimestampMixin):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    source_id = Column(UUID(as_uuid=False), ForeignKey("knowledge_sources.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    size_bytes = Column(Integer, default=0)
    status = Column(String, default="pending")

    source = relationship("KnowledgeSource", back_populates="documents")


class GitHubRepository(Base, TimestampMixin):
    __tablename__ = "github_repositories"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    owner_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    repo_url = Column(String, nullable=False)
    default_branch = Column(String, default="main")
    status = Column(String, default="pending")


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    owner_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="active")


class WebsiteSource(Base, TimestampMixin):
    __tablename__ = "website_sources"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    owner_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    url = Column(String, nullable=False)
    status = Column(String, default="pending")


class YouTubeSource(Base, TimestampMixin):
    __tablename__ = "youtube_sources"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    owner_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    url = Column(String, nullable=False)
    title = Column(String, nullable=True)
    status = Column(String, default="pending")


class LeetCodeProfile(Base, TimestampMixin):
    __tablename__ = "leetcode_profiles"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    owner_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    username = Column(String, nullable=False)
    solved_data = Column(JSON, default=dict)
    status = Column(String, default="pending")


class EmbeddingMetadata(Base, TimestampMixin):
    __tablename__ = "embeddings_metadata"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    source_id = Column(UUID(as_uuid=False), ForeignKey("knowledge_sources.id"), nullable=False)
    qdrant_point_id = Column(String, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)

    source = relationship("KnowledgeSource", back_populates="embeddings")


class Memory(Base, TimestampMixin):
    __tablename__ = "memory"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    owner_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    kind = Column(String, nullable=False)  # conversation | long_term | preference
    content = Column(Text, nullable=False)


class UserSettings(Base, TimestampMixin):
    __tablename__ = "settings"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    owner_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), unique=True, nullable=False)
    theme = Column(String, default="dark")
    ai_model = Column(String, default="llama-3.3-70b-versatile")
    voice_enabled = Column(Boolean, default=False)

    owner = relationship("User", back_populates="settings")


class ActivityLog(Base, TimestampMixin):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    owner_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    event_type = Column(String, nullable=False)
    detail = Column(JSON, default=dict)
