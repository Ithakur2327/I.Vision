from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import UserSettings
from app.schemas.schemas import UserSettingsOut, UserSettingsUpdate
from app.core.security import get_current_user_id

router = APIRouter(prefix="/api/settings", tags=["settings"])


def _get_or_create(db: Session, user_id: str) -> UserSettings:
    # Every user gets a UserSettings row on registration (see auth.py), but
    # this keeps the endpoint safe for any account created before that, or
    # by a path that skips it (e.g. a future admin/import script).
    row = db.query(UserSettings).filter(UserSettings.owner_id == user_id).first()
    if not row:
        row = UserSettings(owner_id=user_id)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


@router.get("", response_model=UserSettingsOut)
def get_settings(
    user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    return _get_or_create(db, user_id)


@router.put("", response_model=UserSettingsOut)
def update_settings(
    payload: UserSettingsUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    row = _get_or_create(db, user_id)

    if payload.theme is not None:
        if payload.theme not in ("dark", "light"):
            raise HTTPException(status_code=400, detail="theme must be 'dark' or 'light'")
        row.theme = payload.theme

    if payload.voice_enabled is not None:
        row.voice_enabled = payload.voice_enabled

    db.commit()
    db.refresh(row)
    return row