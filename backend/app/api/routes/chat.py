import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db, SessionLocal
from app.models.models import Chat, Message
from app.schemas.schemas import ChatCreate, ChatOut, MessageCreate, MessageOut
from app.core.security import get_current_user_id
from app.services import rag

router = APIRouter(prefix="/api/chats", tags=["chats"])


def _derive_title(text: str, max_len: int = 48) -> str:
    """ChatGPT-style auto title from the first message, so chats aren't
    all forever labeled 'New Chat' in the history list."""
    collapsed = " ".join(text.split())
    if len(collapsed) <= max_len:
        return collapsed or "New Chat"
    truncated = collapsed[:max_len].rsplit(" ", 1)[0]
    return (truncated or collapsed[:max_len]) + "…"


def _record_user_message(db: Session, chat: Chat, content: str) -> Message:
    user_msg = Message(chat_id=chat.id, role="user", content=content)
    db.add(user_msg)
    if not chat.title or chat.title == "New Chat":
        chat.title = _derive_title(content)
    chat.updated_at = datetime.utcnow()
    db.commit()
    return user_msg


def _stream_and_persist(chat_id: str, token_stream, citations: list) -> StreamingResponse:
    """Shared SSE plumbing for both /messages/stream and /regenerate.

    persist() intentionally opens its OWN db session rather than reusing the
    request-scoped one: Starlette iterates a sync generator's chunks via a
    threadpool, so by the time this actually runs, FastAPI's dependency
    cleanup for the request's `db` may already have closed it. A
    self-contained session sidesteps that timing entirely.

    Also persists whatever text was generated even if the client
    disconnects partway through (stop-generation), so a cancelled answer
    isn't silently lost.
    """

    def persist(full_text: str):
        session = SessionLocal()
        try:
            msg = Message(
                chat_id=chat_id,
                role="assistant",
                content=full_text or "(no response generated)",
                citations=citations,
            )
            session.add(msg)
            chat = session.query(Chat).filter(Chat.id == chat_id).first()
            if chat:
                chat.updated_at = datetime.utcnow()
            session.commit()
            session.refresh(msg)
            return msg, (chat.title if chat else None)
        finally:
            session.close()

    def event_generator():
        full_text = ""
        try:
            for token in token_stream:
                full_text += token
                yield f"data: {json.dumps({'type': 'chunk', 'text': token})}\n\n"
            msg, chat_title = persist(full_text)
            yield (
                "data: "
                + json.dumps(
                    {
                        "type": "done",
                        "id": msg.id,
                        "chat_title": chat_title,
                        "citations": citations,
                        "created_at": msg.created_at.isoformat(),
                    }
                )
                + "\n\n"
            )
        except GeneratorExit:
            # client disconnected (e.g. "stop generating") — save the
            # partial answer instead of silently discarding it, then
            # re-raise so the generator actually closes
            persist(full_text)
            raise

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("", response_model=ChatOut)
def create_chat(
    payload: ChatCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    chat = Chat(owner_id=user_id, title=payload.title)
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat


@router.get("", response_model=List[ChatOut])
def list_chats(
    user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    return (
        db.query(Chat)
        .filter(Chat.owner_id == user_id, Chat.status == "active")
        .order_by(Chat.updated_at.desc())
        .all()
    )


@router.get("/{chat_id}/messages", response_model=List[MessageOut])
def get_messages(
    chat_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.owner_id == user_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat.messages


@router.delete("/{chat_id}")
def delete_chat(
    chat_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.owner_id == user_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    db.delete(chat)
    db.commit()
    return {"status": "deleted", "id": chat_id}


@router.post("/{chat_id}/messages", response_model=MessageOut)
def send_message(
    chat_id: str,
    payload: MessageCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Non-streaming fallback — kept for API consumers that don't want SSE.
    The main chat UI uses /messages/stream instead."""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.owner_id == user_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    _record_user_message(db, chat, payload.content)

    history = [
        {"role": m.role, "content": m.content}
        for m in chat.messages[-10:]
        if m.role in ("user", "assistant")
    ]

    answer, citations = rag.answer_query(user_id, payload.content, history)

    assistant_msg = Message(
        chat_id=chat_id, role="assistant", content=answer, citations=citations
    )
    db.add(assistant_msg)
    chat.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg


@router.post("/{chat_id}/messages/stream")
def send_message_stream(
    chat_id: str,
    payload: MessageCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.owner_id == user_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    _record_user_message(db, chat, payload.content)

    history = [
        {"role": m.role, "content": m.content}
        for m in chat.messages[-10:]
        if m.role in ("user", "assistant")
    ]

    token_stream, citations = rag.stream_answer(user_id, payload.content, history)
    return _stream_and_persist(chat.id, token_stream, citations)


@router.post("/{chat_id}/messages/{message_id}/regenerate")
def regenerate_message(
    chat_id: str,
    message_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Re-answers the user turn that produced `message_id`, replacing it.
    Unlike calling /messages again with the same text, this does NOT create
    a duplicate user message in history."""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.owner_id == user_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    messages = list(chat.messages)
    idx = next((i for i, m in enumerate(messages) if m.id == message_id), None)
    if idx is None or messages[idx].role != "assistant":
        raise HTTPException(status_code=404, detail="Assistant message not found")

    prior = messages[:idx]
    last_user = next((m for m in reversed(prior) if m.role == "user"), None)
    if not last_user:
        raise HTTPException(status_code=400, detail="No prior question to regenerate from")

    user_idx = prior.index(last_user)
    history = [
        {"role": m.role, "content": m.content}
        for m in prior[max(0, user_idx - 10) : user_idx]
        if m.role in ("user", "assistant")
    ]

    db.delete(messages[idx])
    db.commit()

    token_stream, citations = rag.stream_answer(user_id, last_user.content, history)
    return _stream_and_persist(chat.id, token_stream, citations)