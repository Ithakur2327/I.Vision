from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.models.models import KnowledgeSource, Chat
from app.core.security import get_current_user_id

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("")
def universal_search(
    q: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    chats = (
        db.query(Chat)
        .filter(Chat.owner_id == user_id, Chat.title.ilike(f"%{q}%"))
        .limit(10)
        .all()
    )
    knowledge = (
        db.query(KnowledgeSource)
        .filter(KnowledgeSource.owner_id == user_id, KnowledgeSource.title.ilike(f"%{q}%"))
        .limit(10)
        .all()
    )
    return {
        "chats": [{"id": c.id, "title": c.title} for c in chats],
        "knowledge": [{"id": k.id, "title": k.title, "type": k.type} for k in knowledge],
    }
