from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.models import Chat, Message
from app.schemas.schemas import ChatCreate, ChatOut, MessageCreate, MessageOut
from app.core.security import get_current_user_id
from app.services.rag import answer_query

router = APIRouter(prefix="/api/chats", tags=["chats"])


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


@router.post("/{chat_id}/messages", response_model=MessageOut)
def send_message(
    chat_id: str,
    payload: MessageCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.owner_id == user_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    user_msg = Message(chat_id=chat_id, role="user", content=payload.content)
    db.add(user_msg)
    db.commit()

    history = [
        {"role": m.role, "content": m.content}
        for m in chat.messages[-10:]
        if m.role in ("user", "assistant")
    ]

    answer, citations = answer_query(user_id, payload.content, history)

    assistant_msg = Message(
        chat_id=chat_id, role="assistant", content=answer, citations=citations
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg
